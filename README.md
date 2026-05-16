# 旅行記賬 (Travel Expense Tracker)

A mobile-first travel expense tracker. Single-file HTML + Firebase Realtime Database. No build step, no npm, no localStorage.

Track shared trip expenses across multiple currencies, see real-time balances, and get a minimum-transaction settlement plan.

## Features

- **Multiple payers and participants per record** — split bills by exact amount, not just equally
- **Manual amounts with auto-redistribute** — lock any row, the rest divides the remainder evenly; unlock with one tap
- **Multi-currency support** — JPY, HKD, TWD, KRW per record
- **Live currency conversion** — pick a display currency in settings, all balances and totals convert via [exchangerate.fun](https://exchangerate.fun) (no API key)
- **Settlement suggestions** — greedy min-transactions algorithm shows who owes whom, per currency or merged
- **Records grouped by date** — daily subtotals + grand total at the top
- **Edit & delete** records inline
- **Real-time sync** — all members see the same data via Firebase RTDB; share by URL hash
- **Inline group rename** — tap the title to edit
- **No storage permissions needed** — state lives in memory + URL hash + Firebase only

## Files

- [`travel-tracker.html`](travel-tracker.html) — the entire app (HTML + CSS + JS)
- [`vercel.json`](vercel.json) — clean URL config so `/` serves the app

## Run Locally

The app loads Firebase SDK and fonts from CDNs, so it must be served over HTTP (not `file://`).

### Option 1: Python

```bash
cd /path/to/Travel
python -m http.server 8000
```

Open http://localhost:8000

### Option 2: Node.js

```bash
cd /path/to/Travel
npx serve .
```

Open the URL printed in the terminal.

### Option 3: VS Code Live Server

Install the **Live Server** extension by Ritwick Dey, then right-click `travel-tracker.html` → **Open with Live Server**.

### Option 4: PHP

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

`vercel.json` rewrites `/` to `travel-tracker.html` so users don't need to type the filename.

## Firebase Setup

The app connects to a Realtime Database at:

```
https://travel-2cd12-default-rtdb.asia-southeast1.firebasedatabase.app/
```

Set permissive rules in the Firebase console (Realtime Database → Rules):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
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
      type: "支出" | "轉賬"
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
- Inter font via Google Fonts
- exchangerate.fun for currency rates (no API key)
