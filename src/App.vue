<script setup lang="ts">
import { onMounted } from 'vue'
import TimelineView from './components/TimelineView.vue'
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
      console.log(`🏠 API returned ${apiRooms.length} rooms:`, apiRooms.map(r => `${r.id}: ${r.name}`))
      const today = store.selectedDate // Use the store's selected date instead of creating a new one
      console.log(`📅 Using date from store: ${today}`)
      const availabilityData: Availability[] = []

      for (const room of apiRooms) {
        if (!room.id) {
          console.warn(`⚠️ Skipping room without ID:`, room)
          continue // Skip rooms without valid ID
        }

        try {
          console.warn(`📅 LOADING AVAILABILITY FOR ROOM ${room.id} (${room.name})`)
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

      console.warn('✅ ALL AVAILABILITY DATA LOADED:', availabilityData.length, 'rooms')
      console.warn('📊 STORE AVAILABILITY SAMPLE:', availabilityData.slice(0, 2).map(a => ({
        roomId: a.roomId,
        date: a.date,
        slots: a.timeSlots.length,
        sampleSlots: a.timeSlots.slice(0, 3).map(ts => `${ts.slot.start}-${ts.slot.end}: ${ts.isAvailable ? 'AVAILABLE' : 'BOOKED'}`)
      })))
    } else {
      console.warn('⚠️ API returned no rooms - check your configuration')
      store.initializeEmpty()
    }
  } catch (error) {
    console.error('❌ API connection failed:', error)
    alert(`API Connection Failed: ${error instanceof Error ? error.message : 'Unknown error'}. Check your .env configuration.`)
    store.initializeEmpty()
  }
})
</script>

<template>
  <TimelineView />
</template>
