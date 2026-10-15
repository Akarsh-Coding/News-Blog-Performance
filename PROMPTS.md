# PROMPTS.md — Prompt Traceability Log

**Ticket:** ENG-84718 — Performance Optimization for News Blog
**Workflow:** Test-Driven Development via AI ("Vibe Coding")
**AI assistant:** _<fill in>_

This file documents the exact sequence of prompts used to guide the AI to the final
solution. Log every prompt in order, including ones that failed or were reverted.

---

## How to log an entry

Copy the template below, paste it at the bottom, and increment the number.
Record outcomes honestly — reverts are expected and show good iteration.

### Entry template

```md
### Prompt #N — <short title>

**Phase:** <Setup | TDD: write tests | TDD: implement | Iterative fix | Polish>

**Prompt:**
> <paste the exact prompt text>

**What the AI did:**
<files created/changed, approach taken, anything notable>

**Outcome:** <✅ Worked | ⚠️ Partially worked | ❌ Failed — reverted>

**Notes / follow-up:**
<errors pasted back, what was changed in the next prompt, manual verification done>
```

---

## Log

### Prompt #1 — Project setup & PROMPTS.md skeleton

**Phase:** Setup

**Prompt:**
> Set up a new React project using Vite for a "News Blog Performance Optimization" interface (Ticket ENG-84718). Install and configure Vitest with React Testing Library and jsdom, plus ESLint with a config that flags unused imports. Add `npm test` and `npm run lint` scripts. Create an empty `PROMPTS.md` in the repo root with a heading and a template for logging entries (prompt number, prompt text, what the AI did, and whether it worked or needed a revert). Add `.env` to `.gitignore`. Do not write any components or feature code yet.

**What the AI did:**
Scaffolded a Vite + React project. Replaced the template's default oxlint with ESLint 9 (flat config) using `eslint-plugin-unused-imports`, `react`, `react-hooks`, and `jsx-a11y`. Installed Vitest, jsdom, React Testing Library, jest-dom, and user-event, with a setup file. Added `test` and `lint` scripts, ignored `.env` in `.gitignore`, removed the template demo code, and created this file.

**Outcome:** ✅ Worked

**Notes / follow-up:**
Pinned ESLint to v9 because `eslint-plugin-jsx-a11y` does not yet support v10. No components exist yet; `src/main.jsx` mounts an empty root until tests are written.

---

### Prompt #2 — Feed the spec & write the failing tests (TDD: Red)

**Phase:** TDD: write tests

**Prompt:**
> Here are the acceptance criteria and NFRs for a News Blog Performance Optimization interface. Do NOT write the implementation. Write only the test suite, using Vitest and React Testing Library, so I can verify these criteria. Cover: (1) Happy path: the interface renders a list of news articles, and search, category filter, sort, and bookmark toggle all update the list immediately; (2) Empty state: when a search returns nothing, a "No data found" message is shown, not a blank screen; (3) Bad connectivity: a visible loading indicator appears during any async operation, such as a simulated slow fetch; (4) Invalid input: submitting a form with missing or malformed data is blocked and the offending fields are marked with an error state; (5) Accessibility: all interactive elements have ARIA labels and are keyboard-operable; (6) Telemetry: `[Analytics] User interacted with Performance Optimization` is logged to the console on each primary action; (7) Security: text input containing `<script>alert(1)</script>` is sanitized before it's stored in state; (8) Performance: memoized child components do not re-render when unrelated state changes (use render counters or a mocked child), and the filtered list computation does not re-run when unrelated state changes. Run the tests and show me that they fail for the right reasons.

**What the AI did:**
Wrote 10 test files in `src/__tests__/` (one per criterion 1–8, plus unit contracts for `ArticleCard` and `filterAndSortArticles`), shared fixtures/helpers in `src/test/`, and `src/test/CONTRACT.md` documenting the interface the tests assume. Added `jest-axe` for automated a11y checks. Added a null-rendering `src/App.jsx` placeholder so tests fail on assertions rather than on an unresolved import. Wrote no implementation.

**Outcome:** ✅ Worked — suite is Red (all 69 runnable tests fail; 2 suites fail to import their not-yet-existing modules).

**Notes / follow-up:**
First run had 1 vacuous test that passed against a blank page; fixed by adding a positive loading-indicator assertion. Most tests currently fail at the shared precondition (article list never renders), so individual assertions are not yet exercised — expect to find and fix a few test bugs in Green; change a test only if the spec is wrong.

---

### Prompt #3 — Happy-path implementation + design system (Green, part 1)

**Phase:** TDD: implement

**Prompt:**
> Now write the implementation to make the happy-path tests pass. First, create a monochromatic design system as CSS variables or a theme object: grayscale palette, spacing in 16px/32px steps, and a type scale, with no hardcoded hex values in components. Then build the news article explorer: a mock dataset of at least 200 articles (so performance matters), a search input, a category filter, a sort control, a bookmark toggle on each article card, and the article list. Keep the code straightforward and don't add optimizations yet. Run the tests and show me which now pass.

**What the AI did:**
Added `src/styles/tokens.css` (grayscale palette, 16/32px spacing scale, type scale; the only file with raw colors), `App.jsx`, `ArticleCard.jsx` (plain component, no memo yet) and `filterAndSortArticles`. Generated 240 deterministic articles into `public/articles.json` via `scripts/generate-articles.js`. Added two guard tests: `design-system.test.js` (no hardcoded colors; spacing and font-size only from tokens) and `dataset.test.js` (>= 200 unique articles). Replaced the Vite template favicon with a grayscale one.

**Outcome:** ✅ Worked — all 15 happy-path tests pass, plus the filter unit tests and both guard tests. Remaining failures are the later steps (empty state, loading, tip form, telemetry, sanitization, memoization).

**Notes / follow-up:**
First run of `design-system.test.js` had 3 failures caused by a regex group offset in the test itself (it read the property name instead of the value); fixed the test, not the CSS. No loading or error state yet, so the list is briefly empty while the fetch is pending.

---

### Prompt #4 — Unhappy-path implementation (Green, part 2)

**Phase:** TDD: implement

**Prompt:**
> Make the Unhappy Path tests pass. (1) Empty state: when search or filters return zero articles, show a user-friendly "No data found" message. (2) Bad connectivity: load the articles through a simulated async fetch with a 2-3 second delay, and show a visible loading indicator, plus an error message with a retry button if the simulated request fails. (3) Invalid input: add a "Submit a Story" form with title, author email, and summary. Use custom regex validation, block submission when data is missing or malformed, and highlight the offending fields in red (using the design tokens) with an inline error message. Run the tests and show me the results.

**What the AI did:**
Added `src/api/newsApi.js` (simulated 2-3 s latency; `?simulate=error|offline` failure switches), `StoryForm` with regex rules in `validateStory.js`, loading / error+Retry / "No data found" states in `App`, and a red `--red-*` status token family (the only non-gray colors). Because the spec now named the form "Submit a Story" (title, author email, summary), the tests' placeholder "Submit a tip" form was renamed accordingly; assertions about behavior were unchanged. Added tests for request failure + retry, failed submission, title rules, the regexes, the latency window (fake timers) and an end-to-end simulated-3G test.

**Outcome:** ✅ Worked — suites 1-5 fully green. Remaining red: telemetry, sanitization, memoization.

**Notes / follow-up:**
Test env sets `VITE_SIMULATE_BACKEND=false` so the suite has no real delays; the simulated path is covered by `newsApi.test.js` and `9-simulated-network.test.jsx`. Form state lives inside `StoryForm`, so typing there already doesn't re-render the article cards.

---

<!-- Add Prompt #5 below -->
