# Travel Tracker — Project Reference

**Version:** 3.8.0 | **File:** `travel-tracker.html` (~3750 lines) | **Stack:** Vanilla JS + Firebase RTDB

A mobile-first travel expense tracker with an editorial travel-journal aesthetic. Single-file HTML + Firebase Realtime Database. No build step, no npm, no localStorage.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│              travel-tracker.html                  │
│  ┌───────────┐  ┌──────────┐  ┌───────────────┐  │
│  │   HTML     │  │   CSS    │  │  JavaScript    │  │
│  │  (~30行)   │  │ (~1380行)│  │  (~2170行)    │  │
│  └───────────┘  └──────────┘  └───────┬───────┘  │
└──────────────────────────────────────────┼────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
          ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐
          │  Firebase RTDB   │   │  exchangerate.fun │   │ Google Maps API  │
          │  (real-time sync)│   │  (live currency)  │   │ (map + geocode)  │
          └─────────────────┘   └──────────────────┘   └──────────────────┘
```

**Key design decisions:**
- **Single file** — zero dependencies, instant context for LLM editing, deploy as static asset
- **Firebase compat SDK v10** (CDN) — modular SDK won't work without a bundler; compat works directly in the browser
- **URL hash as trip ID** — `location.hash` determines which trip you're viewing; sharing the full URL grants real-time access
- **No localStorage** — all state is either in memory or written to Firebase; no persistence to manage

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Runtime** | Vanilla JS | No framework overhead; single file stays self-contained |
| **Database** | Firebase Realtime Database v10 (compat) | Real-time sync, CDN-loadable, no server needed |
| **Maps** | Google Maps JavaScript API | Standard for travel-related features |
| **Geocoding** | Google Geocoding API | Resolves location names to lat/lng for map markers |
| **Icons** | Lucide via CDN | Lightweight, consistent icon set |
| **Fonts** | Noto Serif TC, DM Sans, LXGW WenKai Mono TC | Editorial journal feel + Chinese readability |
| **Currency** | exchangerate.fun (free, no API key) | Live rates without registration |
| **Hosting** | Vercel (static) | Zero-config deployment via `vercel.json` |

---

## Project Structure

```
Travel/
├── travel-tracker.html     ← THE app (HTML + CSS + JS, ~3750 lines)
├── server.js               Dev server — injects API keys from .env
├── build.js                Build script — replaces API key placeholders for Vercel
├── vercel.json             Clean URL rewrites for SPA-like routing
├── .env                    Local API keys (git-ignored, never committed)
├── .env.example            Template for .env
├── package.json            Minimal scripts: `npm run dev` / `npm run build`
├── AGENTS.md               LLM context for AI-assisted editing
├── README.md               User-facing docs
└── PROJECT-REFERENCE.md    ← This file: reviewer-facing reference
```

---

## Data Model (Firebase)

All data lives under `trips/{tripId}/`. Access is open — any client with the URL hash can read/write.

### `/meta`

```javascript
{
  name: "日本東京",                          // string — trip name
  currency: "JPY",                           // string — default currency
  members: {
    "abc123": { name: "Kenny" },             // { memberId: { name } }
    "def456": { name: "Alice" }
  }
}
```

### `/records`

Keyed by `recordId` (generated via `randomId(6)`).

**Current format (payer/participant split):**

```javascript
{
  type: "支出" | "預付" | "轉賬",
  amount: 3500,                              // number
  currency: "JPY",                           // "JPY" | "HKD" | "TWD" | "KRW"
  note: "午餐",
  date: "2026-06-08",                        // YYYY-MM-DD
  category: "Food",                          // only for 支出
  payers: { "abc123": 2000, "def456": 1500 },// memberId → amount paid
  shares: { "abc123": 1167, "def456": 1166, "ghi789": 1167 }, // memberId → amount owed
  createdAt: 1712345678901,
  updatedAt: 1712345678901                   // only present after edit
}
```

**Legacy format (single payer + equal split) — auto-migrated on edit:**

```javascript
{
  payer: "abc123",                           // single payer
  participants: ["abc123", "def456"]         // equal split among these
}
```

### `/schedule`

```javascript
{
  mode: "single" | "range",
  location: "東京鐵塔",                       // start / single point
  endLocation: "淺草",                        // range only
  date: "2026-06-08",
  time: "14:00",
  endTime: "16:30",
  mapUrl: "https://maps.app.goo.gl/...",
  endMapUrl: "https://maps.app.goo.gl/...",
  note: "要預約",
  pinned: false,
  createdAt: 1712345678901,
  updatedAt: 1712345678901
}
```

### `/wishlist`

```javascript
{
  title: "咖啡廳巡禮",
  note: "想去的地方",
  locations: [
    { name: "Blue Bottle 中目黑", mapUrl: "...", note: "在車站附近", hours: "10:00-20:00" }
  ],
  pinned: false,
  createdAt: 1712345678901,
  updatedAt: 1712345678901
}
```

### `/coords`

Geocoding cache — avoids re-querying the Geocoding API for known locations.

```javascript
{
  "東京鐵塔": { key: "東京鐵塔", name: "東京鐵塔", lat: 35.6586, lng: 139.7454 }
  // keyed by location name (normalized)
}
```

---

## State Management

A single global `state` object holds everything. Firebase `on('value')` listeners write into it; then `renderAll()` diffs the DOM.

```javascript
let state = {
  // Firebase data (realtime-synced)
  meta:        null | { name, currency, members },
  records:     {},     // { recordId: Record }
  schedule:    {},     // { scheduleId: ScheduleItem }
  wishlist:    {},     // { wishId: WishItem }
  coords:      {},     // { locationName: { lat, lng } }

  // UI state
  currentView: 'ledger',         // 'ledger' | 'schedule' | 'wishlist' | 'map'
  schedSort:  'date',            // 'date' | 'created'
  showWishActions:  false,
  showSchedActions: false,

  // Currency conversion (lazy-loaded, in-memory only)
  displayCurrency: '',           // '' = raw, or 'HKD' / 'TWD' / 'KRW'
  rates:           {},           // { baseCode: { targetCode: rate } }
  rateLoading:     false,
  rateError:       '',

  // Map internals
  _geocodeCache:   {},
  _mapInstance:    null,
  _dirStart:       null,
  _dirEnd:         null,
  _userMarker:     null,
  // ... more underscored internal state

  // Form state (not persisted)
  form:           { amount, note, currency, payers, shares, ... },
  schedForm:      { editingId, mode, date, time, location, ... },
  wishForm:       { editingId, title, locations, note },
  currentTab:     '支出' | '轉賬'
};
```

**Update flow:**

```
Firebase change → on('value') callback → state.records = val (etc.) → renderRecords() (etc.)
                                                                    → renderAll() (for currency conversion)
