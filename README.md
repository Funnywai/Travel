# 旅行記賬 (Travel Expense Tracker)

A mobile-first travel expense tracker web app. Single-file HTML + Firebase Realtime Database.

## Files

- `travel-tracker.html` — the entire app (HTML + CSS + JS in one file)

## Run Locally

Because the app loads the Firebase SDK from a CDN, serve it over HTTP (not `file://`). Pick any one of the methods below.

### Option 1: Python (no install needed on most systems)

```bash
cd /path/to/Travel
python -m http.server 8000
```

Then open: http://localhost:8000/travel-tracker.html

### Option 2: Node.js (npx)

```bash
cd /path/to/Travel
npx serve .
```

Then open the URL printed in the terminal (usually http://localhost:3000) and click `travel-tracker.html`.

### Option 3: VS Code Live Server

1. Install the **Live Server** extension by Ritwick Dey.
2. Right-click `travel-tracker.html` → **Open with Live Server**.

### Option 4: PHP

```bash
cd /path/to/Travel
php -S localhost:8000
```

Then open: http://localhost:8000/travel-tracker.html

## Sharing a Trip

The URL hash is the trip ID, e.g. `http://localhost:8000/travel-tracker.html#abc12345`. Share the full URL (including `#...`) with travel companions — anyone with the link sees the same data in real time.

## Deploy to Vercel

This is a static site. From the project directory:

```bash
npx vercel
```

Or drag-and-drop the folder into the Vercel dashboard. No build configuration is needed.

## Firebase Setup

The app connects to a Realtime Database at:

```
https://travel-2cd12-default-rtdb.asia-southeast1.firebasedatabase.app/
```

Make sure the database rules allow reads/writes under `trips/`. For a simple shared setup:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> ⚠️ Open rules are fine for a private shared trip among friends but expose all data publicly. Tighten before serious use.
