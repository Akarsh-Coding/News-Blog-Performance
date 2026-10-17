# News Explorer

An accessible, high-performance React app for browsing 240 news articles: search, filter by category, sort, bookmark, and submit your own story. Built test-first around rendering performance, resilience on slow or failing networks, and accessibility.

**Live demo:** _add your Vercel URL here_ &nbsp;·&nbsp; **Ticket:** ENG-84718

## Features

- **Find articles fast:** case-insensitive search (title and summary), category filter, and sorting by newest, oldest or title. Bookmark any article.
- **Resilient by design:** a loading indicator on slow connections, a friendly "No data found" state, and an error message with a **Retry** button when a request fails.
- **Submit a story:** a form with custom regex validation, red inline errors, and no double submissions.
- **Accessible:** keyboard-operable, visible focus, screen-reader live regions, and WCAG AA contrast.
- **Safe:** all text input is sanitized before it is stored; no secrets or personal data are shipped.

## Tech stack

React 19 · Vite 8 · Vitest 5 · React Testing Library · jest-axe · ESLint 9 · plain CSS with design tokens

## Getting started

Requires **Node 22.22.2 or newer** (needed by the test toolchain).

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the full test suite once |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint, failing on any warning |
| `npm run generate:articles` | Regenerate the 240 mock articles (`public/articles.json`) |

## Configuration

By default, requests behave like a slow connection: articles take **2–3 seconds** to load behind a "Loading articles…" indicator. Failures can be triggered from the URL:

| URL | Behaviour |
| --- | --- |
| `/?simulate=error` | The first article load fails; **Retry** then succeeds |
| `/?simulate=offline` | Every request fails (articles and story submission) |

| Variable | Default | Effect |
| --- | --- | --- |
| `VITE_SIMULATE_BACKEND` | `true` | `false` removes the simulated delay and failures (the test run uses this) |
| `VITE_SEARCH_DEBOUNCE_MS` | `300` | Search debounce; `0` disables it |

`VITE_*` variables are bundled into the client and are therefore public. Never put secrets in them (see `.env.example`).

## Engineering highlights

**Performance.** `useMemo` for the filtered list, `useCallback` for every handler passed to a child, and `React.memo` on `ArticleCard`, `ArticleControls` and `StoryForm`. Search is debounced; the input still echoes every keystroke instantly. Measured on the 240-article dataset (React render counts per action):

| Action | Card renders | Filter runs |
| --- | --- | --- |
| Toggle one bookmark | 240 → **1** | 1 → **0** |
| Change sort order | 240 → **0** | 1 → 1 |
| Type "tech" in search (4 keystrokes) | 422 → **0** | 4 → **1** (with debounce) |

To reproduce, record a React DevTools Profiler session with "Record why each component rendered" enabled and click one bookmark: only that card renders.

**Accessibility.** Controls sit in a labelled search landmark; a skip link jumps past the 240 bookmark buttons to the form; loading, result counts, "No data found" and form progress are announced through persistent `aria-live` regions; focus outlines are never removed; touch targets are 48 px. Colour contrast is computed from the design tokens in a test (text ≥ 4.5:1, borders and focus ring ≥ 3:1), and every page state is scanned with axe-core.

**Security.** `sanitizeText` removes markup and script payloads (including nested, obfuscated ones) before any text reaches state. ESLint forbids `dangerouslySetInnerHTML`, `innerHTML` and `eval`. A repository scan test checks for API keys, tokens and personal data.

**Telemetry.** `[Analytics] User interacted with Performance Optimization` is logged when a primary action completes (search applied, filter or sort changed, bookmark toggled, story submitted). It carries no payload, so it cannot leak personal data.

## Testing

`npm test` runs **276 tests in 20 files**, written before the implementation:

- **Acceptance:** happy path, empty state, bad connectivity, invalid input.
- **Non-functional:** accessibility (axe-core and keyboard), telemetry, security, render performance.
- **Unit:** filtering and sorting, validation rules, the sanitizer, network timing (fake timers), the debounce hook.
- **Guards:** design tokens (no hardcoded colours, spacing and type from the scale), WCAG contrast, dataset size, and no secrets or PII in the repo.

## Project structure

```
public/articles.json        240 generated mock articles
scripts/                    article generator
src/
  api/newsApi.js            simulated network layer (latency, failures)
  components/               ArticleCard, ArticleControls, StoryForm
  hooks/                    useDebouncedValue
  styles/tokens.css         design tokens (the only file with raw colours)
  utils/                    filtering, validation, sanitizer, analytics
  __tests__/                test suites
  test/                     test helpers and the written test contract
```


## Known limitations

- There is no backend: the simulated server accepts submitted stories but does not store them, and bookmarks live in memory only (a refresh clears them).
- The sanitizer removes `<` and `>` characters, even in ordinary prose. It is defense in depth, not a replacement for server-side validation.
- The Lighthouse score has not been recorded here; see `VERIFICATION.md`.

## Development log

`PROMPTS.md` records the sequence of prompts, the test-first (red → green → optimize) progression, and the iterations along the way.
