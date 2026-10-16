# Test contract (what the tests assume the implementation exposes)

The tests were written first, so they pin down these seams. Paste this section
into the Green-phase prompts. Change a test only if the *spec* is wrong, never to
make an implementation pass.

_Revision 4: "Submit a Story" form (Prompt 4); debounced search + memoization (Prompt 5); accessibility, telemetry and sanitization (Prompt 6). Nothing is pending._

## Modules
| Path | Export | Notes |
| --- | --- | --- |
| `src/App.jsx` | default `App` | Root component. Tests render `<App />` with no props. |
| `src/components/ArticleCard.jsx` | default `ArticleCard` | `React.memo(...)`. Props: `article`, `isBookmarked`, `onToggleBookmark(id)`. Renders its own `<li>` containing an `<h2>` title, summary, category, and the bookmark button. |
| `src/utils/filterArticles.js` | named `filterAndSortArticles(articles, { query, category, sortBy })` | Pure, non-mutating. Defaults: `query=''`, `category='all'`, `sortBy='newest'`. `query` is trimmed and matched case-insensitively against title **or** summary. `sortBy`: `newest` \| `oldest` \| `title` (A–Z). |
| `src/utils/validateStory.js` | `validateField(name, value)`, `validateStory(values)` | Regex rules, see "Story form". |
| `src/components/ArticleControls.jsx`, `src/components/StoryForm.jsx` | default exports | Both `React.memo`; controls receive stable `useCallback` handlers and a `useMemo`'d `categories` array. |
| `src/utils/sanitizeText.js` | named `sanitizeText(input)` | Removes markup/script payloads; see "Sanitization". |
| `src/utils/analytics.js` | named `trackInteraction()` | Logs the fixed analytics line, no payload. |
| `src/hooks/useDebouncedValue.js` | named `useDebouncedValue(value, delayMs)` | Delay 0 = pass-through. |
| `src/api/newsApi.js` | `loadArticles({ attempt, simulate, failureMode })`, `submitStory(story, { simulate, failureMode })` | Simulated 2–3 s latency when `simulate` is on (default unless `VITE_SIMULATE_BACKEND=false`; the test run sets it to `false`). |

## Network (tests stub global `fetch` only)
- On mount (and on every Retry): `fetch(<any url>)` (GET) → `Response`-like with `ok` and `json()` → array of `{ id, title, summary, category, publishedAt }`. A rejected fetch **or** `ok: false` is a failure.
- Story submit: `fetch(<any url>, { method: 'POST', body: JSON.stringify({ title, email, summary }) })`; `ok: false` or a rejection is a failure.
- Simulation switches (only when simulation is on): `?simulate=error` (first article load fails, Retry works), `?simulate=offline` (every request fails).

## UI (queried by role + accessible name)
- One `<h1>`.
- `searchbox` named "Search articles"; `combobox` named "Category" (option values: `all` + categories from the data); `combobox` named "Sort by" (values: `newest`, `oldest`, `title`).
- `region` named "Articles" containing a `<ul>` of cards. Category and sort update **synchronously**. Search: the input echoes instantly; the list follows after the debounce (`VITE_SEARCH_DEBOUNCE_MS`, default 300 ms). The test run sets it to `0` so those assertions stay synchronous; `10-search-debounce.test.jsx` turns the real 300 ms on.
- Bookmark: `button` named exactly `Bookmark <title>` with `aria-pressed="true|false"` (name never changes; state is in `aria-pressed`).
- **Empty result** (loaded, zero matches, or API returned `[]`): text matching /no data found/i inside a `role="status"`; search/filters stay on screen.
- **Loading** (initial fetch, Retry, and story POST): `role="status"` whose text matches /loading|submitting|sending|saving/i. While loading: no "No data found", no error, no articles.
- **Load failure**: `role="alert"` mentioning "load the articles" plus a button named /retry/. Never shown as "No data found". Retry shows the loading indicator again.
- **Story form**: `form` named "Submit a story" with textboxes labelled "Title", "Author email", "Summary" and a button "Submit story".
  - Rules (use `noValidate`; custom regex): title 5–100 chars; email matches an address pattern; summary 20–500 chars. All trimmed; blank ⇒ "… is required".
  - Invalid field ⇒ `aria-invalid="true"`, an error class (`/error|invalid/i` in `className`), `aria-describedby` → inline message containing "required" / "5 to 100 characters" / "valid email" / "20 to 500 characters". Focus moves to the first invalid field.
  - No errors before the first submit attempt. A field's error clears as soon as it becomes valid. Blocked submit ⇒ no POST, no analytics log.
  - While POST is pending: loading indicator, submit `disabled`, no duplicate POSTs. Success: text matching /thank/i and the form empties. Failure: `role="alert"` mentioning "submit your story", typed values kept, button re-enabled.
- Sanitization: every text input (search, title, email, summary) runs through `sanitizeText` **before** `setState`: script/style/iframe blocks are removed with their content, other tags are removed, `javascript:`/`vbscript:` schemes removed, control characters removed, and no `<` or `>` survives. Ordinary text, Unicode, newlines and `&` are untouched. The function is idempotent.
- Telemetry: `console.log('[Analytics] User interacted with Performance Optimization')` (single argument, no PII) when an action **completes**: search applied (after the debounce, once per burst), category change, sort change, each bookmark toggle, a *successful* story submit. Never on load, never on blocked or failed submit.
- Accessibility: skip link is the first Tab stop (`href="#story-title"`); controls sit in a `role="search"` landmark named "Search and filter articles"; loading, match count and "No data found" live in ONE persistent `role="status" aria-live="polite"` region inside the Articles region; the story form has its own persistent live region; no `aria-busy` on an ancestor of a live region; Retry is named "Retry loading articles"; focus outlines are never removed; token colors meet WCAG AA (`contrast.test.js`).
- Performance _(implemented)_: cards receive stable props (`useCallback` handler, same article objects) and are `React.memo`'d, so toggling one bookmark re-renders no other card; `filterAndSortArticles` runs inside `useMemo` keyed only on `[articles, query, category, sortBy]`.
