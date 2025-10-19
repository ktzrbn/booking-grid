<template>
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
  >
    <!-- Room Header -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ room.name }}</h3>
          <div class="flex items-center space-x-4 text-sm text-gray-600">
            <div class="flex items-center">
              <MapPin class="h-4 w-4 mr-1" />
              {{ room.location }}
            </div>
            <div class="flex items-center">
              <Users class="h-4 w-4 mr-1" />
              Up to {{ room.capacity }} people
            </div>
            <div class="flex items-center">
              <Building class="h-4 w-4 mr-1" />
              Zone {{ room.zone }}
            </div>
          </div>
        </div>

        <div class="ml-4 flex-shrink-0">
          <div :class="['px-2 py-1 rounded-full text-xs font-medium', availabilityStatus.class]">
            {{ availabilityStatus.text }}
          </div>
        </div>
      </div>

      <!-- Amenities -->
      <div v-if="room.amenities.length > 0" class="mt-3">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="amenity in room.amenities.slice(0, 4)"
            :key="amenity"
            class="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700"
          >
            <component :is="getAmenityIcon(amenity)" class="h-3 w-3 mr-1" />
            {{ amenity }}
          </span>
          <span
            v-if="room.amenities.length > 4"
            class="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-500"
          >
            +{{ room.amenities.length - 4 }} more
          </span>
        </div>
      </div>
    </div>

    <!-- Timeline View -->
    <div class="p-4">
      <div class="mb-3 flex items-center justify-between">
        <h4 class="text-sm font-medium text-gray-900">
          {{ isToday ? "Today's Schedule" : 'Schedule' }}
        </h4>
        <div class="text-xs text-gray-500">
          {{ format(new Date(date), 'MMM d, yyyy') }}
        </div>
      </div>

      <!-- Timeline Container -->
      <div class="timeline-container w-full">
        <!-- Timeline Bar -->
        <div
          class="relative h-8 rounded-md overflow-hidden border border-gray-300"
          style="background-color: #f3f4f6"
        >
          <!-- Current Time Indicator -->
          <div
            v-if="isToday"
            :style="{ left: currentTimePosition }"
            class="absolute top-0 w-0.5 h-full z-30"
            style="background-color: #3b82f6"
          >
            <div
              class="absolute -top-1 -left-1 w-2 h-2 rounded-full"
              style="background-color: #3b82f6"
            ></div>
          </div>

          <!-- Time Slots -->
          <div
            v-for="(slot, index) in timelineSlots"
            :key="`timeline-${slot.start}-${slot.end}`"
            :style="{
              left: `${(index / timelineSlots.length) * 100}%`,
              width: `${100 / timelineSlots.length}%`,
              backgroundColor: getSlotColor(slot),
            }"
            class="absolute top-0 h-full cursor-pointer transition-all duration-200 border-r border-white border-opacity-30"
            @click="handleSlotClick(slot)"
            :title="getSlotTooltip(slot)"
          ></div>
        </div>

        <!-- Time Labels (below the bar) -->
        <div class="flex justify-between text-xs text-gray-500 mt-2 px-1">
          <span>8AM</span>
          <span>12PM</span>
          <span>4PM</span>
          <span>8PM</span>
          <span>10PM</span>
        </div>
      </div>

      <!-- Quick Info -->
      <div class="mt-3 flex items-center justify-between text-sm">
        <div class="flex items-center space-x-4">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-400 rounded mr-1"></div>
            <span class="text-gray-600">{{ availableSlotsCount }} available</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-red-600 rounded mr-1"></div>
            <span class="text-gray-600">{{ bookedSlotsCount }} booked</span>
          </div>
        </div>
        <div v-if="nextAvailableSlot" class="text-primary-600 font-medium">
          Next: {{ nextAvailableSlot }}
        </div>
      </div>
    </div>

    <!-- Quick Book Section -->
    <div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600">
          Next available:
          <span class="font-medium text-gray-900">
            {{ nextAvailableSlot || 'No slots today' }}
          </span>
        </div>
        <button
          v-if="nextAvailableSlot"
          @click="quickBook"
          class="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
        >
          Quick Book
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  MapPin,
  Users,
  Building,
  Wifi,
  Monitor,
  Coffee,
  Volume2,
  Projector,
  Phone,
  Mic,
} from 'lucide-vue-next'
import { format } from 'date-fns'
import { useBookingStore } from '@/stores/booking'
import type { Room, TimeSlot } from '@/types'

interface Props {
  room: Room
  date: string
}

const props = defineProps<Props>()

const store = useBookingStore()

// Check if the selected date is today
const isToday = computed(() => {
  return props.date === format(new Date(), 'yyyy-MM-dd')
})

