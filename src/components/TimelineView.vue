<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">Room Booking</h1>
            <div class="ml-6 flex items-center space-x-2 text-sm text-gray-600">
              <Calendar class="h-4 w-4" />
              <span class="font-medium">{{ formatDate(selectedDate) }}</span>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Date Selector -->
            <div class="flex items-center space-x-2">
              <button
                @click="changeDate(-1)"
                class="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft class="h-4 w-4" />
              </button>

              <button
                @click="setToday"
                class="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
              >
                Today
              </button>

              <button
                @click="changeDate(1)"
                class="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Next Day"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>

            <!-- Quick Filters -->
            <div class="flex items-center space-x-2">
              <select
                v-model="quickCapacityFilter"
                @change="updateQuickFilter"
                class="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="1">Any Size</option>
                <option value="2">2+ People</option>
                <option value="4">4+ People</option>
                <option value="8">8+ People</option>
              </select>

              <select
                v-model="quickZoneFilter"
                @change="updateQuickFilter"
                class="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Zones</option>
                <option value="A">Zone A</option>
                <option value="B">Zone B</option>
                <option value="C">Zone C</option>
                <option value="D">Zone D</option>
                <option value="E">Zone E</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Stats Banner -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ availableRoomsCount }}</div>
            <div class="text-sm text-gray-600">Available Now</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600">{{ bookedRoomsCount }}</div>
            <div class="text-sm text-gray-600">Currently Booked</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ totalRoomsCount }}</div>
            <div class="text-sm text-gray-600">Total Rooms</div>
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search rooms by name, location, or amenity..."
            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-lg"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-flex items-center space-x-2 text-gray-600">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span>Loading rooms...</span>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6"
      >
        <div class="flex items-center">
          <AlertCircle class="h-5 w-5 mr-2" />
          {{ error }}
        </div>
      </div>

      <!-- No Results -->
      <div v-else-if="filteredRooms.length === 0" class="text-center py-12">
        <div class="text-gray-500">
          <Search class="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p class="text-lg font-medium">No rooms found</p>
          <p class="text-sm">Try adjusting your search or filters</p>
        </div>
      </div>

      <!-- Rooms Timeline List -->
      <div v-else class="space-y-4">
        <RoomTimelineItem
          v-for="room in filteredRooms"
          :key="room.id"
          :room="room"
          :date="selectedDate"
        />
      </div>

      <!-- Legend -->
      <div class="bg-white rounded-lg border border-gray-200 p-4 mt-6">
        <div class="flex items-center justify-center space-x-8 text-sm">
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-green-400 rounded"></div>
            <span class="text-gray-600">Available</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-red-400 rounded"></div>
            <span class="text-gray-600">Booked</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-0.5 h-4 bg-blue-500 rounded"></div>
            <span class="text-gray-600">Current Time</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Calendar, ChevronLeft, ChevronRight, Search, AlertCircle } from 'lucide-vue-next'
import { format, addDays } from 'date-fns'
import { useBookingStore } from '@/stores/booking'
import RoomTimelineItem from './RoomTimelineItem.vue'

const store = useBookingStore()

console.warn('📅 TimelineView component mounted!')

// Local reactive state
const searchQuery = ref('')
const quickCapacityFilter = ref('1')
const quickZoneFilter = ref('all')

// Computed properties from store
const selectedDate = computed(() => store.selectedDate)

// Debug date information
console.warn(`📅 Current selectedDate from store: ${selectedDate.value}`)
console.warn(`📅 Raw Date object: ${new Date()}`)
console.warn(`📅 Raw Date toISOString: ${new Date().toISOString()}`)
console.warn(`📅 Format function result: ${format(new Date(), 'yyyy-MM-dd')}`)
const loading = computed(() => store.loading)
const error = computed(() => store.error)
const filteredRooms = computed(() => {
  const rooms = store.filteredRooms
  console.warn(`🏠 TimelineView filteredRooms: ${rooms.length} rooms`, rooms.map(r => `${r.id}: ${r.name}`))
  return rooms
})

// Stats computed properties
const availableRoomsCount = computed(() => {
  return filteredRooms.value.filter((room) => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    if (currentHour < 8 || currentHour >= 22) return false

    const currentTime =
      `${currentHour.toString().padStart(2, '0')}:${Math.floor(currentMinute / 30) * 30}`.padStart(
        2,
        '0',
      )
    const nextSlotTime =
      currentMinute < 30
        ? `${currentHour.toString().padStart(2, '0')}:30`
        : `${(currentHour + 1).toString().padStart(2, '0')}:00`

    return store.isSlotAvailable(room.id, selectedDate.value, {
      start: currentTime,
      end: nextSlotTime,
    })
  }).length
})

const bookedRoomsCount = computed(() => {
  return filteredRooms.value.length - availableRoomsCount.value
})

const totalRoomsCount = computed(() => {
  return filteredRooms.value.length
})

// Methods
const formatDate = (date: string) => {
  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  if (date === today) {
    return `Today, ${format(new Date(date), 'MMM d')}`
  } else if (date === tomorrow) {
    return `Tomorrow, ${format(new Date(date), 'MMM d')}`
  }

  return format(new Date(date), 'EEEE, MMM d, yyyy')
}

const changeDate = async (days: number) => {
  const currentDate = new Date(selectedDate.value)
  const newDate = addDays(currentDate, days)
  const newDateStr = format(newDate, 'yyyy-MM-dd')
  console.warn(`📅 CHANGING DATE TO: ${newDateStr} (${days > 0 ? 'next' : 'previous'} day)`)
  store.setSelectedDate(newDateStr)
  
  // Reload availability data for the new date
  console.warn(`🔄 Reloading availability data for ${newDateStr}`)
  await store.loadAvailabilityForDate(newDateStr)
}

const setToday = async () => {
  // Force correct local date
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  console.warn(`📅 SETTING TO TODAY (FORCED LOCAL): ${todayStr}`)
  store.setSelectedDate(todayStr)
  
  // Reload availability data for today
  console.warn(`🔄 Reloading availability data for today`)
  await store.loadAvailabilityForDate(todayStr)
}

const updateQuickFilter = () => {
  store.updateFilters({
    capacity: parseInt(quickCapacityFilter.value),
    zone: quickZoneFilter.value,
  })
}

// Watch for search query changes with debouncing
let searchTimeout: number
watch(searchQuery, (newQuery) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.updateFilters({
      searchQuery: newQuery,
    })
  }, 300)
})

// Watch for filter changes to update quick filters
watch(
  () => store.filters,
  (newFilters) => {
    quickCapacityFilter.value = newFilters.capacity.toString()
    quickZoneFilter.value = newFilters.zone
  },
  { deep: true },
)
</script>

<style scoped>
/* Custom styles for better mobile experience */
@media (max-width: 640px) {
  .grid-cols-1 {
    grid-template-columns: 1fr;
  }
}
</style>
