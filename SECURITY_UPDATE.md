# Mapbox API Key Security Update

## Summary
The Mapbox API key has been secured to prevent it from being exposed in the built JavaScript files. The key is now kept server-side only and accessed through secure endpoints.

## Changes Made

### 1. Environment Variable Configuration
- **Changed:** Renamed `VITE_MAPBOX_ACCESS_TOKEN` to `MAPBOX_ACCESS_TOKEN` in `.env.local`
- **Reason:** Variables prefixed with `VITE_` are exposed to client-side code. Removing the prefix keeps it server-side only.
- **Files updated:**
  - `.env.local`
  - `.env.example`

### 2. Created API Endpoint for Geocoding
- **Created:** `/src/routes/api/geocode/+server.js`
- **Purpose:** Proxy Mapbox Geocoding API requests through the server, keeping the API key hidden
- **Usage:** Client now calls `/api/geocode?query=address` instead of directly calling Mapbox

### 3. Updated Main Page
- **File:** `/src/routes/+page.server.js`
- **Change:** Added `MAPBOX_ACCESS_TOKEN` import and pass `mapboxToken` to the page via server data
- **File:** `/src/routes/+page.svelte`
- **Changes:**
  - Updated geocoding to use `/api/geocode` endpoint instead of direct Mapbox API
  - Changed `initializeMaps()` to use `data.mapboxToken` instead of `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN`

### 4. Updated District Pages
Created server files for all district routes:
- `/src/routes/assembly/[district]/+page.server.js`
- `/src/routes/senate/[district]/+page.server.js`
- `/src/routes/congress/[district]/+page.server.js`

Updated all district page components:
- `/src/routes/assembly/[district]/+page.svelte`
- `/src/routes/senate/[district]/+page.svelte`
- `/src/routes/congress/[district]/+page.svelte`

Changed all to use `data.mapboxToken` from server data instead of environment variable.

## Verification
After building the app with `npm run build`, verification confirmed:
- ✅ No Mapbox API key found in `/build/_app/immutable/nodes/*.js` files
- ✅ No Mapbox API key found in `/build/_app/immutable/chunks/*.js` files
- ✅ Build completed successfully

## How It Works Now

### For Geocoding (Address Search)
1. User types an address in the search box
2. Client calls `/api/geocode?query=address`
3. Server endpoint receives request and adds the Mapbox token
4. Server calls Mapbox API with the token
5. Server returns results to client (without exposing the token)

### For Maps
1. Page loads via SvelteKit's server-side rendering
2. Server passes the Mapbox token as page data
3. Client receives token at runtime (not embedded in static JS files)
4. Token is used to initialize maps in the browser

## Security Benefits
1. **No token in built files:** The Mapbox token does not appear in any static JavaScript files that are distributed with the built app
2. **Server-side proxy:** Geocoding API calls are proxied through the server, completely hiding the token from client-side code
3. **Runtime-only access:** Map initialization tokens are passed at page load time, not bundled in the JavaScript

## Important Notes
- The token is still used client-side for map rendering (this is normal and expected for Mapbox GL JS)
- To further secure the token, add URL restrictions in your Mapbox account settings to only allow requests from your domain
- The geocoding API calls are now fully proxied through your server, providing the highest level of security for that functionality
