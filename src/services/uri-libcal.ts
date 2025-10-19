import { roomItemIds, libraryConfig } from './config'
import type { Room, Availability } from '@/types'

// URI LibCal API Service
export class URILibCalService {
  private baseUrl = '/api/libcal' // Use proxy instead of direct URL
  private token = import.meta.env.VITE_LIBCAL_TOKEN || ''

  constructor() {
    if (!this.token) {
      console.warn(
        '⚠️ LibCal API token not found in environment variables. Please check your .env file.',
      )
    }
  }

  // Helper method for API requests
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    console.log('🔑 Making authenticated request to:', url)
    console.log('🔧 This should proxy to: https://uri.libcal.com/api/1.1' + endpoint)

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error: ${response.status} ${response.statusText}`)
      console.error(`📄 Response body:`, errorText)
      console.error(`🔗 Request URL:`, url)

      if (response.status === 401) {
        console.error('🔑 Authentication failed - token may be expired or invalid')
        console.error('💡 Suggestion: Check if LibCal uses OAuth2 instead of static tokens')
      }

      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
      )
    }

    return response.json()
  }

  // 🏠 GET ROOMS - Fetch room information for all item IDs
  async getRooms(): Promise<Room[]> {
    try {
      console.log('🧪 Testing API authentication and endpoints...')

      // First, let's test if our proxy is working by checking the proxy path
      console.log('🔍 Testing proxy configuration...')

      // Test very basic endpoints that should exist on any LibCal installation
      const basicEndpoints = [
        '/space/locations', // Should list available locations/libraries
        '/space/categories', // Should list space categories
        '/hours', // Should show library hours
        '/space/item/211617', // Test one specific room ID
      ]

      console.log('🔍 Testing basic LibCal endpoints...')
      let workingEndpoint = null

      for (const endpoint of basicEndpoints) {
        try {
          console.log(`🧪 Testing: ${endpoint}`)
          const result = await this.makeRequest<Record<string, unknown>>(endpoint)
          console.log(`✅ SUCCESS - ${endpoint}:`, result)
          workingEndpoint = endpoint
          break // Stop at first successful endpoint
        } catch (error) {
          console.warn(`❌ FAILED - ${endpoint}:`, error)
        }
      }

      if (!workingEndpoint) {
        console.error('🚫 No basic endpoints worked - this suggests:')
        console.error('   - Proxy configuration issue')
        console.error('   - LibCal API structure is different at URI')
        console.error('   - Token permissions are very limited')
        console.error('   - API version mismatch')
      }

      const rooms: Room[] = []

      // Fetch info for each room item ID
      for (const itemId of roomItemIds.slice(0, 3)) {
        // Test with just first 3 rooms
        try {
          console.log(`🔍 Fetching data for room ${itemId}`)
          // Use the discovered working LibCal API endpoint pattern: /space/item/{id} (singular)
          const roomData = await this.makeRequest<Record<string, unknown>>(`/space/item/${itemId}`)

          console.log(`📋 Raw room data for ${itemId}:`, JSON.stringify(roomData, null, 2))
          console.log(`🔍 Available keys in roomData:`, Object.keys(roomData))

          // Try field extraction with detailed logging
          const nameResult = this.extractString(roomData, ['name', 'nickname', 'title'])
          const capacityResult = this.extractNumber(roomData, ['capacity', 'max_capacity', 'seats'])
          const zoneResult = this.extractZoneFromRoomData(roomData)

          console.log(`🏷️ Field extraction results for ${itemId}:`)
          console.log(`  - Name: "${nameResult}" (using fallback: ${!nameResult})`)
          console.log(`  - Capacity: ${capacityResult} (using fallback: ${!capacityResult})`)
          console.log(`  - Zone: "${zoneResult}" (using fallback: ${!zoneResult})`)

          // Convert LibCal room data to our Room format
          const room: Room = {
            id: itemId,
            name: nameResult || `Study Room ${itemId.slice(-2)}`,
            capacity: capacityResult || 4,
            zone: zoneResult || this.getZoneFromItemId(itemId),
            location:
              this.extractString(roomData, ['location', 'location_name', 'building']) ||
              libraryConfig.name,
            amenities: this.extractAmenitiesFromRoomData(roomData),
            image:
              this.extractString(roomData, ['image', 'thumbnail']) || this.getDefaultRoomImage(),
          }

          console.log(`✅ Final processed room:`, room)

          rooms.push(room)
        } catch (error) {
          console.warn(`Failed to fetch room ${itemId}:`, error)
          // Add basic room info even if API fails
          rooms.push({
            id: itemId,
            name: `Study Room ${itemId.slice(-2)}`,
            capacity: 4,
            zone: this.getZoneFromItemId(itemId),
            location: libraryConfig.name,
            amenities: ['WiFi', 'Whiteboard'],
            image: this.getDefaultRoomImage(),
          })
        }
      }

      return rooms
    } catch (error) {
      console.error('❌ Failed to fetch rooms from LibCal API:', error)

      // If authentication fails, provide helpful information
      if (error instanceof Error && error.message.includes('401')) {
        console.error('🔑 Authentication Error Details:')
        console.error('   - The LibCal API token may be expired')
        console.error('   - URI LibCal may use OAuth2 instead of static tokens')
        console.error('   - The API endpoint or authentication method may have changed')
        console.error('💡 Next steps: Contact URI Library IT to get current API credentials')
      }

      throw error
    }
  }

  // 📅 GET AVAILABILITY - Fetch hourly availability for a room
  async getHourlyAvailability(itemId: string, date: string): Promise<Availability> {
    try {
      console.log(`🕐 Attempting to get availability for room ${itemId} on ${date}`)

      // Use the discovered working LibCal API endpoint for bookings/availability
      const response = await this.makeRequest<Record<string, unknown>>(
        `/space/bookings?item_id=${itemId}&date=${date}`,
      )
      console.log(`✅ Got bookings data for room ${itemId}:`, response)

      // Convert LibCal availability to our format
      const slots = response && Array.isArray(response.slots) ? response.slots : []
      const timeSlots =
        slots.length > 0
          ? slots.map((slot: Record<string, unknown>) => ({
              slot: {
                start: typeof slot.start === 'string' ? slot.start : '09:00',
                end: typeof slot.end === 'string' ? slot.end : '10:00',
              },
              isAvailable: typeof slot.available === 'boolean' ? slot.available : true,
              bookingId: typeof slot.booking_id === 'string' ? slot.booking_id : undefined,
            }))
          : this.generateDefaultTimeSlots()

      return {
        roomId: itemId,
        date: date,
        timeSlots: timeSlots,
      }
    } catch (error) {
      console.warn(`Failed to fetch availability for room ${itemId} on ${date}:`, error)

      // Return default availability (all available)
      return {
        roomId: itemId,
        date: date,
        timeSlots: this.generateDefaultTimeSlots(),
      }
    }
  }

  // 📅 GET DAILY AVAILABILITY - Fetch daily availability for multiple days
  async getDailyAvailability(itemId: string, days: number = 7): Promise<Availability[]> {
    try {
      const response = await this.makeRequest<{
        dates?: Array<{
          date: string
          slots?: Array<{
            start: string
            end: string
            available?: boolean
            booking_id?: string
          }>
        }>
      }>(`/space/search/daily/${itemId}?days=${days}`)

      return (
        response.dates?.map((dateData) => ({
          roomId: itemId,
          date: dateData.date,
          timeSlots:
            dateData.slots?.map((slot) => ({
              slot: {
                start: slot.start,
                end: slot.end,
              },
              isAvailable: slot.available || false,
              bookingId: slot.booking_id || undefined,
            })) || this.generateDefaultTimeSlots(),
        })) || []
      )
    } catch (error) {
      console.warn(`Failed to fetch daily availability for room ${itemId}:`, error)
      return []
    }
  }

  // ➕ RESERVE ROOM - Create a booking
  async reserveRoom(params: {
    itemId: string
    startTime: string // ISO datetime string
    endTime: string // ISO datetime string
    firstName: string
    lastName: string
    email: string
  }): Promise<{ success: boolean; bookingId?: string; message?: string }> {
    try {
      const reservationData = {
        start: params.startTime,
        fname: params.firstName,
        lname: params.lastName,
        email: params.email,
        bookings: [
          {
            id: parseInt(params.itemId),
            to: params.endTime,
          },
        ],
        test: false, // Set to true for testing
      }

      const response = await this.makeRequest<{
        success?: boolean
        booking_id?: string
        message?: string
      }>('/space/reserve', {
        method: 'POST',
        body: JSON.stringify(reservationData),
      })

      return {
        success: response.success || false,
        bookingId: response.booking_id,
        message: response.message,
      }
    } catch (error) {
      console.error('Failed to reserve room:', error)
      throw error
    }
  }

  // ❌ CANCEL BOOKING - Cancel a reservation
  async cancelBooking(bookingId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.makeRequest<{
        success?: boolean
        message?: string
      }>(`/space/cancel/${bookingId}`, {
        method: 'POST',
      })

      return {
        success: response.success || false,
        message: response.message,
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      throw error
    }
  }

  // Helper methods
  private getZoneFromItemId(itemId: string): string {
    // Map item IDs to zones based on your room layout
    const id = parseInt(itemId)
    if (id >= 211617 && id <= 211623) return 'A' // Ground Floor
    if (id >= 211624 && id <= 211630) return 'B' // Second Floor
    if (id >= 211631 && id <= 211637) return 'C' // Third Floor
    if (id >= 213873 && id <= 213874) return 'D' // Special Rooms
    return 'A'
  }

  private getAmenitiesFromRoomData(roomData: { capacity?: number }): string[] {
    const amenities = ['WiFi']

    if ((roomData.capacity || 0) >= 6) amenities.push('Conference Phone')
    if ((roomData.capacity || 0) >= 8) amenities.push('Projector')

    amenities.push('Whiteboard')
    if (Math.random() > 0.5) amenities.push('Display')

    return amenities
  }

  // Helper methods for extracting data from unknown API responses
  private extractString(data: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = data[key]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
    return null
  }

  private extractNumber(data: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = data[key]
      if (typeof value === 'number' && value > 0) {
        return value
      }
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10)
        if (!isNaN(parsed) && parsed > 0) {
          return parsed
        }
      }
    }
    return null
  }

  private extractZoneFromRoomData(data: Record<string, unknown>): string | null {
    // Try to extract zone from various possible fields
    const zoneFields = ['zone', 'category', 'category_name', 'floor', 'level', 'area']

    for (const field of zoneFields) {
      const value = data[field]
      if (typeof value === 'string' && value.trim()) {
        return this.mapToZone(value.trim())
      }
      if (typeof value === 'object' && value && 'name' in value) {
        const name = (value as { name?: unknown }).name
        if (typeof name === 'string' && name.trim()) {
          return this.mapToZone(name.trim())
        }
      }
    }

    return null
  }

  private mapToZone(value: string): string {
    const lower = value.toLowerCase()

    // Map common zone/floor names to our zone system
    if (lower.includes('ground') || lower.includes('first') || lower === '1') return 'A'
    if (lower.includes('second') || lower === '2') return 'B'
    if (lower.includes('third') || lower === '3') return 'C'
    if (lower.includes('basement') || lower.includes('lower')) return 'D'
    if (lower.includes('media') || lower.includes('special')) return 'E'

    // Default mapping
    return value.charAt(0).toUpperCase()
  }

  private extractAmenitiesFromRoomData(data: Record<string, unknown>): string[] {
    const amenities = ['WiFi'] // Always include WiFi

    // Try to extract amenities from various fields
    const amenityFields = ['amenities', 'features', 'equipment', 'resources']

    for (const field of amenityFields) {
      const value = data[field]
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') {
            amenities.push(item)
          } else if (typeof item === 'object' && item && 'name' in item) {
            const name = (item as { name?: unknown }).name
            if (typeof name === 'string') {
              amenities.push(name)
            }
          }
        }
      }
    }

    // Add capacity-based amenities if not already present
    const capacity = this.extractNumber(data, ['capacity', 'max_capacity', 'seats']) || 4
    if (capacity >= 6 && !amenities.some((a) => a.toLowerCase().includes('phone'))) {
      amenities.push('Conference Phone')
    }
    if (capacity >= 8 && !amenities.some((a) => a.toLowerCase().includes('projector'))) {
      amenities.push('Projector')
    }
    if (!amenities.some((a) => a.toLowerCase().includes('whiteboard'))) {
      amenities.push('Whiteboard')
    }

    return [...new Set(amenities)] // Remove duplicates
  }

  private getRandomRoomImage(): string {
    const images = [
      'https://via.placeholder.com/400x200?text=Study+Room',
      'https://via.placeholder.com/400x200?text=Conference+Room',
      'https://via.placeholder.com/400x200?text=Meeting+Space',
    ]
    const index = Math.floor(Math.random() * images.length)
    return images[index] ?? images[0]!
  }

  private getDefaultRoomImage(): string {
    const images = [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=300',
      'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=300',
    ]
    const index = Math.floor(Math.random() * images.length)
    return images[index] ?? images[0]!
  }

  private generateDefaultTimeSlots() {
    const slots = []

    // Generate hourly slots from 8 AM to 10 PM
    for (let hour = 8; hour < 22; hour++) {
      slots.push({
        slot: {
          start: `${hour.toString().padStart(2, '0')}:00`,
          end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        },
        isAvailable: true,
        bookingId: undefined,
      })
    }

    return slots
  }
}

// Export singleton instance
export const uriLibCalService = new URILibCalService()
export default uriLibCalService
