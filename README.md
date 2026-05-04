# Anandam Residency

React website for Anandam Residency Hotel & Banquet with room booking, banquet enquiries, live room availability, gallery, Google Maps, Supabase persistence, and Gmail SMTP confirmations.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

The API runs at `http://localhost:8787` and Vite proxies `/api/*` to it.

## Supabase Setup

Run [supabase/schema.sql](./supabase/schema.sql) once in the Supabase SQL editor. It creates:

- `rooms`: 28 default rooms
- `room_bookings`: room booking requests with `pending`, `confirmed`, `cancelled`, `completed`
- `banquet_bookings`: banquet, terrace, catering, and function requests
- `enquiries`: general enquiry form submissions

The server uses `SUPABASE_SECRET_KEY`, so keep it server-side only. The React browser app never receives this key.

## Environment

Use `.env.example` as the reference. Your existing `.env` already has the required keys. Optional location overrides:

```bash
HOTEL_LAT=28.6084
HOTEL_LNG=77.4452
```

`SUPABASE_URL` can be either `https://project.supabase.co` or `https://project.supabase.co/rest/v1/`; the server normalizes it.

The map uses the configured latitude and longitude with a standard Google Maps embed URL, so the public site does not need to expose `GOOGLE_MAPS_API_KEY` or require the Maps Embed API. Keep the key in `.env` if you later add Places, reviews, or advanced map features.

## Email

Room and banquet booking requests send a confirmation to the guest and BCC the configured Gmail account. General enquiries send a notification to the configured Gmail account.