```

---

## Code Organization (JS IIFE)

The entire JS lives in a single IIFE at the bottom of `travel-tracker.html` (lines 1576–3748).

| Lines | Section | Key Functions |
|---|---|---|
| 1577–1582 | Firebase init | `firebase.initializeApp`, `db.ref()` |
| 1586–1593 | Trip ID from hash | `randomId(8)`, `tripRef` |
| 1596–1646 | State declaration | `state` object |
| 1648–1721 | Currency conversion | `ensureRatesFor`, `convert`, `fmtSum`, `loadAllRates` |
| 1723–1733 | Main render dispatcher | `renderAll()` |
| 1736–1766 | Helpers | `$`, `$$`, `memberName`, `memberList`, `todayStr`, `showToast` |
| 1768–1822 | Geocoding | `geocodeByName`, `collectMapLocations` |
| 1824–1879 | Balance computation | `computeBalancesByCurrency`, `computeBalances` |
| 1881–2208 | Ledger rendering | `renderBalances`, `renderPersonExpenses`, `renderRecords`, `simplifyDebts`, `renderSettlement` |
| 2210–2232 | Group rename | Inline edit on `.group-name` click |
| 2234–2613 | Record form | `openInput`, `openEdit`, `saveRecord`, `redistribute`, `renderForm` |
| 2615–2917 | Schedule view | `renderSchedule`, `renderSchedForm`, `saveSchedule` |
| 2919–3203 | Map view | `renderMap`, `resolveAndPlace`, `geolocation`, `searchDirections` |
| 3205–3431 | Wishlist view | `renderWishList`, `renderWishForm`, `saveWish` |
| 3433–3467 | View switching | `setView`, tab listeners, map back button |
| 3556–3628 | Settings modal | `renderSettings`, member CRUD, share link copy |
| 3630–3674 | Setup flow | First-time trip creation when `meta` is null |
| 3676–3733 | Firebase listeners | `on('value')` for meta/records/schedule/wishlist/coords |
| 3735–3748 | Bootstrap | `renderIcons()`, overlay close handlers, hashchange |

---

## Key Features

### 1. Ledger (記賬) — Lines 1824–2208 / 2234–2613

- Records grouped by date with daily subtotals and a grand total
- Each record supports multiple payers with different amounts + multiple participants with different shares
- **Auto-redistribute** — edit any amount manually, the rest divides the remainder evenly; unlock with one tap
- **Settlement algorithm** — greedy min-transactions:
  1. Compute net balances (positive = owed, negative = owes)
  2. Match largest debtor with largest creditor iteratively
  3. When `displayCurrency` is set, all currencies are converted first via live rates
- **Person expense summary** — aggregates spending per person across all records

### 2. Itinerary (行程) — Lines 2615–2917

- Two entry modes: `single` (one location with start/end times) and `range` (route between two locations)
- Sortable by date or creation time
- Toggleable edit/delete action buttons
- Stacked layout for stops with both times to avoid duplicating the location name

### 3. Wishlist (Marked) — Lines 3205–3431

- Each wish has a title, optional note, and multiple locations
- Each location can have a name, map link, hours, and per-location note
- Legacy format (single `mapUrl` string per wish) auto-normalized to `locations[]`

### 4. Map View — Lines 2919–3203

- Collects all locations from schedule + wishlist and renders them as markers
- Color-coded markers: orange (schedule), dark (wishlist), red (pinned)
- Geocoding results cached to Firebase `coords` node to avoid repeat API calls
- **Geolocation** — watchPosition with accuracy circle (max 20m radius)
- **Directions** — tap a schedule marker, click "set as start/end", opens Google Maps with transit directions
- Full-screen mode (`body.map-fullscreen`) hides header, view-switcher, and FAB

### 5. Currency Conversion — Lines 1648–1721

- Uses [exchangerate.fun](https://exchangerate.fun) (free, no API key)
- Per-currency balances are preserved until a display currency is selected
- `fmtSum()` converts and sums all currencies when a display currency is set, or shows raw per-currency values
- Failed conversions show `*` suffix on the amount

### 6. Real-time Sync

- Firebase `on('value')` listeners on all 5 child paths (meta, records, schedule, wishlist, coords)
- Any change by any client triggers re-render of the affected section
- No polling, no WebSocket management

### 7. Legacy Record Migration

When opening an old-format record for editing (`payer` + `participants`), it's auto-converted to the new `payers`/`shares` format on save. The `createdAt` timestamp is preserved.

---

## CSS Conventions

### Custom Properties (`:root`, lines 13–31)

```css
--primary, --primary-dark, --primary-light   /* Navy palette */
--accent, --accent-glow                      /* Gold accent */
--bg, --surface, --surface-alt               /* Warm neutral backgrounds */
--text, --text-muted
--border, --error, --success
--shadow, --shadow-lg
--radius: 14px, --radius-sm: 10px
```

All components use these variables exclusively — no hardcoded colors outside `:root`.

### Naming (BEM-lite)

- Block prefix + hyphenated: `.record-row`, `.sched-timeline`, `.wish-locs`, `.ma-check`
- State as independent class: `.active`, `.selected`, `.locked`, `.open`, `.warn`
- Status modifiers: `.status-neutral`, `.status-owe`, `.status-receive`
- Type badges: `.type-badge.t-prepaid`, `.t-transfer`

### Layout

- **Mobile-first**: `#app { max-width: 480px; margin: 0 auto }`, centered on desktop
- **Sticky header**: `.header { position: sticky; top: 0; z-index: 10 }` with backdrop-filter blur
- **FAB**: Fixed position with right-edge alignment via `max()` calculation
- **Sheets/Modals**: Fixed-position overlay + transform animation from bottom

