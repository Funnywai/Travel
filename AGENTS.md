# AGENTS.md

## Architecture

- **Single-file app**: ALL code lives in `travel-tracker.html` — HTML, CSS, and JS in one file (~2800 lines). No `src/`, no modules, no build step.
- **Vanilla JS**: No framework. No npm. No tests. No linting.
- **Firebase Realtime Database** (compat SDK v10) via CDN. The modular SDK won't work here.
- **Firebase config is hardcoded inline** in the HTML (`firebaseConfig` object). The database URL is `https://travel-2cd12-default-rtdb.asia-southeast1.firebasedatabase.app/`.
- **Trip ID = URL hash**: `location.hash` is the trip ID (e.g., `#abc12345`). Removing/changing the hash creates a new trip. Don't touch it lightly.
- Tracked files: `travel-tracker.html`, `vercel.json`, `README.md`.

## Local dev

Must be served over HTTP (Firebase SDK + fonts from CDN, won't load on `file://`):

```bash
npx serve .          # or: python -m http.server 3000
```

## Code conventions

- **`$` = `document.querySelector`**, **`$$` = `Array.from(document.querySelectorAll(...))`** — defined in the IIFE.
- State lives in a global `state` object (no modules). Firestore listeners update it, then `renderAll()` re-renders.
- Helper functions: `escapeHtml()`, `memberName(id)`, `memberList()`, `round2(n)`, `todayStr()`, `randomId(n)`.
- Currency conversion uses `exchangerate.fun` (no API key). Rates cached in `state.rates`. Per-currency balances are preserved until a display currency is selected.
- CSS uses custom properties defined in `:root` (line 12) — prefer these over hardcoded colors.
