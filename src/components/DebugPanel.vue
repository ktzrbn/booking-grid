<template>
  <div
    class="debug-panel"
    style="
      position: fixed;
      top: 10px;
      right: 10px;
      background: white;
      border: 2px solid #ccc;
      padding: 20px;
      max-width: 400px;
      z-index: 1000;
      font-family: monospace;
      font-size: 12px;
    "
  >
    <h3>LibCal API Debug</h3>
    <div><strong>Status:</strong> {{ status }}</div>
    <div v-if="roomCount > 0"><strong>Rooms Loaded:</strong> {{ roomCount }}</div>
    <div v-if="sampleRooms.length > 0">
      <strong>Sample Room Names:</strong>
      <ul>
        <li v-for="room in sampleRooms" :key="room.id">
          {{ room.name }} (Zone: {{ room.zone }}, Capacity: {{ room.capacity }})
        </li>
      </ul>
      <div style="margin-top: 10px; font-size: 10px; color: #666">
        <strong>Note:</strong> Check browser console for detailed API response structure
      </div>
    </div>
    <div v-if="error"><strong style="color: red">Error:</strong> {{ error }}</div>
    <button @click="testAPI" :disabled="loading">{{ loading ? 'Testing...' : 'Test API' }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { uriLibCalService } from '../services/uri-libcal'
import type { Room } from '@/types'

const status = ref('Not tested')
const roomCount = ref(0)
const sampleRooms = ref<Room[]>([])
const error = ref('')
const loading = ref(false)

const testAPI = async () => {
  loading.value = true
  status.value = 'Testing...'
  error.value = ''
  sampleRooms.value = []

  try {
    console.log('🧪 Starting API test...')
    const rooms = await uriLibCalService.getRooms()

    status.value = 'Success'
    roomCount.value = rooms.length
    sampleRooms.value = rooms.slice(0, 3)

    console.log('🎉 Test completed successfully', {
      roomCount: rooms.length,
      sampleRooms: rooms.slice(0, 3),
    })
  } catch (err) {
    status.value = 'Failed'
    error.value = err instanceof Error ? err.message : 'Unknown error'
    console.error('🚫 Test failed:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  testAPI()
})
</script>
