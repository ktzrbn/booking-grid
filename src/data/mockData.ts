import type { Room, Booking, Availability } from '@/types'
import { format, addDays } from 'date-fns'

// Mock rooms data
export const mockRooms: Room[] = [
  {
    id: 'room-1',
    name: 'Study Room Alpha',
    capacity: 4,
    zone: 'A',
    location: 'Carothers Library - Ground Floor',
    amenities: ['WiFi', 'Display', 'Whiteboard', 'Quiet'],
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300',
  },
  {
    id: 'room-2',
    name: 'Collaboration Hub Beta',
    capacity: 8,
    zone: 'B',
    location: 'Carothers Library - Second Floor',
    amenities: ['WiFi', 'Display', 'Projector', 'Conference Phone', 'Coffee'],
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300',
  },
  {
    id: 'room-3',
    name: 'Focus Pod Gamma',
    capacity: 2,
    zone: 'A',
    location: 'Carothers Library - Ground Floor',
    amenities: ['WiFi', 'Quiet', 'Individual Desks'],
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=300',
  },
  {
    id: 'room-4',
    name: 'Conference Room Delta',
    capacity: 12,
    zone: 'C',
    location: 'Carothers Library - Third Floor',
    amenities: ['WiFi', 'Display', 'Projector', 'Conference Phone', 'Microphone', 'Coffee'],
    image: 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=300',
  },
  {
    id: 'room-5',
    name: 'Creative Space Epsilon',
    capacity: 6,
    zone: 'D',
    location: 'Carothers Library - Basement',
    amenities: ['WiFi', 'Display', 'Collaborative', 'Whiteboards'],
    image: 'https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=300',
  },
  {
    id: 'room-6',
    name: 'Silent Study Zeta',
    capacity: 1,
    zone: 'D',
    location: 'Carothers Library - Quiet Zone',
    amenities: ['WiFi', 'Quiet', 'Individual Desk'],
    image: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=300',
  },
  {
    id: 'room-7',
    name: 'Media Lab Eta',
    capacity: 6,
    zone: 'E',
    location: 'Carothers Library - Media Center',
    amenities: ['WiFi', 'Display', 'Projector', 'Audio Equipment', 'Microphone'],
    image: 'https://images.unsplash.com/photo-1497366672149-e5e4b4d34966?w=300',
  },
  {
    id: 'room-8',
    name: 'Group Study Theta',
    capacity: 8,
    zone: 'B',
    location: 'Carothers Library - Second Floor',
    amenities: ['WiFi', 'Display', 'Collaborative', 'Whiteboards', 'Coffee'],
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300',
  },
  {
    id: 'room-9',
    name: 'Private Office Iota',
    capacity: 3,
    zone: 'C',
    location: 'Carothers Library - Third Floor',
    amenities: ['WiFi', 'Display', 'Quiet', 'Conference Phone'],
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=300',
  },
  {
    id: 'room-10',
    name: 'Presentation Room Kappa',
    capacity: 15,
    zone: 'E',
    location: 'Carothers Library - Media Center',
    amenities: ['WiFi', 'Display', 'Projector', 'Audio Equipment', 'Microphone', 'Coffee'],
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300',
  },
]

