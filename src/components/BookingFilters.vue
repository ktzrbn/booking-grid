<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">Filters</h2>
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="text-sm text-primary-600 hover:text-primary-700"
      >
        Clear All
      </button>
    </div>

    <!-- Search -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Search Rooms</label>
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          v-model="localFilters.searchQuery"
          type="text"
          placeholder="Room name, location, or amenity..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          @input="debounceUpdate"
        />
      </div>
    </div>

    <!-- Capacity -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Minimum Capacity: {{ localFilters.capacity }} people
      </label>
      <input
        v-model.number="localFilters.capacity"
        type="range"
        min="1"
        max="20"
        step="1"
        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        @input="debounceUpdate"
      />
      <div class="flex justify-between text-xs text-gray-500 mt-1">
        <span>1</span>
        <span>20</span>
      </div>
    </div>

    <!-- Zone -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Zone</label>
      <select
        v-model="localFilters.zone"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        @change="updateFilters"
      >
        <option value="all">All Zones</option>
        <option value="A">Zone A - Ground Floor</option>
        <option value="B">Zone B - Second Floor</option>
        <option value="C">Zone C - Third Floor</option>
        <option value="D">Zone D - Quiet Study</option>
        <option value="E">Zone E - Collaborative</option>
      </select>
    </div>

    <!-- Time Range -->
    <div class="space-y-3">
      <label class="block text-sm font-medium text-gray-700">Time Range</label>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Start Time</label>
          <select
            v-model="localFilters.startTime"
            class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            @change="updateFilters"
          >
            <option value="">Any</option>
            <option v-for="time in timeOptions" :key="time" :value="time">
              {{ formatTime(time) }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">End Time</label>
          <select
            v-model="localFilters.endTime"
            class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            @change="updateFilters"
          >
            <option value="">Any</option>
            <option v-for="time in timeOptions" :key="time" :value="time">
              {{ formatTime(time) }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Amenities -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
      <div class="space-y-2">
        <label
          v-for="amenity in availableAmenities"
          :key="amenity.value"
          class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
        >
          <input
            v-model="localFilters.amenities"
            type="checkbox"
            :value="amenity.value"
            class="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            @change="updateFilters"
          />
          <div class="ml-3 flex items-center">
            <component :is="amenity.icon" class="h-4 w-4 text-gray-500 mr-2" />
            <span class="text-sm text-gray-700">{{ amenity.label }}</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Summary -->
    <div v-if="filteredCount !== undefined" class="pt-4 border-t border-gray-200">
      <div class="flex items-center text-sm text-gray-600">
        <Filter class="h-4 w-4 mr-2" />
        <span>{{ filteredCount }} rooms match your criteria</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Search,
  Filter,
  Wifi,
  Monitor,
  Coffee,
  Volume2,
  Users,
  Projector,
  Phone,
  Mic,
} from 'lucide-vue-next'
import { useBookingStore } from '@/stores/booking'

const store = useBookingStore()

// Local filters for immediate UI updates
const localFilters = ref({
  searchQuery: store.filters.searchQuery,
  capacity: store.filters.capacity,
  zone: store.filters.zone,
  startTime: store.filters.startTime || '',
  endTime: store.filters.endTime || '',
  amenities: [...store.filters.amenities],
})

// Available amenities with icons
const availableAmenities = [
  { value: 'WiFi', label: 'High-Speed WiFi', icon: Wifi },
  { value: 'Display', label: 'Large Display/TV', icon: Monitor },
  { value: 'Coffee', label: 'Coffee Machine', icon: Coffee },
  { value: 'Quiet', label: 'Quiet Zone', icon: Volume2 },
  { value: 'Collaborative', label: 'Collaborative Space', icon: Users },
  { value: 'Projector', label: 'Projector', icon: Projector },
  { value: 'Conference Phone', label: 'Conference Phone', icon: Phone },
  { value: 'Microphone', label: 'Microphone System', icon: Mic },
]

// Time options (8 AM to 10 PM in 30-minute intervals)
const timeOptions = computed(() => {
  const times = []
  for (let hour = 8; hour <= 22; hour++) {
    times.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 22) {
      times.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }
  return times
})

const filteredCount = computed(() => store.filteredRooms.length)

const hasActiveFilters = computed(() => {
  return (
    localFilters.value.searchQuery !== '' ||
    localFilters.value.capacity > 1 ||
    localFilters.value.zone !== 'all' ||
    localFilters.value.startTime !== '' ||
    localFilters.value.endTime !== '' ||
    localFilters.value.amenities.length > 0
  )
})

// Debounced update function for search input
let debounceTimeout: number
const debounceUpdate = () => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    updateFilters()
  }, 300)
}

const updateFilters = () => {
  store.updateFilters({
    searchQuery: localFilters.value.searchQuery,
    capacity: localFilters.value.capacity,
    zone: localFilters.value.zone,
    startTime: localFilters.value.startTime || undefined,
    endTime: localFilters.value.endTime || undefined,
    amenities: localFilters.value.amenities,
  })
}

const clearFilters = () => {
  localFilters.value = {
    searchQuery: '',
    capacity: 1,
    zone: 'all',
    startTime: '',
    endTime: '',
    amenities: [],
  }
  updateFilters()
}

const formatTime = (time: string) => {
  const [hour, minute] = time.split(':')
  const h = parseInt(hour || '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayHour}:${minute} ${ampm}`
}

// Watch for external filter changes
watch(
  () => store.filters,
  (newFilters) => {
    localFilters.value = {
      searchQuery: newFilters.searchQuery,
      capacity: newFilters.capacity,
      zone: newFilters.zone,
      startTime: newFilters.startTime || '',
      endTime: newFilters.endTime || '',
      amenities: [...newFilters.amenities],
    }
  },
  { deep: true },
)
</script>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}
</style>
