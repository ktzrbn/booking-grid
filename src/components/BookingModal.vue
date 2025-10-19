<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    @click="closeModal"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6" @click.stop>
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Book Room</h3>
      <div class="text-center py-8 text-gray-500">
        <p>Booking modal coming soon</p>
      </div>
      <div class="flex justify-end space-x-3 mt-6">
        <button
          @click="closeModal"
          class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
          Book Now
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

const closeModal = () => {
  isOpen.value = false
}
</script>
