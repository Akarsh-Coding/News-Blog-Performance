# News Blog — Performance Optimization (ENG-84718)

React + Vite. Built with a test-first, AI-assisted workflow; see `PROMPTS.md`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint (fails on any warning) |

## Simulated slow / failing network

By default (`npm run dev`, deployed demo) every request behaves like a slow 3G
connection: articles take **2–3 seconds** to load and a "Loading articles…"
indicator is shown. Trigger failures from the URL:

| URL | Behaviour |
| --- | --- |
| `/?simulate=error` | First article load fails with a **Retry** button; Retry succeeds |
| `/?simulate=offline` | Every request fails (articles and story submission) |

Tests run with `VITE_SIMULATE_BACKEND=false` (set in `vite.config.js`) so they
use plain `fetch` with no delay. Set it to `false` yourself to skip the delay in dev.

## Performance

- `useMemo` for the filtered/sorted list and the category list; `useCallback` for every handler passed to a child; `React.memo` on `ArticleCard`, `ArticleControls` and `StoryForm`.
- Search is debounced (300 ms by default; `VITE_SEARCH_DEBOUNCE_MS=0` disables it). The input itself still updates on every keystroke.
- Measured on the 240-article dataset (React render counts, per user action):

| Action | Card renders before → after | Filter runs before → after |
| --- | --- | --- |
| Toggle one bookmark | 240 → 1 | 1 → 0 |
| Change sort order | 240 → 0 | 1 → 1 |
| Type "tech" in search (4 keystrokes) | 422 → 0 | 4 → 1 (with the 300 ms debounce) |

Reproduce in the browser with the React DevTools Profiler: enable "Record why each
component rendered", record one bookmark click, and compare the flamegraph (gray = did not render).

## Accessibility, telemetry and security

- **Accessibility:** labelled controls in a search landmark, a skip link to the story form, persistent polite live regions for loading / result count / "No data found" / form progress, visible `:focus-visible` outlines, 48px touch targets. Token contrast is checked in `contrast.test.js` (text >= 4.5:1, borders and focus ring >= 3:1) and pages are scanned with axe-core.
- **Telemetry:** `trackInteraction()` logs `[Analytics] User interacted with Performance Optimization` when a primary action completes. It sends no data, so it cannot leak PII.
- **Security:** every text input goes through `sanitizeText` before it is stored. ESLint forbids `dangerouslySetInnerHTML`, `innerHTML` and `eval`. `no-secrets.test.js` scans the repo for API keys, tokens and PII. `VITE_*` variables are public (bundled into the client): never put secrets in them. Real secrets belong on a server, never in this app.

### Running Lighthouse yourself

```powershell
$env:VITE_SIMULATE_BACKEND='false'   # skip the simulated 2-3 s load so Lighthouse sees the loaded page
npm run build
npm run preview
```

Open the printed URL in Chrome, then DevTools -> Lighthouse -> Accessibility -> Analyze.
Also run a *Snapshot* after triggering the error state (`/?simulate=error`) and after a failed form submit.