// Get current time position for timeline indicator
const currentTimePosition = computed(() => {
  if (!isToday.value) return '0%'

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  // Timeline starts at 8 AM (hour 8) and ends at 10 PM (hour 22) - 14 hours total
  const startHour = 8
  const endHour = 22
  const totalHours = endHour - startHour

  if (currentHour < startHour) return '0%'
  if (currentHour >= endHour) return '100%'

  const hoursFromStart = currentHour - startHour + currentMinute / 60
  const percentage = (hoursFromStart / totalHours) * 100

  return `${Math.min(100, Math.max(0, percentage))}%`
})

// Timeline slots (all slots from 8 AM to 10 PM)
const timelineSlots = computed(() => {
  return store.availableTimeSlots
})

// Available time slots for the room
const availableTimeSlots = computed(() => {
  return store.availableTimeSlots.filter((slot) =>
    store.isSlotAvailable(props.room.id, props.date, slot),
  )
})

// Count available and booked slots
const availableSlotsCount = computed(() => {
  return timelineSlots.value.filter((slot) =>
    store.isSlotAvailable(props.room.id, props.date, slot),
  ).length
})

const bookedSlotsCount = computed(() => {
  return timelineSlots.value.filter(
    (slot) => !store.isSlotAvailable(props.room.id, props.date, slot),
  ).length
})

const availabilityStatus = computed(() => {
  const available = availableTimeSlots.value.length
  const total = store.availableTimeSlots.length

  if (available === 0) {
    return { text: 'Fully Booked', class: 'bg-red-100 text-red-700' }
  } else if (available < total * 0.3) {
    return { text: 'Limited', class: 'bg-yellow-100 text-yellow-700' }
  } else {
    return { text: 'Available', class: 'bg-green-100 text-green-700' }
  }
})

const nextAvailableSlot = computed(() => {
  const now = new Date()
  const currentTime = format(now, 'HH:mm')

  // If not today, return first available slot
  if (props.date !== format(now, 'yyyy-MM-dd')) {
    const firstSlot = availableTimeSlots.value[0]
    return firstSlot ? formatTime(firstSlot.start) : null
  }

  // For today, find next available slot after current time
  const nextSlot = availableTimeSlots.value.find((slot) => slot.start > currentTime)
  return nextSlot ? formatTime(nextSlot.start) : null
})

const formatTime = (time: string) => {
  const [hour, minute] = time.split(':')
  const h = parseInt(hour || '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayHour}:${minute} ${ampm}`
}

const getSlotColor = (slot: TimeSlot) => {
  const isAvailable = store.isSlotAvailable(props.room.id, props.date, slot)
  const booking = store.getBookingForSlot(props.room.id, props.date, slot)

  if (booking && booking.status === 'confirmed') {
    return '#ef4444' // red-500
  } else if (!isAvailable) {
    return '#ef4444' // red-500 - unavailable slots
  } else {
    return '#22c55e' // green-500 - available slots
  }
}

const getSlotTooltip = (slot: TimeSlot) => {
  const isAvailable = store.isSlotAvailable(props.room.id, props.date, slot)
  const booking = store.getBookingForSlot(props.room.id, props.date, slot)
  const timeRange = `${formatTime(slot.start)} - ${formatTime(slot.end)}`

  if (booking && booking.status === 'confirmed') {
    return `${timeRange}: Booked by ${booking.userName}`
  } else if (!isAvailable) {
    return `${timeRange}: Unavailable`
  } else {
    return `${timeRange}: Available - Click to book`
  }
}

const isSlotClickable = (slot: TimeSlot) => {
  return store.isSlotAvailable(props.room.id, props.date, slot)
}

const getAmenityIcon = (amenity: string) => {
  const iconMap: Record<string, object> = {
    WiFi: Wifi,
    Display: Monitor,
    Coffee: Coffee,
    Quiet: Volume2,
    Projector: Projector,
    'Conference Phone': Phone,
    Microphone: Mic,
  }
  return iconMap[amenity] || Monitor
}

const handleSlotClick = (slot: TimeSlot) => {
  if (!isSlotClickable(slot)) return

  // Emit event to open booking modal
  // For now, just log
  console.log(`Booking slot ${slot.start}-${slot.end} for room ${props.room.name}`)
}

const quickBook = () => {
  const nextSlot = availableTimeSlots.value.find((slot) => {
    const now = new Date()
    const currentTime = format(now, 'HH:mm')

    if (props.date !== format(now, 'yyyy-MM-dd')) {
      return true
    }

    return slot.start > currentTime
  })

  if (nextSlot) {
    handleSlotClick(nextSlot)
  }
}
</script>

<style scoped>
.timeline-container {
  position: relative;
}

.timeline-container .absolute:last-child {
  border-right: none !important;
}

.timeline-container .absolute:hover {
  z-index: 10;
  transform: scaleY(1.2);
  transition: transform 0.2s ease;
}
</style>
