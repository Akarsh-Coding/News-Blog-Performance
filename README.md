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
