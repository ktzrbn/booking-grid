import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Room, Booking, Availability, FilterOptions, ViewMode } from '@/types'
import { format } from 'date-fns'
import { bookingService } from '@/services'

export const useBookingStore = defineStore('booking', () => {
  // State
  const rooms = ref<Room[]>([])
  const bookings = ref<Booking[]>([])
  const availability = ref<Availability[]>([])
  const selectedDate = ref<string>(format(new Date(), 'yyyy-MM-dd'))
  const viewMode = ref<ViewMode>('grid')
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const apiInitialized = ref<boolean>(false)

  // Filter state
  const filters = ref<FilterOptions>({
    capacity: 1,
    zone: 'all',
    date: selectedDate.value,
    amenities: [],
    searchQuery: '',
  })

  // Initialize API service
  const initializeAPI = async () => {
    if (apiInitialized.value) return

    loading.value = true
    error.value = null

    try {
      await bookingService.initialize()
      apiInitialized.value = true
      console.log('API service initialized')
    } catch (err) {
      error.value = 'Failed to initialize API connection'
      console.error('API initialization failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Load rooms from LibCal API
  const loadRooms = async () => {
    if (!apiInitialized.value) {
      await initializeAPI()
    }

    loading.value = true
    error.value = null

    try {
      const apiRooms = await bookingService.getRooms()
      rooms.value = apiRooms
      console.log(`Loaded ${apiRooms.length} rooms from LibCal`)
    } catch (err) {
      error.value = 'Failed to load rooms'
      console.error('Error loading rooms:', err)
      rooms.value = []
      console.warn('No rooms loaded - check your API configuration')
    } finally {
      loading.value = false
    }
  }

  // Load availability for current rooms and date
  const loadAvailability = async (date?: string) => {
    if (!apiInitialized.value) {
      await initializeAPI()
    }

    const targetDate = date || selectedDate.value
    const roomIds = rooms.value.map((room) => room.id)

    if (roomIds.length === 0) {
      console.warn('No rooms loaded, cannot fetch availability')
      return
    }

    loading.value = true
    error.value = null

    try {
      const apiAvailability = await bookingService.getAvailability(roomIds, targetDate, 1)
      availability.value = apiAvailability
      console.log(`Loaded availability for ${apiAvailability.length} rooms`)
    } catch (err) {
      error.value = 'Failed to load availability'
      console.error('Error loading availability:', err)
      availability.value = []
      console.warn('No availability loaded - check your API configuration')
    } finally {
      loading.value = false
    }
  }

  // Load bookings for date range
  const loadBookings = async (startDate?: string, endDate?: string) => {
    if (!apiInitialized.value) {
      await initializeAPI()
    }

    const start = startDate || selectedDate.value
    const end = endDate || selectedDate.value

    loading.value = true
    error.value = null

    try {
      const allBookings: Booking[] = []

      // Fetch bookings for each room
      for (const room of rooms.value) {
        try {
          const roomBookings = await bookingService.getBookings(room.id, start, end)
          allBookings.push(...roomBookings)
        } catch (err) {
          console.warn(`Failed to load bookings for room ${room.id}:`, err)
        }
      }

      bookings.value = allBookings
      console.log(`Loaded ${allBookings.length} bookings from LibCal`)
    } catch (err) {
      error.value = 'Failed to load bookings'
      console.error('Error loading bookings:', err)
      bookings.value = []
      console.warn('No bookings loaded - check your API configuration')
    } finally {
      loading.value = false
    }
  }

  // Create a new booking via API
  const createBooking = async (
    roomId: string,
    date: string,
    startTime: string,
    endTime: string,
    patronId?: number,
    purpose?: string,
  ) => {
    if (!apiInitialized.value) {
      throw new Error('API not initialized')
    }

    loading.value = true
    error.value = null

    try {
      const newBooking = await bookingService.createBooking(
        roomId,
        date,
        startTime,
        endTime,
        patronId,
        purpose,
      )

      // Add to local state
      bookings.value.push(newBooking)

      // Refresh availability
      await loadAvailability(date)

      return newBooking
    } catch (err) {
      error.value = 'Failed to create booking'
      console.error('Error creating booking:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Cancel a booking via API
  const cancelBooking = async (bookingId: string) => {
    if (!apiInitialized.value) {
      throw new Error('API not initialized')
    }

    loading.value = true
    error.value = null

    try {
      const success = await bookingService.cancelBooking(bookingId)

      if (success) {
        // Remove from local state
        bookings.value = bookings.value.filter((b) => b.id !== bookingId)

        // Refresh availability
        await loadAvailability()
      }

      return success
    } catch (err) {
      error.value = 'Failed to cancel booking'
      console.error('Error canceling booking:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Initialize all data (call this when app starts)
  const initializeData = async () => {
    try {
      await loadRooms()
      await Promise.all([loadAvailability(), loadBookings()])
    } catch (err) {
      console.error('Failed to initialize data:', err)
    }
  }

  // Computed properties (keep existing logic)
  const filteredRooms = computed(() => {
    return rooms.value.filter((room) => {
      // Capacity filter
      if (filters.value.capacity > 1 && room.capacity < filters.value.capacity) {
        return false
      }

      // Zone filter
      if (filters.value.zone !== 'all' && room.zone !== filters.value.zone) {
        return false
      }

      // Search query filter
      if (filters.value.searchQuery) {
        const query = filters.value.searchQuery.toLowerCase()
        const searchableText =
          `${room.name} ${room.location} ${room.amenities.join(' ')}`.toLowerCase()
        if (!searchableText.includes(query)) {
          return false
        }
      }

      // Amenities filter
      if (filters.value.amenities.length > 0) {
        return filters.value.amenities.every((amenity) => room.amenities.includes(amenity))
      }

      return true
    })
  })

  const availableTimeSlots = computed(() => {
    const slots = []
    for (let hour = 8; hour <= 21; hour++) {
      // Hour slot (e.g., 8:00-9:00)
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`,
      })
      // Half hour slot (e.g., 8:30-9:30) - but not for the last hour
      if (hour < 21) {
        slots.push({
          start: `${hour.toString().padStart(2, '0')}:30`,
          end: `${(hour + 1).toString().padStart(2, '0')}:30`,
        })
      }
    }
    // Add the final slot from 21:00 to 22:00 (9 PM to 10 PM)
    slots.push({
      start: '21:00',
      end: '22:00',
    })
    return slots
  })

  // Helper functions (keep existing)
  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const getRoomAvailability = (roomId: string, date: string) => {
    return availability.value.find((a) => a.roomId === roomId && a.date === date)
  }

  const isSlotAvailable = (
    roomId: string,
    date: string,
    timeSlot: { start: string; end: string },
  ) => {
    const roomAvailability = getRoomAvailability(roomId, date)
    if (!roomAvailability) return true

    const slot = roomAvailability.timeSlots.find(
      (ts) => ts.slot.start === timeSlot.start && ts.slot.end === timeSlot.end,
    )

    return slot ? slot.isAvailable : true
  }

  const getBookingForSlot = (
    roomId: string,
    date: string,
    timeSlot: { start: string; end: string },
  ) => {
    return bookings.value.find(
      (booking) =>
        booking.roomId === roomId &&
        booking.date === date &&
        booking.timeSlot.start === timeSlot.start &&
        booking.timeSlot.end === timeSlot.end,
    )
  }

  return {
    // State
    rooms,
    bookings,
    availability,
    selectedDate,
    viewMode,
    loading,
    error,
    filters,
    apiInitialized,

    // Computed
    filteredRooms,
    availableTimeSlots,

    // API Methods
    initializeAPI,
    initializeData,
    loadRooms,
    loadAvailability,
    loadBookings,
    createBooking,
    cancelBooking,

    // Helper Methods
    updateFilters,
    getRoomAvailability,
    isSlotAvailable,
    getBookingForSlot,
  }
})
