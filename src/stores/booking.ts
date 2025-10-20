import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Room, Booking, Availability, FilterOptions, ViewMode } from '@/types'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'

export const useBookingStore = defineStore('booking', () => {
  // State
  const rooms = ref<Room[]>([])
  const bookings = ref<Booking[]>([])
  const availability = ref<Availability[]>([])
  // Force the current date to be correct by using local date parts
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const todayLocal = `${year}-${month}-${day}`
  console.log(`🗓️ FORCED Local date: ${todayLocal}`)
  console.log(`🗓️ Date-fns format result: ${format(now, 'yyyy-MM-dd')}`)
  console.log(`🕒 Raw Date toString: ${now.toString()}`)
  
  // Debug: log the correct date
  console.log(`✅ Store initialized with CORRECT local date: ${todayLocal}`)
  
  const selectedDate = ref<string>(todayLocal)
  const viewMode = ref<ViewMode>('grid')
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Filter state
  const filters = ref<FilterOptions>({
    capacity: 1,
    zone: 'all',
    date: todayLocal, // Use the same local date value
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
    if (!roomAvailability) {
      console.warn(`🔍 No availability data for room ${roomId} on ${date}`)
      return true
    }

    console.log(`🔍 Checking slot ${timeSlot.start}-${timeSlot.end} for room ${roomId}`)
    console.log(`📊 Available LibCal slots:`, roomAvailability.timeSlots.map(ts => `${ts.slot.start}-${ts.slot.end}: ${ts.isAvailable ? 'AVAILABLE' : 'BOOKED'}`))

    const slot = roomAvailability.timeSlots.find(
      (ts) => ts.slot.start === timeSlot.start && ts.slot.end === timeSlot.end,
    )

    const isAvailable = slot ? slot.isAvailable : true
    console.log(`✅ Slot ${timeSlot.start}-${timeSlot.end}: ${isAvailable ? 'AVAILABLE' : 'BOOKED'}${slot ? '' : ' (no exact match - defaulting to available)'}`)
    
    return isAvailable
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

  // Initialize with empty data - no mock data fallback
  const initializeEmpty = () => {
    rooms.value = []
    bookings.value = []
    availability.value = []
    loading.value = false
  }

  // Reload availability data for a specific date
  const loadAvailabilityForDate = async (date: string) => {
    if (rooms.value.length === 0) {
      console.warn('⚠️ No rooms loaded, cannot reload availability')
      return
    }

    // Import LibCal service dynamically to avoid circular dependency
    const { uriLibCalService } = await import('@/services/uri-libcal')
    
    console.log(`🔄 Reloading availability for ${date}`)
    loading.value = true
    error.value = null

    try {
      const newAvailabilityData = []

      // Remove old availability data for this date
      availability.value = availability.value.filter(a => a.date !== date)

      for (const room of rooms.value) {
        if (!room.id) {
          console.warn(`⚠️ Skipping room without ID:`, room)
          continue
        }

        try {
          console.log(`📅 Loading availability for room ${room.id} (${room.name}) on ${date}`)
          const roomAvailability = await uriLibCalService.getHourlyAvailability(room.id, date)
          newAvailabilityData.push(roomAvailability)
        } catch (roomError) {
          console.error(`❌ Failed to load availability for room ${room.id}:`, roomError)
          // Continue with other rooms even if one fails
        }
      }

      // Add new availability data
      availability.value.push(...newAvailabilityData)
      console.log(`✅ Loaded availability for ${newAvailabilityData.length} rooms on ${date}`)

    } catch (err) {
      console.error('❌ Failed to reload availability:', err)
      error.value = 'Failed to reload availability data'
    } finally {
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
    initializeEmpty,
    loadAvailabilityForDate,
  }
})
