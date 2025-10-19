import LibCalAPIService from './libcal-api'
import { libCalConfig, libraryConfig } from './config'
import {
  libCalSpaceToRoom,
  libCalBookingToBooking,
  libCalAvailabilityToAvailability,
  getRoomIdAsSpaceId,
  getBookingIdAsLibCalId,
} from './adapters'
import type { Room, Booking, Availability } from '@/types'

class BookingService {
  private api: LibCalAPIService
  private isAuthenticated = false

  constructor() {
    this.api = new LibCalAPIService(libCalConfig)
  }

  // Initialize the service
  async initialize(): Promise<void> {
    try {
      await this.api.authenticate()
      this.isAuthenticated = true
      console.log('LibCal API service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize LibCal API:', error)
      throw error
    }
  }

  // Check if service is ready
  isReady(): boolean {
    return this.isAuthenticated
  }

  // Get all rooms for the configured location
  async getRooms(): Promise<Room[]> {
    try {
      const spaces = await this.api.getSpaces(libraryConfig.defaultLocationId)
      return spaces.map(libCalSpaceToRoom)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      throw new Error('Failed to fetch rooms from LibCal')
    }
  }

  // Get room availability for a specific date range
  async getAvailability(roomIds: string[], startDate: string, days = 1): Promise<Availability[]> {
    try {
      const spaceIds = roomIds.map(getRoomIdAsSpaceId)
      const availabilityData = await this.api.getAvailability(spaceIds, startDate, days)
      return availabilityData.map(libCalAvailabilityToAvailability)
    } catch (error) {
      console.error('Error fetching availability:', error)
      throw new Error('Failed to fetch availability from LibCal')
    }
  }

  // Get bookings for a room within date range
  async getBookings(roomId: string, startDate: string, endDate: string): Promise<Booking[]> {
    try {
      const spaceId = getRoomIdAsSpaceId(roomId)
      const bookingData = await this.api.getBookings(spaceId, startDate, endDate)
      return bookingData.map(libCalBookingToBooking)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      throw new Error('Failed to fetch bookings from LibCal')
    }
  }

  // Create a new booking
  async createBooking(
    roomId: string,
    date: string,
    startTime: string,
    endTime: string,
    patronId?: number,
    purpose?: string,
  ): Promise<Booking> {
    try {
      const spaceId = getRoomIdAsSpaceId(roomId)
      const startDateTime = `${date}T${startTime}:00`
      const endDateTime = `${date}T${endTime}:00`

      const booking = await this.api.createBooking(
        spaceId,
        startDateTime,
        endDateTime,
        patronId,
        purpose,
      )

      return libCalBookingToBooking(booking)
    } catch (error) {
      console.error('Error creating booking:', error)
      throw new Error('Failed to create booking in LibCal')
    }
  }

  // Cancel a booking
  async cancelBooking(bookingId: string): Promise<boolean> {
    try {
      const libCalBookingId = getBookingIdAsLibCalId(bookingId)
      const result = await this.api.cancelBooking(libCalBookingId)
      return result.success
    } catch (error) {
      console.error('Error canceling booking:', error)
      throw new Error('Failed to cancel booking in LibCal')
    }
  }

  // Search rooms with filters
  async searchRooms(query?: string, capacity?: number, categoryId?: number): Promise<Room[]> {
    try {
      const spaces = await this.api.searchSpaces(
        libraryConfig.defaultLocationId,
        query,
        capacity,
        categoryId,
      )
      return spaces.map(libCalSpaceToRoom)
    } catch (error) {
      console.error('Error searching rooms:', error)
      throw new Error('Failed to search rooms in LibCal')
    }
  }

  // Get available categories/zones
  async getCategories(): Promise<Array<{ id: number; name: string }>> {
    try {
      return await this.api.getCategories(libraryConfig.defaultLocationId)
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw new Error('Failed to fetch categories from LibCal')
    }
  }

  // Get location information
  async getLocations() {
    try {
      return await this.api.getLocations()
    } catch (error) {
      console.error('Error fetching locations:', error)
      throw new Error('Failed to fetch locations from LibCal')
    }
  }
}

// Export singleton instance
export const bookingService = new BookingService()
export default bookingService
