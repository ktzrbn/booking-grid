import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Room, Booking, Availability, FilterOptions, ViewMode } from '@/types'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'

export const useBookingStore = defineStore('booking', () => {
  // State
  const rooms = ref<Room[]>([])
  const bookings = ref<Booking[]>([])
  const availability = ref<Availability[]>([])
  const selectedDate = ref<string>(format(new Date(), 'yyyy-MM-dd'))
  const viewMode = ref<ViewMode>('grid')
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Filter state
  const filters = ref<FilterOptions>({
    capacity: 1,
    zone: 'all',
    date: selectedDate.value,
    amenities: [],
    searchQuery: '',
  })

  // Computed
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

  const weekDates = computed(() => {
    const date = new Date(selectedDate.value)
    const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 })

    const dates = []
    let current = start

    while (current <= end) {
      dates.push(format(current, 'yyyy-MM-dd'))
      current = addDays(current, 1)
    }

    return dates
  })

  // Actions
  const setSelectedDate = (date: string) => {
    selectedDate.value = date
    filters.value.date = date
  }

  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
  }

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

  const createBooking = async (
    roomId: string,
    date: string,
    timeSlot: { start: string; end: string },
    userName: string,
    purpose?: string,
  ) => {
    loading.value = true
    error.value = null

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const booking: Booking = {
        id: Date.now().toString(),
        roomId,
        userId: 'current-user',
        userName,
        date,
        timeSlot,
        status: 'confirmed',
        purpose,
      }

      bookings.value.push(booking)

      // Update availability
      const roomAvailability = availability.value.find(
        (a) => a.roomId === roomId && a.date === date,
      )
      if (roomAvailability) {
        const slot = roomAvailability.timeSlots.find(
          (ts) => ts.slot.start === timeSlot.start && ts.slot.end === timeSlot.end,
        )
        if (slot) {
          slot.isAvailable = false
          slot.bookingId = booking.id
        }
      }

      return booking
    } catch (err) {
      error.value = 'Failed to create booking'
      throw err
    } finally {
      loading.value = false
    }
  }

  const cancelBooking = async (bookingId: string) => {
    loading.value = true
    error.value = null

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      const booking = bookings.value.find((b) => b.id === bookingId)
      if (booking) {
        booking.status = 'cancelled'

        // Update availability
        const roomAvailability = availability.value.find(
          (a) => a.roomId === booking.roomId && a.date === booking.date,
        )
        if (roomAvailability) {
          const slot = roomAvailability.timeSlots.find(
            (ts) =>
              ts.slot.start === booking.timeSlot.start && ts.slot.end === booking.timeSlot.end,
          )
          if (slot) {
            slot.isAvailable = true
            slot.bookingId = undefined
          }
        }
      }
    } catch (err) {
      error.value = 'Failed to cancel booking'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Initialize with mock data
  const initializeMockData = async () => {
    if (rooms.value.length === 0) {
      const { initializeMockData: loadMockData } = await import('@/data/mockData')
      const mockData = loadMockData()
      rooms.value = mockData.rooms
      bookings.value = mockData.bookings
      availability.value = mockData.availability
      loading.value = false
    }
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

    // Computed
    filteredRooms,
    availableTimeSlots,
    weekDates,

    // Actions
    setSelectedDate,
    setViewMode,
    updateFilters,
    getRoomAvailability,
    isSlotAvailable,
    getBookingForSlot,
    createBooking,
    cancelBooking,
    initializeMockData,
  }
})
