import type {
  LibCalConfig,
  LibCalSpace,
  LibCalAvailability,
  LibCalError,
  LibCalSearchFilters,
  LibCalReserveResponse,
  LibCalCheckinResponse,
} from './types'

class LibCalAPIService {
  private config: LibCalConfig
  private baseHeaders: HeadersInit

  constructor(config: LibCalConfig) {
    this.config = config
    this.baseHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
  }

  // Authentication
  async authenticate(): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      })

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`)
      }

      const data = await response.json()
      this.config.accessToken = data.access_token
      this.config.refreshToken = data.refresh_token

      return data.access_token
    } catch (error) {
      console.error('LibCal authentication error:', error)
      throw error
    }
  }

  // Get authenticated headers
  private getAuthHeaders(): HeadersInit {
    if (!this.config.accessToken) {
      throw new Error('Not authenticated. Call authenticate() first.')
    }

    return {
      ...this.baseHeaders,
      Authorization: `Bearer ${this.config.accessToken}`,
    }
  }

  // Generic API request handler
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        headers: this.getAuthHeaders(),
        ...options,
      })

      if (!response.ok) {
        const errorData: LibCalError = await response.json().catch(() => ({
          error: 'Unknown error',
          status_code: response.status,
        }))
        throw new Error(`API Error: ${errorData.error} (${errorData.status_code})`)
      }

      return await response.json()
    } catch (error) {
      console.error('LibCal API request error:', error)
      throw error
    }
  }

  // Get search filters (to understand available rooms/categories)
  async getSearchFilters(): Promise<LibCalSearchFilters> {
    return this.apiRequest<LibCalSearchFilters>('/space/search/filters')
  }

  // Get item info for a specific room
  async getItemInfo(itemId: string): Promise<LibCalSpace> {
    return this.apiRequest<LibCalSpace>(`/space/items/${itemId}`)
  }

  // Get hourly availability for a specific room
  async getHourlyAvailability(itemId: string, date?: string): Promise<LibCalAvailability[]> {
    let endpoint = `/space/search/hourly/${itemId}`
    if (date) {
      endpoint += `?date=${date}`
    }
    return this.apiRequest<LibCalAvailability[]>(endpoint)
  }

  // Get daily availability for a specific room
  async getDailyAvailability(itemId: string, days: number = 7): Promise<LibCalAvailability[]> {
    const endpoint = `/space/search/daily/${itemId}?days=${days}`
    return this.apiRequest<LibCalAvailability[]>(endpoint)
  }

  // Reserve a room
  async reserveRoom(reservationData: {
    start: string // ISO datetime
    fname: string // First name
    lname: string // Last name
    email: string // Email
    bookings: Array<{
      id: number // Item ID
      to: string // End time ISO datetime
    }>
    test?: boolean // For testing
  }): Promise<LibCalReserveResponse> {
    return this.apiRequest<LibCalReserveResponse>('/space/reserve', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    })
  }

  // Cancel a booking
  async cancelBooking(bookingId: string): Promise<{ success: boolean }> {
    return this.apiRequest<{ success: boolean }>(`/space/cancel/${bookingId}`, {
      method: 'POST',
    })
  }

  // Check in to a room
  async checkinRoom(checkinData: {
    booking_id: string
    item_id: number
  }): Promise<LibCalCheckinResponse> {
    return this.apiRequest<LibCalCheckinResponse>('/space/checkin', {
      method: 'POST',
      body: JSON.stringify(checkinData),
    })
  }

  // Check out of a room
  async checkoutRoom(checkoutData: {
    booking_id: string
    item_id: number
  }): Promise<LibCalCheckinResponse> {
    return this.apiRequest<LibCalCheckinResponse>('/space/checkout', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    })
  }
}

export default LibCalAPIService
