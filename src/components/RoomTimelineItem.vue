<template>
  <div
    class="room-timeline-item bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
  >
    <!-- Room Info Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <Users class="h-6 w-6 text-primary-600" />
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">{{ room.name }}</h3>
          <div class="flex items-center space-x-4 text-sm text-gray-600">
            <span class="flex items-center">
              <MapPin class="h-4 w-4 mr-1" />
              {{ room.location }}
            </span>
            <span class="flex items-center">
              <Users class="h-4 w-4 mr-1" />
              {{ room.capacity }} people
            </span>
            <span class="px-2 py-1 bg-gray-100 rounded-full text-xs"> Zone {{ room.zone }} </span>
          </div>
        </div>
      </div>

      <!-- Room Status -->
      <div class="text-right">
        <div
          :class="[
            'px-3 py-1 rounded-full text-sm font-medium',
            currentAvailability === 'available'
              ? 'bg-green-100 text-green-800'
              : currentAvailability === 'busy'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800',
          ]"
        >
          {{ currentAvailabilityText }}
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
        <span>Today's Availability</span>
        <span>{{ formatDate(date) }}</span>
      </div>

      <!-- Timeline Header with Hour Labels -->
      <div class="relative">
        <div class="flex text-xs text-gray-500 mb-1">
          <div
            v-for="hour in timelineHours"
            :key="hour"
            class="flex-1 text-center"
            :class="{ 'font-medium': hour % 2 === 0 }"
          >
            {{ hour % 2 === 0 ? formatHour(hour) : '' }}
          </div>
        </div>

        <!-- Timeline Bar -->
        <div class="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
          <!-- Current Time Indicator -->
          <div
            v-if="showCurrentTime"
            class="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20"
            :style="{ left: currentTimePosition + '%' }"
          >
            <div
              class="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
            >
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>

          <!-- Time Slots -->
          <div
            v-for="(slot, index) in timelineSlots"
            :key="index"
            :class="[
              'absolute top-0 bottom-0 cursor-pointer transition-all duration-200 hover:opacity-80',
              slot.isAvailable ? 'bg-green-400 hover:bg-green-500' : 'bg-red-400 hover:bg-red-500',
            ]"
            :style="{
              left: slot.leftPosition + '%',
              width: slot.width + '%',
            }"
            :title="slot.tooltip"
            @click="handleSlotClick(slot)"
          >
            <!-- Booking Info Overlay for Booked Slots -->
            <div
              v-if="!slot.isAvailable && slot.booking"
              class="absolute inset-0 flex items-center justify-center text-white text-xs font-medium px-1"
            >
              <span class="truncate">{{ slot.booking.userName }}</span>
            </div>
          </div>
        </div>

        <!-- Timeline Labels for Major Hours -->
        <div class="flex text-xs text-gray-400 mt-1">
          <div class="flex-1 text-left">8 AM</div>
          <div class="flex-1 text-center">12 PM</div>
          <div class="flex-1 text-center">4 PM</div>
          <div class="flex-1 text-right">10 PM</div>
        </div>
      </div>

      <!-- Amenities -->
      <div v-if="room.amenities.length > 0" class="flex flex-wrap gap-2 mt-3">
        <span
          v-for="amenity in room.amenities.slice(0, 4)"
          :key="amenity"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
        >
          <component :is="getAmenityIcon(amenity)" class="h-3 w-3 mr-1" />
          {{ amenity }}
        </span>
        <span
          v-if="room.amenities.length > 4"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500"
        >
          +{{ room.amenities.length - 4 }} more
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Users, MapPin, Wifi, Monitor, Coffee, Mic } from 'lucide-vue-next'
import { format } from 'date-fns'
import type { Room, Booking } from '@/types'
import { useBookingStore } from '@/stores/booking'

interface Props {
  room: Room
  date: string
}

const props = defineProps<Props>()
const store = useBookingStore()

// Timeline configuration
const START_HOUR = 8 // 8 AM
const END_HOUR = 22 // 10 PM
const SLOT_MINUTES = 30 // 30-minute slots

