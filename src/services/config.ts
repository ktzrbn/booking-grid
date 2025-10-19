import type { LibCalConfig } from './types'

// LibCal API Configuration
// URI LibCal API details
export const libCalConfig: LibCalConfig = {
  // URI LibCal API base URL
  baseUrl: import.meta.env.VITE_LIBCAL_BASE_URL || 'https://uri.libcal.com/api/1.1',

  // URI LibCal API credentials
  clientId: import.meta.env.VITE_LIBCAL_CLIENT_ID || '1943',
  clientSecret: import.meta.env.VITE_LIBCAL_CLIENT_SECRET || '502dda4e63fc88dac46fe7f2dea49dfe',
}

// Location and Zone configuration
export const libraryConfig = {
  // URI Library location ID
  defaultLocationId: parseInt(import.meta.env.VITE_LOCATION_ID || '23510'),

  // Library name
  name: import.meta.env.VITE_LIBRARY_NAME || 'Carothers Library',

  // Your zone/category mappings
  zones: {
    A: { id: 1, name: 'Ground Floor' },
    B: { id: 2, name: 'Second Floor' },
    C: { id: 3, name: 'Third Floor' },
    D: { id: 4, name: 'Basement' },
    E: { id: 5, name: 'Media Center' },
    all: { id: 0, name: 'All Zones' },
  },
}

// URI LibCal API endpoints
export const apiEndpoints = {
  // Authentication
  token: '/oauth/token',

  // Room/Space endpoints
  searchFilters: '/space/search/filters',
  itemInfo: (id: string) => `/space/items/${id}`,

  // Availability endpoints
  hourlyAvailability: (id: string) => `/space/search/hourly/${id}`,
  dailyAvailability: (id: string) => `/space/search/daily/${id}`,

  // Booking endpoints
  reserve: '/space/reserve',
  cancel: (id: string) => `/space/cancel/${id}`,
  checkin: '/space/checkin',
  checkout: '/space/checkout',
}

// URI Library room item IDs - loaded from environment variables
export const roomItemIds = import.meta.env.VITE_ROOM_ITEM_IDS
  ? import.meta.env.VITE_ROOM_ITEM_IDS.split(',').map((id: string) => id.trim())
  : [
      // Fallback room IDs if not configured in .env
      '211617',
      '211618',
      '211619',
      '211620',
      '211621',
      '211622',
      '211623',
      '211624',
      '211625',
      '211626',
      '211627',
      '211628',
      '211629',
      '211630',
      '211631',
      '211632',
      '211633',
      '211634',
      '211635',
      '211636',
      '211637',
      '213873',
      '213874',
      '213875',
    ]
