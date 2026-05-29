# 旅行記賬 (Travel Expense Tracker)

**Version:** 3.6.0

A mobile-first travel expense tracker with an editorial travel-journal aesthetic. Single-file HTML + Firebase Realtime Database. No build step, no npm, no localStorage.

Track shared trip expenses across multiple currencies, see real-time balances, manage a shared itinerary, and collect places you want to visit.

## Features

- **Three views** — 記賬 (ledger), 行程 (itinerary), Marked (wishlist)
- **Multiple payers and participants per record** — split bills by exact amount, not just equally
- **Manual amounts with auto-redistribute** — lock any row, the rest divides the remainder evenly; unlock with one tap
- **Multi-currency support** — JPY, HKD, TWD, KRW per record
- **Live currency conversion** — pick a display currency in settings, all balances and totals convert via [exchangerate.fun](https://exchangerate.fun) (no API key)
- **Settlement suggestions** — greedy min-transactions algorithm shows who owes whom, per currency or merged
- **Records grouped by date** — daily subtotals + grand total at the top
- **行程 (Itinerary) view** — share a trip schedule alongside the ledger: each stop is either a 單點 (single location with start/end times) or a 路線 (route between two locations); grouped by date or sorted by creation; single stops with both times use a stacked layout that avoids duplicating the location name
- **Marked (Wishlist) view** — collect places you want to visit: each wish has a title, multiple locations (with optional map links and per-location notes), and a category note
- **Edit & delete toggle** — `✎` buttons in Marked and 行程 headers show/hide per-item edit/delete controls
- **Inline edit & delete** — records, schedule items, and wishes can be edited or removed
- **Per-location 備註** — each location in a Marked entry can have its own note, displayed inline
- **Real-time sync** — all members see the same data via Firebase RTDB; share by URL hash
- **Inline group rename** — tap the title to edit
- **No storage permissions needed** — state lives in memory + URL hash + Firebase only

## Files

- [`travel-tracker.html`](travel-tracker.html) — the entire app (HTML + CSS + JS)
- [`vercel.json`](vercel.json) — clean URL config so `/` serves the app

## Run Locally

The app loads Firebase SDK and fonts from CDNs, so it must be served over HTTP (not `file://`).

### Option 1: Dev server (recommended)

API keys are kept in `.env` and injected at serve time — never hardcoded in HTML.

```bash
cd /path/to/Travel
node server.js
```

Open http://localhost:3000

### Option 2: Python

```bash
cd /path/to/Travel
python -m http.server 3000
```

Open http://localhost:3000

### Option 3: Node.js (npx serve)

```bash
cd /path/to/Travel
npx serve .
```

Open the URL printed in the terminal.

### Option 4: VS Code Live Server

Install the **Live Server** extension by Ritwick Dey, then right-click `travel-tracker.html` → **Open with Live Server**.

### Option 5: PHP

```bash
cd /path/to/Travel
php -S localhost:8000
```

## Sharing a Trip

The trip ID lives in the URL hash, e.g. `http://localhost:8000/#abc12345`. Share the full URL — anyone with the link sees the same trip in real time.

A new random trip ID is generated automatically on first load if none is in the URL. Use the 📋 button in the settings sheet to copy the share link.

## Deploy to Vercel

This is a static site. From the project directory:

```bash
npx vercel
```


> ⚠️ Open rules are fine for a private trip among friends but expose all data publicly. Tighten before serious use.

## Data Model

```
trips/{tripId}/
  meta/
    name: string
    currency: string  (default "JPY")
    members/
      {memberId}/
        name: string
  records/
    {recordId}/
      type: "支出" | "預付" | "轉賬"
      amount: number
      currency: string
      note: string
      date: string  (YYYY-MM-DD)
      category: string  (支出 only)
      payers: { memberId: amount }    (支出)
      shares: { memberId: amount }    (支出)
      payer: memberId                 (轉賬: sender)
      receiver: memberId              (轉賬: receiver)
      createdAt: timestamp
      updatedAt: timestamp  (only on edit)
  schedule/
    {scheduleId}/
      mode: string           ('single' | 'range')
      date: string           (YYYY-MM-DD)
      time: string           (HH:MM, start time)
      endTime: string        (HH:MM, end time)
      location: string       (start location)
      endLocation: string    (end location, range only)
      mapUrl: string         (start map URL)
      endMapUrl: string      (end map URL)
      note: string
      createdAt: timestamp
      updatedAt: timestamp   (only on edit)
   wishlist/
     {wishId}/
       title: string
       locations: [{ name: string, mapUrl: string, note: string }]
       note: string      (optional)
      createdAt: timestamp
      updatedAt: timestamp  (only on edit)
```

Legacy records with `payer`/`participants` (single payer + equal split) still display correctly and auto-migrate to `payers`/`shares` when edited.

## Settlement Algorithm

The 結算建議 section uses a greedy min-transactions algorithm:

1. Compute each member's net balance (positive = owed money, negative = owes money).
2. Sort positives and negatives by absolute amount, descending.
3. Repeatedly match the largest debtor with the largest creditor; record one transaction; subtract the smaller of the two; advance whichever side hit zero.

Result: typically `n - 1` or fewer transactions to settle a group of `n` people, instead of one transaction per expense record.

When **顯示貨幣 = 原始貨幣（不轉換）**, each currency is settled independently. When a display currency is set, all balances are converted first via live rates, then settled together.

## Tech Stack

- Single HTML file — vanilla JS, CSS variables, no build tools
- Firebase Realtime Database SDK v10 (compat build) via CDN
- Lucide icons via CDN
- Noto Serif TC + LXGW WenKai Mono TC + DM Sans via Google Fonts
- exchangerate.fun for currency rates (no API key)
- `.opencode/skills/frontend-design/SKILL.md` — design skill for future UI work