const timelineHours = computed(() => {
  const hours = []
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    hours.push(hour)
  }
  return hours
})

const timelineSlots = computed(() => {
  const slots = []
  const totalMinutes = (END_HOUR - START_HOUR) * 60

  for (let minutes = 0; minutes < totalMinutes; minutes += SLOT_MINUTES) {
    const hour = START_HOUR + Math.floor(minutes / 60)
    const minute = minutes % 60
    const timeStart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    const nextMinutes = minutes + SLOT_MINUTES
    const nextHour = START_HOUR + Math.floor(nextMinutes / 60)
    const nextMinute = nextMinutes % 60
    const timeEnd = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`

    const isAvailable = store.isSlotAvailable(props.room.id, props.date, {
      start: timeStart,
      end: timeEnd,
    })

    const booking = store.getBookingForSlot(props.room.id, props.date, {
      start: timeStart,
      end: timeEnd,
    })

    slots.push({
      start: timeStart,
      end: timeEnd,
      isAvailable,
      booking,
      leftPosition: (minutes / totalMinutes) * 100,
      width: (SLOT_MINUTES / totalMinutes) * 100,
      tooltip: `${formatTime(timeStart)} - ${formatTime(timeEnd)}${!isAvailable && booking ? ` (${booking.userName})` : ''}`,
    })
  }

  return slots
})

const currentAvailability = computed(() => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  // Check if we're within business hours
  if (currentHour < START_HOUR || currentHour >= END_HOUR) {
    return 'closed'
  }

  const currentTime =
    `${currentHour.toString().padStart(2, '0')}:${Math.floor(currentMinute / 30) * 30}`.padStart(
      2,
      '0',
    )
  const nextSlotTime =
    currentMinute < 30
      ? `${currentHour.toString().padStart(2, '0')}:30`
      : `${(currentHour + 1).toString().padStart(2, '0')}:00`

  const isCurrentSlotAvailable = store.isSlotAvailable(props.room.id, props.date, {
    start: currentTime,
    end: nextSlotTime,
  })

  return isCurrentSlotAvailable ? 'available' : 'busy'
})

const currentAvailabilityText = computed(() => {
  switch (currentAvailability.value) {
    case 'available':
      return 'Available Now'
    case 'busy':
      return 'Currently Booked'
    case 'closed':
      return 'Closed'
    default:
      return 'Unknown'
  }
})

const showCurrentTime = computed(() => {
  const today = format(new Date(), 'yyyy-MM-dd')
  return props.date === today
})

const currentTimePosition = computed(() => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  if (currentHour < START_HOUR || currentHour >= END_HOUR) {
    return 0
  }

  const minutesFromStart = (currentHour - START_HOUR) * 60 + currentMinute
  const totalMinutes = (END_HOUR - START_HOUR) * 60

  return (minutesFromStart / totalMinutes) * 100
})

const formatTime = (time: string) => {
  const [hour, minute] = time.split(':')
  const h = parseInt(hour || '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayHour}:${minute} ${ampm}`
}

const formatHour = (hour: number) => {
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}${ampm}`
}

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM d, yyyy')
}

const getAmenityIcon = (amenity: string) => {
  const iconMap: Record<string, typeof Users> = {
    WiFi: Wifi,
    Display: Monitor,
    Coffee: Coffee,
    Microphone: Mic,
    default: Users,
  }
  return iconMap[amenity] || iconMap.default
}

interface TimelineSlot {
  start: string
  end: string
  isAvailable: boolean
  booking?: Booking
  leftPosition: number
  width: number
  tooltip: string
}

const handleSlotClick = (slot: TimelineSlot) => {
  if (slot.isAvailable) {
    // Open booking modal for this time slot
    console.log('Book slot:', slot)
    // TODO: Implement booking modal
  } else if (slot.booking) {
    // Show booking details
    console.log('Show booking details:', slot.booking)
    // TODO: Implement booking details modal
  }
}
</script>

<style scoped>
.room-timeline-item {
  transition: box-shadow 0.2s ease;
}
</style>
