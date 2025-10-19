<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
          <Building class="h-6 w-6 text-gray-500" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">{{ room.name }}</h3>
          <p class="text-sm text-gray-600">{{ room.location }}</p>
        </div>
      </div>

      <div class="text-right">
        <div class="text-sm text-gray-600">Capacity: {{ room.capacity }}</div>
        <div class="text-xs text-gray-500">Zone {{ room.zone }}</div>
      </div>
    </div>

    <div class="flex flex-wrap gap-1 mb-3">
      <span
        v-for="amenity in room.amenities.slice(0, 3)"
        :key="amenity"
        class="px-2 py-1 bg-gray-100 text-xs rounded"
      >
        {{ amenity }}
      </span>
    </div>

    <div class="flex justify-between items-center">
      <div class="text-sm text-gray-600">Next: <span class="font-medium">2:00 PM</span></div>
      <button class="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">
        View Details
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Building } from 'lucide-vue-next'
import type { Room } from '@/types'

interface Props {
  room: Room
  date: string
}

defineProps<Props>()
</script>
