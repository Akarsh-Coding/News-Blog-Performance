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
