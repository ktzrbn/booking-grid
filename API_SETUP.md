# Springshare LibCal API Integration

This project integrates with Springshare LibCal APIs to provide real-time room booking data. Here's how to set it up:

## 🔧 API Setup Instructions

### 1. Get LibCal API Credentials

1. **Access LibCal Admin**
   - Go to your LibCal admin panel
   - Navigate to **Admin** → **API/Widgets**

2. **Create API Application**
   - Click **"Add New Application"**
   - Fill in application details:
     - **Name**: "Room Booking Grid"
     - **Description**: "Modern room booking interface"
     - **Redirect URI**: Not required for client credentials flow
   - Note down your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

1. **Copy the environment template**:

   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your LibCal details** in `.env.local`:

   ```env
   # Your LibCal API base URL
   VITE_LIBCAL_BASE_URL=https://yourlibrary.libcal.com/api

   # API credentials from LibCal Admin
   VITE_LIBCAL_CLIENT_ID=your_actual_client_id
   VITE_LIBCAL_CLIENT_SECRET=your_actual_client_secret

   # Your location ID (find this in LibCal Admin > Locations)
   VITE_LIBCAL_LOCATION_ID=23510
   ```

### 3. Find Your Location ID

1. In LibCal Admin, go to **Locations**
2. Edit your location and note the ID in the URL
3. Or check the original URL you provided: `lid=23510`

### 4. Switch to API Data Source

To use real LibCal data instead of mock data, update `src/App.vue`:

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import BookingGrid from './components/BookingGrid.vue'
import { useBookingStore } from './stores/booking-api' // Switch to API store

const store = useBookingStore()

// Initialize with real API data
onMounted(async () => {
  try {
    await store.initializeData()
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})
</script>

<template>
  <BookingGrid />
</template>
```

## 📁 API Service Structure

```
src/services/
├── index.ts           # Main service export
├── libcal-api.ts      # Raw LibCal API client
├── adapters.ts        # Data format converters
├── config.ts          # API configuration
└── types.ts           # LibCal API type definitions
```

## 🔄 How It Works

1. **Authentication**: Uses OAuth 2.0 client credentials flow
2. **Data Fetching**: Pulls rooms, availability, and bookings from LibCal
3. **Format Conversion**: Converts LibCal data to your app's format
4. **Fallback**: Uses mock data if API fails
5. **Real-time**: Can refresh data periodically

## 🚀 Available API Methods

### From `useBookingStore()`:

```typescript
// Initialize API connection
await store.initializeAPI()

// Load all data
await store.initializeData()

// Load rooms
await store.loadRooms()

// Load availability for specific date
await store.loadAvailability('2025-10-10')

// Load bookings
await store.loadBookings('2025-10-10', '2025-10-10')

// Create new booking
const booking = await store.createBooking(
  'room-123', // Room ID
  '2025-10-10', // Date
  '14:00', // Start time
  '16:00', // End time
  12345, // Patron ID (optional)
  'Meeting', // Purpose (optional)
)

// Cancel booking
await store.cancelBooking('booking-456')
```

## 🔍 LibCal API Endpoints Used

- `GET /1.1/locations` - Get library locations
- `GET /1.1/space/locations/{lid}` - Get spaces/rooms
- `GET /1.1/space/availability` - Get room availability
- `GET /1.1/space/bookings` - Get existing bookings
- `POST /1.1/space/booking` - Create new booking
- `DELETE /1.1/space/booking/{id}` - Cancel booking

## 🛠 Development vs Production

**Development**:

- Uses `.env.local` for local testing
- Falls back to mock data if API fails
- Logs API calls to console

**Production**:

- Use environment variables in your hosting platform
- Remove console.log statements
- Set up proper error monitoring

## 📚 LibCal API Documentation

For detailed API documentation, visit:

- [LibCal API Documentation](https://springshare.com/libcal/docs/api.html)
- [LibCal OAuth Guide](https://springshare.com/libcal/docs/api_oauth.html)

## ⚠️ Important Notes

1. **Rate Limits**: LibCal has API rate limits - implement caching if needed
2. **CORS**: May need to proxy API calls through your backend in production
3. **Authentication**: Tokens expire - the service handles renewal automatically
4. **Permissions**: Ensure your API credentials have the right permissions for booking management

## 🔧 Troubleshooting

**"Authentication failed"**:

- Check your Client ID and Client Secret
- Verify the LibCal base URL is correct

**"No rooms found"**:

- Check your Location ID is correct
- Verify your API credentials have access to that location

**CORS errors**:

- LibCal APIs may require server-side proxy in production
- Consider setting up a backend API to handle LibCal communication