### Animations

- `fadeSlideUp` — staggered entry for card children (nth-child)
- `viewIn` — horizontal slide on view switch
- `slideUp` — modal/sheet from bottom
- `shimmer` — skeleton loading state

---

## Local Development

### Prerequisites

- Node.js (for `server.js` — API key injection)
- `.env` file with API keys (see `.env.example`)

```bash
GOOGLE_MAPS_API_KEY=your_maps_js_api_key_here
GOOGLE_GEOCODE_API_KEY=your_geocoding_api_key_here
```

### Start dev server

```bash
node server.js        # Serves at http://localhost:3000
```

The server reads `.env`, replaces `__GOOGLE_MAPS_API_KEY__` and `__GOOGLE_GEOCODE_API_KEY__` placeholders in the HTML, and serves the result. Without `.env`, maps and geocoding will fail silently.

### Fallback (no API keys)

```bash
npx serve .
```

Works for all features except maps and geocoding.

---

## Deployment (Vercel)

`vercel.json` rewrites all routes to `travel-tracker.html`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/travel-tracker.html" }] }
```

Before deploying, run `npm run build` (`node build.js`) to inject API key placeholders — or set `GOOGLE_MAPS_API_KEY` and `GOOGLE_GEOCODE_API_KEY` as Vercel environment variables.

---

## Security Notes

- **Firebase database is open** — the config has no `apiKey`/`authDomain`; any client can read/write any trip ID
- **Trip privacy is by obscurity** — the 8-character alphanumeric hash in the URL is the only access control
- **No input validation** on Firebase writes (beyond client-side form constraints)
- **Suitable for**: private trips among friends who share a link
- **Not suitable for**: sensitive financial data, public-facing apps, or situations requiring access control

---

## File Index

| File | Purpose |
|---|---|
| `travel-tracker.html` | The entire application — HTML structure, CSS styles, and JavaScript logic in one file |
| `server.js` | Development HTTP server that injects API keys from `.env` into the HTML |
| `build.js` | Build script for Vercel deployment — replaces API key placeholders with env vars |
| `vercel.json` | Vercel configuration — rewrites all routes to the single HTML file |
| `.env` | Local API keys (`GOOGLE_MAPS_API_KEY`, `GOOGLE_GEOCODE_API_KEY`) — git-ignored |
| `.env.example` | Template for `.env` |
| `package.json` | Defines `npm run dev` (→ server.js) and `npm run build` (→ build.js) |
| `AGENTS.md` | Context notes for LLM-assisted development |
| `README.md` | User-facing documentation |
| `PROJECT-REFERENCE.md` | This file — code reviewer reference |
| `build/` | Output directory for Vercel production build |
