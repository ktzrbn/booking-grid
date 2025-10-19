<script setup lang="ts">
import { onMounted } from 'vue'
import BookingGrid from './components/BookingGrid.vue'
import DebugPanel from './components/DebugPanel.vue'
import { useBookingStore } from './stores/booking'
import { uriLibCalService } from './services/uri-libcal'
import type { Availability } from '@/types'

const store = useBookingStore()

// Test API integration with fallback to mock data
onMounted(async () => {
  console.log('🚀 Testing URI LibCal API connection...')

  try {
    // Test API connection by fetching rooms
    console.log('📡 Fetching rooms from URI LibCal API...')
    const apiRooms = await uriLibCalService.getRooms()

    if (apiRooms && apiRooms.length > 0) {
      console.log('✅ API Success! Loaded', apiRooms.length, 'rooms from URI LibCal')
      console.log('📋 First few rooms:', apiRooms.slice(0, 3))

      // Show room data to user for debugging
      const roomSample = apiRooms
        .slice(0, 3)
        .map((r) => `${r.name} (Zone ${r.zone}) - Capacity: ${r.capacity}`)
        .join(', ')
      console.log('🔍 ROOM SAMPLE FOR DEBUGGING:', roomSample)
      alert(`API Success! Sample rooms: ${roomSample}`)

      // Update store with API data
      store.rooms = apiRooms

      // Load real availability data for all rooms
      console.log('📅 Loading availability for all rooms...')
      const today = new Date().toISOString().split('T')[0] as string
      const availabilityData: Availability[] = []

      for (const room of apiRooms) {
        if (!room.id) continue // Skip rooms without valid ID

        try {
          console.log(`📅 Loading availability for room ${room.id}`)
          const roomAvailability = await uriLibCalService.getHourlyAvailability(room.id, today)
          availabilityData.push(roomAvailability)
          console.log(
            `✅ Loaded ${roomAvailability.timeSlots.length} time slots for room ${room.id}`,
          )
        } catch (error) {
          console.warn(`⚠️ Failed to load availability for room ${room.id}:`, error)
          // Create default availability for this room if API fails
          availabilityData.push({
            roomId: room.id,
            date: today,
            timeSlots: [
              // Generate basic available slots as fallback
              ...Array.from({ length: 14 }, (_, i) => ({
                slot: {
                  start: `${(8 + i).toString().padStart(2, '0')}:00`,
                  end: `${(9 + i).toString().padStart(2, '0')}:00`,
                },
                isAvailable: true,
                bookingId: undefined,
              })),
            ],
          })
        }
      }

      // Initialize store with empty arrays first
      store.bookings = []
      store.availability = availabilityData

      console.log('✅ All availability data loaded:', availabilityData.length, 'rooms')
    } else {
      console.warn('⚠️ API returned no rooms, using mock data')
      await store.initializeMockData()
    }
  } catch (error) {
    console.error('❌ API connection failed, falling back to mock data:', error)
    alert(`API Connection Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.log('🔄 Falling back to mock data...')
    await store.initializeMockData()
  }
})
</script>

<template>
  <DebugPanel />
  <BookingGrid />
</template>
