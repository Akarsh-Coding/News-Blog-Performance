# Manual verification (ticket Step 2: the iterative loop)

Automated tests run in jsdom, which has **no real layout, no real keyboard focus
rendering, no network throttling and no Lighthouse**. These six checks are the first
time the app is judged in a real browser. Do NOT fix problems by hand: use the
recovery protocol at the bottom.

## Setup

```powershell
npm install
npm run dev          # http://localhost:5173
```

- By default every page load shows "Loading articles…" for **2–3 s** (simulated slow
  network). That is intentional.
- Optional: `$env:VITE_SIMULATE_BACKEND='false'` before `npm run dev` skips that wait
  (use it for checks e and f). Undo with `Remove-Item Env:VITE_SIMULATE_BACKEND`.
- Open the browser console: you will see `[Analytics] User interacted with Performance
  Optimization` after each completed action. That is expected.
- Use a **tall window or undock DevTools** (see "Likely trouble spots").

## Not bugs (by design)

- "No data found" appears ~**300 ms after you stop typing** (search debounce), not instantly.
- Submitting a story takes 2–3 s and sends nothing to a server (simulated backend).
- Typing `<` or `>` does nothing (the sanitizer removes them).
- Bookmarks are in memory only: a refresh clears them.

---

## a) Search with no results shows "No data found"

| Step | Expected |
| --- | --- |
| Type `zzzz` in **Search articles**, wait half a second | A dashed box: **No data found** + "Try a different search term or choose another category." The page is NOT blank; search and filters stay usable |
| Clear the search | The cards return; the message disappears |
| Pick a category, then search for a word from another category | "No data found" again |

Result: [ ]  pass  [ ]  fail   Evidence: `screenshots/a-no-data.png`

## b) Slow 3G shows the loading indicator

DevTools → **Network** → throttling dropdown → **Slow 3G** (newer Chrome may call it
**Slow 4G** or **3G**: pick the slowest preset that is not Offline) → tick **Disable cache** → reload.

| Step | Expected |
| --- | --- |
| Reload the page | A bordered "**Loading articles…**" box is visible; no cards, no "No data found", no error |
| Wait | The box is replaced by "Showing 240 of 240 articles" and the cards |
| Open `http://localhost:5173/?simulate=error` | After the wait: a red box "We couldn’t load the articles…" with **Retry** |
| Click Retry | Loading box again, then the articles |
| Open `/?simulate=offline` and click Retry | The error comes back every time |

Result: [ ]  pass  [ ]  fail   Evidence: `screenshots/b-loading.png`, `screenshots/b-error.png`

## c) Form: empty and bad email show red highlights

Find **Submit a story** (right column on a wide window, below the list on a narrow one).

| Step | Expected |
| --- | --- |
| Click **Submit story** with everything empty | All three fields get a **red border + pale red background**, each with "⚠ … is required." below it. Focus jumps to **Title** |
| Fill Title `Council vote delayed`, Summary `The council postponed tonight's budget vote.`, Email `abc@` → Submit | Only **Author email** is red: "Enter a valid email address." |
| Try emails `abc@example` and `abc@example.c` | Both rejected. `abc@example.com` is accepted |
| Fix the email while it is red | Its error disappears as you type |
| Submit a valid story | Button disables, "Submitting your story…", then "Thank you! …" and the form empties |
| Open `/?simulate=offline`, submit a valid story | Red box "We couldn’t submit your story…"; what you typed is still there |

Result: [ ]  pass  [ ]  fail   Evidence: `screenshots/c-empty.png`, `screenshots/c-bad-email.png`

## d) Keyboard only (put the mouse away)

| Step | Expected |
| --- | --- |
| Reload, press **Tab** once | A dark "Skip to the Submit a story form" link appears top-left, with a focus ring |
| Press **Enter** on it | Focus lands in the **Title** field |
| Reload and Tab through everything | Order: skip link → Search → Category → Sort → every **Bookmark** button → Title → Author email → Summary → Submit story |
| At every stop | A visible dark focus ring (never invisible) |
| **Enter** or **Space** on a Bookmark | It turns dark with a ✓ and stays focused |
| Category / Sort with ↑ ↓ | The list updates |
| **Shift+Tab** backwards | Reverse order, no keyboard trap anywhere |
| Submit the empty form with Enter | Focus goes to the first invalid field |

Result: [ ]  pass  [ ]  fail   Notes: ________________________

## e) Lighthouse accessibility

Use a production build (Lighthouse should see the loaded page, not "Loading…"):

```powershell
$env:VITE_SIMULATE_BACKEND='false'
npm run build
npm run preview      # http://localhost:4173
```

Chrome **Incognito** (no extensions) → DevTools → **Lighthouse** → Mode **Navigation** →
category **Accessibility** only → run for **Desktop** and **Mobile**.

| Run | Score (target 100) | Failing audits (if any) |
| --- | --- | --- |
| Desktop | ____ | |
| Mobile | ____ | |
| Snapshot in error state (`/?simulate=error`) | ____ | |

Result: [ ]  pass  [ ]  fail   Evidence: `screenshots/e-lighthouse-desktop.png`, `…-mobile.png`

## f) Profiler: cards do not re-render when typing in an unrelated field

Install **React Developer Tools**. Run `npm run dev` (not `preview`; profiling needs the
dev build). DevTools → **Profiler** → gear ⚙ → tick **Record why each component rendered
while profiling**.

| Step | Expected |
| --- | --- |
| Record → click the **Title** field → type `abcd` → Stop | Flamegraph: only **StoryForm** (and its fields) are coloured. **App, ArticleControls and all ArticleCard bars are gray** ("Did not render") |
| Record → click **one** Bookmark → Stop | Only **App** and that **one ArticleCard** are coloured |
| Record → type `tech` in Search, pause, Stop | Cards stay gray while typing; one commit when the debounce fires |
| Optional: `git switch --detach HEAD~1` (before the performance commit) and repeat | All ~240 cards coloured on a bookmark click ("The parent component rendered") |

Result: [ ]  pass  [ ]  fail   Evidence: `screenshots/f-profiler-typing.png`, `…-bookmark.png`

---

## Likely trouble spots (the automated tests cannot see these)

1. **Layout/CSS** has never been rendered in a real browser by the AI. Look for overlap,
   a cut-off form, odd grid columns or a skip link that stays visible.
2. **Short windows:** the form is `position: sticky` on wide screens. If the window is
   shorter than the form (easy with DevTools docked at the bottom), the **Submit** button
   may be unreachable. Report it with the screen height; do not work around it.
3. **Lighthouse** may flag something jsdom/axe cannot (real color rendering, target size).

## If the AI breaks something: the recovery protocol

1. Do **not** edit the code yourself.
2. Copy the **exact** error (browser console or terminal), plus which check (a–f) failed.
3. Send, word for word:

> That approach caused an error: `[paste exact error]`. Let's revert and try a different method.

4. Download the new zip, `npm install` (if dependencies changed), `npm test`, then repeat
   the failed check.
5. Log it in `PROMPTS.md` (the log of recoveries is graded). Copy this entry:

```md
### Prompt #N — Recovery: <short title>

**Phase:** Iterative fix

**Trigger:** Manual check <a–f>: <what you saw>

**Exact error:**
```
<paste verbatim>
```

**Prompt:**
> That approach caused an error: <paste exact error>. Let's revert and try a different method.

**What the AI did:**
<what it reverted, and the different approach it took>

**Outcome:** ✅ Fixed / ⚠️ Partly / ❌ Failed again (next prompt: #N+1)
```

Tip: commit after every green step (`git add . && git commit`) so there is always a clean
point to compare against or return to.
