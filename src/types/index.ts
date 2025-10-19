export interface Room {
  id: string
  name: string
  capacity: number
  zone: string
  location: string
  amenities: string[]
  image?: string
}

export interface TimeSlot {
  start: string // HH:MM format
  end: string // HH:MM format
}

export interface Booking {
  id: string
  roomId: string
  userId: string
  userName: string
  date: string // YYYY-MM-DD format
  timeSlot: TimeSlot
  status: 'confirmed' | 'pending' | 'cancelled'
  purpose?: string
}

export interface Availability {
  roomId: string
  date: string // YYYY-MM-DD format
  timeSlots: Array<{
    slot: TimeSlot
    isAvailable: boolean
    bookingId?: string
  }>
}

export interface FilterOptions {
  capacity: number
  zone: string
  date: string
  startTime?: string
  endTime?: string
  amenities: string[]
  searchQuery: string
}

export type ViewMode = 'grid' | 'list' | 'calendar'

export interface BookingGridState {
  rooms: Room[]
  bookings: Booking[]
  availability: Availability[]
  filters: FilterOptions
  selectedDate: string
  viewMode: ViewMode
  loading: boolean
  error: string | null
}
