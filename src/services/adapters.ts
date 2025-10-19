import type { Room, Booking, Availability } from '@/types'
import type { LibCalSpace, LibCalAvailability, LibCalBooking } from './types'

// Convert LibCal space to app Room format
export function libCalSpaceToRoom(space: LibCalSpace): Room {
  return {
    id: `room-${space.id}`,
    name: space.name,
    capacity: space.capacity,
    zone: getZoneFromLibCalSpace(space),
    location: space.location?.name || 'Unknown Location',
    amenities: space.amenities?.map((a) => a.name) || [],
    image: space.image || getDefaultRoomImage(),
  }
}

// Convert LibCal booking to app Booking format
export function libCalBookingToBooking(booking: LibCalBooking): Booking {
  const startDateTime = new Date(booking.start)
  const endDateTime = new Date(booking.end)

  return {
    id: `booking-${booking.id}`,
    roomId: `room-${booking.space_id}`,
    userId: `user-${booking.patron.id}`,
    userName: booking.patron.name,
    date: booking.date,
    timeSlot: {
      start: formatTimeFromDate(startDateTime),
      end: formatTimeFromDate(endDateTime),
    },
    status: booking.status,
    purpose: booking.purpose,
  }
}

// Convert LibCal availability to app Availability format
export function libCalAvailabilityToAvailability(availability: LibCalAvailability): Availability {
  return {
    roomId: `room-${availability.space_id}`,
    date: availability.date,
    timeSlots: availability.slots.map((slot) => ({
      slot: {
        start: slot.start,
        end: slot.end,
      },
      isAvailable: slot.available,
      bookingId: slot.booking_id ? `booking-${slot.booking_id}` : undefined,
    })),
  }
}

// Helper functions
function getZoneFromLibCalSpace(space: LibCalSpace): string {
  // Map LibCal category or zone to your app's zone system
  if (space.category?.cid) {
    const zoneMap: Record<number, string> = {
      1: 'A', // Ground Floor
      2: 'B', // Second Floor
      3: 'C', // Third Floor
      4: 'D', // Basement
      5: 'E', // Media Center
    }
    return zoneMap[space.category.cid] || 'A'
  }

  if (space.zone_id) {
    const zoneMap: Record<number, string> = {
      1: 'A',
      2: 'B',
      3: 'C',
      4: 'D',
      5: 'E',
    }
    return zoneMap[space.zone_id] || 'A'
  }

  return 'A' // Default zone
}

function getDefaultRoomImage(): string {
  const images = [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=300',
    'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=300',
  ]
  const index = Math.floor(Math.random() * images.length)
  return images[index] ?? images[0]!
}

function formatTimeFromDate(date: Date): string {
  return date.toTimeString().slice(0, 5) // HH:MM format
}

// Convert app booking to LibCal format for API calls
export function bookingToLibCalFormat(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  patronId?: number,
  purpose?: string,
) {
  const spaceId = parseInt(roomId.replace('room-', ''))
  const startDateTime = `${date}T${startTime}:00`
  const endDateTime = `${date}T${endTime}:00`

  return {
    space_id: spaceId,
    start: startDateTime,
    end: endDateTime,
    patron_id: patronId,
    purpose,
  }
}

// Helper to extract space ID from room ID
export function getRoomIdAsSpaceId(roomId: string): number {
  return parseInt(roomId.replace('room-', ''))
}

// Helper to extract booking ID from app booking ID
export function getBookingIdAsLibCalId(bookingId: string): number {
  return parseInt(bookingId.replace('booking-', ''))
}
