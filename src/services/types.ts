// Springshare LibCal API Configuration
export interface LibCalConfig {
  baseUrl: string
  clientId: string
  clientSecret: string
  accessToken?: string
  refreshToken?: string
}

// API Response interfaces for LibCal
export interface LibCalSpace {
  id: number
  name: string
  capacity: number
  zone_id?: number
  location?: {
    lid: number
    name: string
  }
  category?: {
    cid: number
    name: string
  }
  amenities?: Array<{
    id: number
    name: string
  }>
  image?: string
  description?: string
}

export interface LibCalAvailability {
  space_id: number
  date: string
  slots: Array<{
    start: string
    end: string
    available: boolean
    booking_id?: number
  }>
}

export interface LibCalBooking {
  id: number
  space_id: number
  space_name: string
  start: string
  end: string
  date: string
  patron: {
    id: number
    name: string
    email: string
  }
  status: 'confirmed' | 'pending' | 'cancelled'
  created: string
  updated?: string
  purpose?: string
}

export interface LibCalLocation {
  lid: number
  name: string
  public_name: string
  timezone: string
  zones?: Array<{
    id: number
    name: string
  }>
}

// API Error response
export interface LibCalError {
  error: string
  error_description?: string
  status_code: number
}

// Search filters response
export interface LibCalSearchFilters {
  categories?: Array<{
    id: number
    name: string
  }>
  locations?: Array<{
    id: number
    name: string
  }>
}

// Reserve room response
export interface LibCalReserveResponse {
  booking_id?: string
  success: boolean
  message?: string
  errors?: string[]
}

// Check-in/Check-out response
export interface LibCalCheckinResponse {
  success: boolean
  message?: string
}
