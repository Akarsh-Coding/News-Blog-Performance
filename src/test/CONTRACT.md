# Test contract (what the tests assume the implementation exposes)

The tests were written first, so they pin down these seams. Paste this section
into the Green-phase prompts. Change a test only if the *spec* is wrong, never to
make an implementation pass.

_Revision 2: the placeholder "Submit a tip" form was replaced by the "Submit a Story" form from the Prompt 4 spec._

## Modules
| Path | Export | Notes |
| --- | --- | --- |
| `src/App.jsx` | default `App` | Root component. Tests render `<App />` with no props. |
| `src/components/ArticleCard.jsx` | default `ArticleCard` | Must be `React.memo(...)`. Props: `article`, `isBookmarked`, `onToggleBookmark(id)`. Renders its own `<li>` containing an `<h2>` title, summary, category, and the bookmark button. |
| `src/utils/filterArticles.js` | named `filterAndSortArticles(articles, { query, category, sortBy })` | Pure, non-mutating. Defaults: `query=''`, `category='all'`, `sortBy='newest'`. `query` is trimmed and matched case-insensitively against title **or** summary. `sortBy`: `newest` \| `oldest` \| `title` (A–Z). |
| `src/utils/validateStory.js` | `validateField(name, value)`, `validateStory(values)` | Regex rules, see "Story form". |
| `src/api/newsApi.js` | `loadArticles({ attempt, simulate, failureMode })`, `submitStory(story, { simulate, failureMode })` | Simulated 2–3 s latency when `simulate` is on (default unless `VITE_SIMULATE_BACKEND=false`; the test run sets it to `false`). |

## Network (tests stub global `fetch` only)
- On mount (and on every Retry): `fetch(<any url>)` (GET) → `Response`-like with `ok` and `json()` → array of `{ id, title, summary, category, publishedAt }`. A rejected fetch **or** `ok: false` is a failure.
- Story submit: `fetch(<any url>, { method: 'POST', body: JSON.stringify({ title, email, summary }) })`; `ok: false` or a rejection is a failure.
- Simulation switches (only when simulation is on): `?simulate=error` (first article load fails, Retry works), `?simulate=offline` (every request fails).

## UI (queried by role + accessible name)
- One `<h1>`.
- `searchbox` named "Search articles"; `combobox` named "Category" (option values: `all` + categories from the data); `combobox` named "Sort by" (values: `newest`, `oldest`, `title`).
- `region` named "Articles" containing a `<ul>` of cards. Filtering/sorting/search update **synchronously** (no debounce).
- Bookmark: `button` named exactly `Bookmark <title>` with `aria-pressed="true|false"` (name never changes; state is in `aria-pressed`).
- **Empty result** (loaded, zero matches, or API returned `[]`): text matching /no data found/i inside a `role="status"`; search/filters stay on screen.
- **Loading** (initial fetch, Retry, and story POST): `role="status"` whose text matches /loading|submitting|sending|saving/i. While loading: no "No data found", no error, no articles.
- **Load failure**: `role="alert"` mentioning "load the articles" plus a button named /retry/. Never shown as "No data found". Retry shows the loading indicator again.
- **Story form**: `form` named "Submit a story" with textboxes labelled "Title", "Author email", "Summary" and a button "Submit story".
  - Rules (use `noValidate`; custom regex): title 5–100 chars; email matches an address pattern; summary 20–500 chars. All trimmed; blank ⇒ "… is required".
  - Invalid field ⇒ `aria-invalid="true"`, an error class (`/error|invalid/i` in `className`), `aria-describedby` → inline message containing "required" / "5 to 100 characters" / "valid email" / "20 to 500 characters". Focus moves to the first invalid field.
  - No errors before the first submit attempt. A field's error clears as soon as it becomes valid. Blocked submit ⇒ no POST, no analytics log.
  - While POST is pending: loading indicator, submit `disabled`, no duplicate POSTs. Success: text matching /thank/i and the form empties. Failure: `role="alert"` mentioning "submit your story", typed values kept, button re-enabled.
- Sanitization: every text input (search, title, email, summary) strips/escapes `<` and `>` **before** setting state; ordinary text is untouched. _(not implemented yet)_
- Telemetry: `console.log('[Analytics] User interacted with Performance Optimization')` after search, category change, sort change, each bookmark toggle, and a *successful* story submit. Never on load; never on blocked submit. _(not implemented yet)_
- Performance: cards receive stable props (`useCallback` handler), so toggling one bookmark re-renders no other card; `filterAndSortArticles` runs inside `useMemo` keyed only on `[articles, query, category, sortBy]`. _(not implemented yet)_
