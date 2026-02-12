# Render.com Deployment Guide

## Quick Setup

### 1. Build Command
```
npm install && npm run build
```

### 2. Start Command
```
node build
```

### 3. Environment Variables
Add these in your Render.com dashboard under "Environment":

```
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

**Important:** Use your actual API keys from `.env.local` file (not these placeholders)

### 4. Service Type
Select: **Web Service**

### 5. Region
Choose your preferred region (e.g., Oregon, Ohio, etc.)

## Verification

✅ **Client-side files (build/client/):** 0 API keys found
✅ **Server-side files (build/server/):** Keys are properly secured

Your API keys are now:
- Stored only on the server
- Never sent to browsers
- Accessed through secure API endpoints

## Important Notes

- The `.env.local` file is NOT committed to GitHub (it's in `.gitignore`)
- API keys must be set in Render.com's environment variables dashboard
- The Node.js adapter enables server-side API endpoints to work
- All API calls go through your server, keeping keys hidden from users