// Generate time slots for a given date
const generateTimeSlots = (roomId: string, date: string) => {
  const slots = []
  const today = format(new Date(), 'yyyy-MM-dd')

  // Generate slots from 8 AM to 10 PM
  for (let hour = 8; hour <= 21; hour++) {
    // Hourly slots
    const timeSlot = {
      start: `${hour.toString().padStart(2, '0')}:00`,
      end: `${(hour + 1).toString().padStart(2, '0')}:00`,
    }

    // Check if this slot should be booked
    let isAvailable = true
    let bookingId = undefined

    // Study Room Alpha (room-1) is booked from 4pm to 8pm today
    if (roomId === 'room-1' && date === today && hour >= 16 && hour < 20) {
      isAvailable = false
      bookingId = 'booking-alpha-4pm-8pm'
    }

    slots.push({
      slot: timeSlot,
      isAvailable,
      bookingId,
    })

    // Half-hour slots (e.g., 8:30-9:30) - but not for the last hour
    if (hour < 21) {
      const halfHourSlot = {
        start: `${hour.toString().padStart(2, '0')}:30`,
        end: `${(hour + 1).toString().padStart(2, '0')}:30`,
      }

      // Check if this half-hour slot should be booked
      let halfHourAvailable = true
      let halfHourBookingId = undefined

      // Study Room Alpha (room-1) is booked from 4pm to 8pm today
      if (roomId === 'room-1' && date === today && hour >= 16 && hour < 20) {
        halfHourAvailable = false
        halfHourBookingId = 'booking-alpha-4pm-8pm'
      }

      slots.push({
        slot: halfHourSlot,
        isAvailable: halfHourAvailable,
        bookingId: halfHourBookingId,
      })
    }
  }

  // Add the final slot from 21:00 to 22:00 (9 PM to 10 PM)
  slots.push({
    slot: {
      start: '21:00',
      end: '22:00',
    },
    isAvailable: true,
    bookingId: undefined,
  })

  return slots
}

// Generate availability for all rooms for the next 7 days
export const generateMockAvailability = (): Availability[] => {
  const availability: Availability[] = []
  const today = new Date()

  // Generate for 7 days starting from yesterday
  for (let dayOffset = -1; dayOffset < 6; dayOffset++) {
    const date = format(addDays(today, dayOffset), 'yyyy-MM-dd')

    mockRooms.forEach((room) => {
      availability.push({
        roomId: room.id,
        date,
        timeSlots: generateTimeSlots(room.id, date),
      })
    })
  }

  return availability
}

// Generate sample bookings
export const generateMockBookings = (): Booking[] => {
  const bookings: Booking[] = []
  const today = new Date()

  // Generate some sample bookings
  const sampleBookings = [
    {
      roomId: 'room-1',
      date: format(today, 'yyyy-MM-dd'),
      timeSlot: { start: '16:00', end: '20:00' },
      userName: 'Test User',
      purpose: 'Extended Study Session',
    },
    {
      roomId: 'room-1',
      date: format(today, 'yyyy-MM-dd'),
      timeSlot: { start: '09:00', end: '10:00' },
      userName: 'John Smith',
      purpose: 'Study Group Session',
    },
    {
      roomId: 'room-2',
      date: format(today, 'yyyy-MM-dd'),
      timeSlot: { start: '14:00', end: '16:00' },
      userName: 'Sarah Johnson',
      purpose: 'Team Project Meeting',
    },
    {
      roomId: 'room-3',
      date: format(addDays(today, 1), 'yyyy-MM-dd'),
      timeSlot: { start: '10:00', end: '12:00' },
      userName: 'Mike Wilson',
      purpose: 'Research Work',
    },
    {
      roomId: 'room-4',
      date: format(today, 'yyyy-MM-dd'),
      timeSlot: { start: '16:00', end: '18:00' },
      userName: 'Emily Davis',
      purpose: 'Client Presentation',
    },
    {
      roomId: 'room-1',
      date: format(addDays(today, 2), 'yyyy-MM-dd'),
      timeSlot: { start: '13:00', end: '15:00' },
      userName: 'Alex Chen',
      purpose: 'Study Session',
    },
  ]

  sampleBookings.forEach((booking, index) => {
    bookings.push({
      id: `booking-${index + 1}`,
      userId: `user-${index + 1}`,
      ...booking,
      status: 'confirmed' as const,
    })
  })

  return bookings
}

// Initialize mock data
export const initializeMockData = () => {
  return {
    rooms: mockRooms,
    bookings: generateMockBookings(),
    availability: generateMockAvailability(),
  }
}
