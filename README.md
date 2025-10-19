# LibCal Booking Grid

A modern Vue.js application for viewing library room availability with horizontal timeline views. Integrates with Springshare LibCal API to display real-time room booking information.

## Features

- 📅 **Timeline View**: Horizontal hourly timelines with green/red availability indicators
- 🏢 **Real LibCal Integration**: Connects to your LibCal API for live room data
- 🔍 **Search & Filters**: Filter rooms by capacity, zone, and date range
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Clean, professional interface for library staff and patrons

## Setup

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Configure Environment**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your LibCal configuration:

   ```env
   VITE_LIBCAL_TOKEN=your_api_token_here
   VITE_LIBCAL_BASE_URL=https://your-library.libcal.com/api/1.1
   VITE_LIBRARY_NAME=Your Library Name
   VITE_LOCATION_ID=12345
   VITE_ROOM_ITEM_IDS=211617,211618,211619
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

## LibCal API Configuration

Contact your LibCal administrator to obtain:

- API token with room/space permissions
- Library location ID
- List of room item IDs for spaces to display

The application requires read access to:

- `/space/locations` - Library locations
- `/space/item/{id}` - Individual room information
- `/space/bookings` - Room booking data

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
npm run test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
npm run build
npm run test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
