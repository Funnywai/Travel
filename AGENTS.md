# AGENTS.md

## Architecture

- **Single-file app**: ALL code lives in `travel-tracker.html` — HTML, CSS, and JS in one file (~2800 lines). No `src/`, no modules, no build step.
- **Vanilla JS**: No framework. No npm. No tests. No linting.
- **Firebase Realtime Database** (compat SDK v10) via CDN. The modular SDK won't work here.
- **Firebase config is hardcoded inline** in the HTML (`firebaseConfig` object). The database URL is `https://travel-2cd12-default-rtdb.asia-southeast1.firebasedatabase.app/`.
- **Trip ID = URL hash**: `location.hash` is the trip ID (e.g., `#abc12345`). Removing/changing the hash creates a new trip. Don't touch it lightly.
- Tracked files: `travel-tracker.html`, `vercel.json`, `README.md`, `.opencode/skills/frontend-design/SKILL.md`.

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

## UI design skill

For UI work, load the bundled skill: `.opencode/skills/frontend-design/SKILL.md`. The app follows an editorial/travel-journal aesthetic with serif fonts (Noto Serif TC) and warm amber accents (`--accent: #c8842e`).


## Operating rules

These apply to every task unless explicitly overridden. Bias: caution over speed on non-trivial work. Use judgment on trivial tasks.

1. **Think Before Coding** — State assumptions explicitly. If uncertain, ask rather than guess. Present multiple interpretations when ambiguity exists. Push back when a simpler approach exists. Stop when confused — name what's unclear.

2. **Simplicity First** — Minimum code that solves the problem. Nothing speculative. No features beyond what was asked. No abstractions for single-use code. Test: would a senior engineer say this is overcomplicated? If yes, simplify.

3. **Surgical Changes** — Touch only what you must. Clean up only your own mess. Don't "improve" adjacent code, comments, or formatting. Don't refactor what isn't broken. Match existing style.

4. **Goal-Driven Execution** — Define success criteria. Loop until verified. Don't follow steps — define success and iterate.

5. **Use the model only for judgment calls** — Use the model for: classification, drafting, summarization, extraction. Don't use it for: routing, retries, deterministic transforms. If code can answer, code answers.

6. **Token budgets are not advisory** — Per-task: 4,000 tokens. Per-session: 30,000 tokens. If approaching budget, summarize and start fresh. Surface the breach — don't silently overrun.

7. **Surface conflicts, don't average them** — If two patterns contradict, pick one (more recent / more tested). Explain why. Flag the other for cleanup. Don't blend conflicting patterns.

8. **Read before you write** — Before adding code, read exports, immediate callers, shared utilities. "Looks orthogonal" is dangerous. If unsure why code is structured a certain way, ask.

9. **Tests verify intent, not just behavior** — Tests must encode WHY behavior matters, not just WHAT it does. A test that can't fail when business logic changes is wrong.

10. **Checkpoint after every significant step** — Summarize what was done, what's verified, what's left. Don't continue from a state you can't describe back. If you lose track, stop and restate.

11. **Match the codebase's conventions, even if you disagree** — Conformance > taste inside the codebase. If you genuinely think a convention is harmful, surface it. Don't fork silently.

12. **Fail loud** — "Completed" is wrong if anything was skipped silently. "Tests pass" is wrong if any were skipped. Default to surfacing uncertainty, not hiding it.
