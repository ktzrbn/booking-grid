<template>
  <div class="booking-grid-container">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">Room Booking System</h1>
            <div class="ml-4 text-sm text-gray-600">
              Today - {{ format(new Date(), 'EEEE, MMMM d, yyyy') }}
            </div>
            <!-- API Status Indicator -->
            <div class="ml-4 text-xs">
              <span
                v-if="store.rooms.length > 0"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                🟢 LibCal API ({{ store.rooms.length }} rooms)
              </span>
              <span
                v-else
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
              >
                ❌ No Data (check .env configuration)
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-flex items-center space-x-2 text-gray-600">
          <div
            class="animate-spin rounded-full h-6 w-6 border-b-2"
            style="border-color: #2563eb"
          ></div>
          <span>Loading rooms...</span>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="p-4 text-red-700"
        style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem"
      >
        <div class="flex items-center">
          <AlertCircle class="h-5 w-5 mr-2" />
          {{ error }}
        </div>
      </div>

      <!-- Room Cards Grid -->
      <div v-else class="space-y-6">
        <div v-if="filteredRooms.length === 0" class="text-center py-12">
          <div class="text-gray-500">
            <Search class="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p class="text-lg font-medium">No rooms found</p>
            <p class="text-sm">Try adjusting your filters</p>
          </div>
        </div>

        <div v-else class="grid gap-6">
          <RoomCard
            v-for="room in filteredRooms"
            :key="room.id"
            :room="room"
            :date="selectedDate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Search, AlertCircle } from 'lucide-vue-next'
import { format } from 'date-fns'
import { useBookingStore } from '@/stores/booking'

// Components
import RoomCard from './RoomCard.vue'

const store = useBookingStore()

// Use computed properties to access reactive store values
const selectedDate = computed(() => store.selectedDate)
const loading = computed(() => store.loading)
const error = computed(() => store.error)
const filteredRooms = computed(() => store.filteredRooms)
</script>

<style scoped>
.booking-grid-container {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>
