# Test contract (what the tests assume the implementation exposes)

The tests were written first, so they pin down these seams. Paste this section
into the Green-phase prompt. Change a test only if the *spec* is wrong, never to
make an implementation pass.

## Modules
| Path | Export | Notes |
| --- | --- | --- |
| `src/App.jsx` | default `App` | Root component. Tests render `<App />` with no props. |
| `src/components/ArticleCard.jsx` | default `ArticleCard` | Must be `React.memo(...)`. Props: `article`, `isBookmarked`, `onToggleBookmark(id)`. Renders its own `<li>` containing an `<h2>` title, summary, category, and the bookmark button. |
| `src/utils/filterArticles.js` | named `filterAndSortArticles(articles, { query, category, sortBy })` | Pure, non-mutating. Defaults: `query=''`, `category='all'`, `sortBy='newest'`. `query` is trimmed and matched case-insensitively against title **or** summary. `sortBy`: `newest` \| `oldest` \| `title` (A–Z). |

## Network (tests stub global `fetch` only)
- On mount: `fetch(<any url>)` (GET) → `Response`-like with `ok` and `json()` → array of `{ id, title, summary, category, publishedAt }`.
- Tip submit: `fetch(<any url>, { method: 'POST', body: JSON.stringify({ name, email, tip }) })`.

## UI (queried by role + accessible name)
- One `<h1>`.
- `searchbox` named "Search articles"; `combobox` named "Category" (option values: `all`, `Politics`, `Sports`, `Tech`); `combobox` named "Sort by" (values: `newest`, `oldest`, `title`).
- `region` named "Articles" containing a `<ul>` of cards. Filtering/sorting/search update **synchronously** (no debounce).
- Bookmark: `button` named exactly `Bookmark <title>` with `aria-pressed="true|false"` (name never changes; state is in `aria-pressed`).
- Empty result: text matching /no data found/i, search/filters stay on screen.
- Loading (initial fetch **and** tip POST): an element with `role="status"` whose text matches /loading|submitting|sending|saving/i. No "No data found" while loading.
- Tip form: `form` named "Submit a tip" with textboxes labelled "Name", "Email", "Tip" and a button "Submit tip".
  - Validation on submit (use `noValidate`): name required (non-whitespace); email required + valid format; tip required + ≥ 10 characters.
  - Invalid field ⇒ `aria-invalid="true"`, an error class (`/error|invalid/i` in `className`), and `aria-describedby` → message containing "required" / "valid email" / "10 characters".
  - No errors shown before the first submit attempt. Blocked submit ⇒ no POST, no analytics log.
  - While POST is pending: loading indicator, submit `disabled`, no duplicate POSTs. On success: text matching /thank/i.
- Sanitization: every text input (search, name, email, tip) strips/escapes `<` and `>` **before** setting state; ordinary text is untouched.
- Telemetry: `console.log('[Analytics] User interacted with Performance Optimization')` after search, category change, sort change, each bookmark toggle, and a *successful* tip submit. Never on load; never on blocked submit.
- Performance: cards receive stable props (`useCallback` handler), so typing in the tip form or toggling one bookmark re-renders no other card; `filterAndSortArticles` runs inside `useMemo` keyed only on `[articles, query, category, sortBy]`.
