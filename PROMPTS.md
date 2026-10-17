# Prompt Log — News Explorer (ENG-84718)

Test-driven, AI-assisted development of a news explorer with 240 articles: every step below is one prompt to the assistant, verified by the automated test suite.

**Assistant:** Claude (Anthropic)  ·  **Method:** spec → failing tests → implementation → optimization → manual verification  ·  **Final suite:** 276 tests passing, lint clean

> **Before submitting (delete this note):** (1) confirm the assistant name above is true for every step (the ticket names Antigravity; if any step used another tool, add those prompts); (2) record the results of the manual checks in entry 7; (3) add a recovery entry for any failure you find. Search this file for `TODO(you)`.

## Summary

| # | Phase | Outcome | Tests (pass / fail) |
| --- | --- | --- | --- |
| 1 | Setup | Project and tooling, no feature code | no tests yet |
| 2 | **Red** | Failing tests for all eight criteria, no implementation | 0 / 70 |
| 3 | **Green** 1 | Happy path and design system | 65 / 42 |
| 4 | **Green** 2 | Empty, loading/error and invalid-input states | 135 / 17 |
| 5 | **Optimize** | `useMemo`, `useCallback`, `React.memo`, debounce | 150 / 14 |
| 6 | **Green** 3 | Accessibility, telemetry, security | 276 / 0 |
| 7 | Verify | Manual browser checklist | see entry 7 |
| 8 | Finalize | This log | n/a |

Test totals grow because tests were added during implementation; none of the original 70 was deleted or loosened. One manual change to tooling config (the `npm` scripts) is disclosed under follow-ups.

## Engineering highlights

1. **Performance was measured, not assumed.** Render counts were taken on all 240 articles before and after: toggling one bookmark went from 240 card renders to 1, changing the sort from 240 to 0, typing a search from 422 to 0. A four-keystroke search burst went from 4 filter runs to 1.
2. **Debounce versus "update immediately".** The two requirements conflict, so the search box echoes every keystroke instantly while the list follows about 300 ms after typing pauses; category and sort stay instant. The real 300 ms is tested with fake timers.
3. **Live regions that actually announce.** Loading, result counts and "No data found" use one persistent `aria-live` region. A later review caught `aria-busy` on an ancestor, which can silence it, and removed it. A skip link avoids tabbing through 240 buttons to reach the form.
4. **Contrast computed from the design tokens.** A test calculates WCAG ratios from `tokens.css` and caught input borders at 2.99:1 against the 3:1 minimum, so the border token was darkened.
5. **A sanitizer built for obfuscated input.** `sanitizeText` removes (rather than escapes) markup, repeats until the text is stable so nested payloads like `<scr<script>ipt>` cannot survive, and is idempotent. ESLint bans `innerHTML`, `dangerouslySetInnerHTML` and `eval`; a repo scan for keys and PII was proven effective by planting violations.
6. **An unreliable network you can demonstrate.** Requests simulate a 2–3 s connection, with a loading state, an error with Retry, and `?simulate=error` / `?simulate=offline` switches, covered by unit and end-to-end tests.

## Prompt sequence

Prompts are quoted verbatim from the messages sent. Each message also began with a heading (used as the entry title) and a one-sentence rationale from the plan; that rationale is omitted in entries 1–6 and 8, and kept in entry 7 because it is part of that message's instructions. Expand an entry to read the full prompt and notes.

<details>
<summary><b>1. Project Setup & PROMPTS.md Skeleton</b> — Vite + React, Vitest/RTL/jsdom, ESLint, scripts; no feature code</summary>

**Prompt:**
> Set up a new React project using Vite for a “News Blog Performance Optimization” interface (Ticket ENG-84718). Install and configure Vitest with React Testing Library and jsdom, plus ESLint with a config that flags unused imports. Add `npm test` and `npm run lint` scripts. Create an empty `PROMPTS.md` in the repo root with a heading and a template for logging entries (prompt number, prompt text, what the AI did, and whether it worked or needed a revert). Add `.env` to `.gitignore`. Do not write any components or feature code yet.

**Produced:** a Vite + React project with Vitest, React Testing Library, jsdom, ESLint 9 and the two scripts, `.env` git-ignored, this log's skeleton, and no feature code.

**Notes:**
- The Vite template ships with oxlint, not ESLint. It was replaced because the ticket's checklist requires ESLint with unused-import detection.
- ESLint 10 conflicted with `eslint-plugin-jsx-a11y`, which does not support it yet, so ESLint was pinned to 9 instead of forcing the install.
- The template's demo code was deleted so that no component exists before its tests do.
- A setting `passWithNoTests: true` was added here and removed in follow-up 2b, because it hid a missing test folder.

</details>

<details>
<summary><b>2. Feed the Spec & Write the Failing Tests (TDD: Red)</b> — 70 failing tests across all eight criteria; no implementation</summary>

**Prompt:**
> Here are the acceptance criteria and NFRs for a News Blog Performance Optimization interface. Do NOT write the implementation. Write only the test suite, using Vitest and React Testing Library, so I can verify these criteria. Cover: (1) Happy path: the interface renders a list of news articles, and search, category filter, sort, and bookmark toggle all update the list immediately; (2) Empty state: when a search returns nothing, a “No data found” message is shown, not a blank screen; (3) Bad connectivity: a visible loading indicator appears during any async operation, such as a simulated slow fetch; (4) Invalid input: submitting a form with missing or malformed data is blocked and the offending fields are marked with an error state; (5) Accessibility: all interactive elements have ARIA labels and are keyboard-operable; (6) Telemetry: `[Analytics] User interacted with Performance Optimization` is logged to the console on each primary action; (7) Security: text input containing `<script>alert(1)</script>` is sanitized before it’s stored in state; (8) Performance: memoized child components do not re-render when unrelated state changes (use render counters or a mocked child), and the filtered list computation does not re-run when unrelated state changes. Run the tests and show me that they fail for the right reasons.

**Produced:** 10 test files (70 tests) covering all eight criteria, plus a written contract of the interface the tests assume (`src/test/CONTRACT.md`); no implementation.

**Notes:**
- **Iteration:** the first run showed one test passing against a blank page (it only asserted that things were absent). It was strengthened with a positive assertion and then failed correctly.
- **Placeholder, not implementation:** a null-rendering `src/App.jsx` was added so tests fail on their assertions rather than all failing on an unresolved import.
- **Invented detail:** the ticket never named the form, so the tests assumed a placeholder "Submit a tip" form (name, email, tip). The spec replaced it in step 4.
- **Honest limit:** most tests failed at the same early step (the list never rendered), so their individual assertions were not exercised until the Green steps. The AI flagged that some test bugs might appear later (two did: steps 3 and 6).
- `jest-axe` was added so the accessibility criterion is checked by a real engine.
- **Result:** 0 passing / 70 failing; 2 further suites (`ArticleCard`, `filterAndSortArticles`) could not import their modules because those did not exist yet.

</details>

<details>
<summary><b>2a–2c. Follow-ups after step 2</b> — local environment problems (includes one manual config edit)</summary>

**2a. Follow-up: "the code was not running" (manual intervention)**

**Message:**
> the code was not running so i have made some changes consider it

(followed by an edited `package.json`)

**Produced:** the AI verified the change and merged it into the project.

**Notes:**
- **This is the only hand edit of the project.** The `npm` scripts were changed to call `node node_modules/<tool>/…` directly instead of the `.bin` shims (`vite`, `vitest`, `eslint`), because the shims failed on the developer's machine. It is a tooling/config change, not application code.
- The AI checked that the three hard-coded paths exist and match each package's declared `bin`, and that lint and build still pass.
- **Cause not proven:** the likely culprit is an `&` in the project's folder path, which can break shell shims on Windows. Moving the project to a path without `&` is the first thing to try if tooling errors return.
- The edited file had dropped the `jest-axe` dev-dependency added in step 2; the AI flagged it (see 2c).

**2b. Follow-up: "it shows this error" — `No test files found`**

**Message:**
> it shows this error

(followed by terminal output: `npm test` ran `vitest run` and printed `No test files found, exiting with code 0`)

**Produced:** `passWithNoTests` removed from `vite.config.js`; updated zip.

**Notes:**
- **Cause:** the local folder was still the step-1 download, which had no test files. Extracting the step-2 zip over it fixed that (no code was wrong).
- **Why a change anyway:** Vitest exited with code 0 on "no tests" only because of the `passWithNoTests: true` setting from step 1. A missing test folder should fail loudly, so the setting was removed.

**2c. Follow-up: "Check this output" — 60 failures instead of 70**

**Message:**
> Check this output

(followed by `npm test` output ending `Tests 60 failed (60)`, then a second paste showing `npm ls jest-axe` → `jest-axe@11.0.0`, `npm install -D jest-axe` → `up to date`, and `Tests 70 failed (70)`)

**Produced:** a diagnosis; no code change.

**Notes:**
- 60 vs 70 was explained exactly: `5-accessibility.test.jsx` has 10 tests and its suite could not load because `jest-axe` was not installed locally (reported as "no tests", not as 10 failures).
- **Resolution:** the developer ran `npm install -D jest-axe`; the suite then reported the expected 70 failures, all for the right reason (the article list is not rendered yet).

</details>

<details>
<summary><b>3. Happy Path Implementation + Design System (Green, Part 1)</b> — Design tokens, 240 articles, search / filter / sort / bookmarks</summary>

**Prompt:**
> Now write the implementation to make the happy-path tests pass. First, create a monochromatic design system as CSS variables or a theme object: grayscale palette, spacing in 16px/32px steps, and a type scale, with no hardcoded hex values in components. Then build the news article explorer: a mock dataset of at least 200 articles (so performance matters), a search input, a category filter, a sort control, a bookmark toggle on each article card, and the article list. Keep the code straightforward and don’t add optimizations yet. Run the tests and show me which now pass.

**Produced:** grayscale design tokens (16/32px spacing, type scale), 240 generated mock articles and the explorer (search, category, sort, bookmarks), making all 15 happy-path tests pass.

**Notes:**
- **Iteration:** the first run of a new guard test (`design-system.test.js`) had 3 failures caused by a regex bug *in the test* (it read the property name instead of its value). The test was fixed; the CSS was correct.
- **Tests added during implementation:** `design-system.test.js` (no hardcoded colors; spacing and font sizes only from tokens) and `dataset.test.js` (at least 200 unique articles) enforce this prompt's two explicit rules.
- **Deliberately left red:** no memoization (the prompt said not to optimize yet), so the `React.memo` test and some performance tests stayed failing. No loading or empty states yet either (step 4).
- **Result:** 65 passing / 42 failing (107 tests).

</details>

<details>
<summary><b>4. Unhappy Path Implementation (Green, Part 2)</b> — Empty, loading + retry, and invalid-input states</summary>

**Prompt:**
> Make the Unhappy Path tests pass. (1) Empty state: when search or filters return zero articles, show a user-friendly “No data found” message. (2) Bad connectivity: load the articles through a simulated async fetch with a 2-3 second delay, and show a visible loading indicator, plus an error message with a retry button if the simulated request fails. (3) Invalid input: add a “Submit a Story” form with title, author email, and summary. Use custom regex validation, block submission when data is missing or malformed, and highlight the offending fields in red (using the design tokens) with an inline error message. Run the tests and show me the results.

**Produced:** the "No data found" state, a simulated 2–3 s fetch with loading indicator and error + Retry, and a "Submit a Story" form with regex validation and red inline errors; suites 1–5 green.

**Notes:**
- **Spec change, so tests were edited:** this prompt named the form "Submit a Story" (title, author email, summary). The step-2 tests used a placeholder "tip" form, so they were renamed to match. The behaviors asserted (blocked submit, red error state, inline message, loading, no double-send) did not change. Two numeric rules were the AI's choice because the spec gave none: title 5–100 characters, summary at least 20 (the placeholder tip rule was 10).
- **Palette exception:** the ticket asks for red errors but also a monochrome palette, so `tokens.css` gained a small `--red-*` family used only for errors; the palette guard test was extended to allow nothing else.
- **Simulation switches:** `?simulate=error` (first load fails, Retry works) and `?simulate=offline` (everything fails) make the failure paths demonstrable; a test-only setting (`VITE_SIMULATE_BACKEND=false`) removes the 2–3 s waits from the main suite, and dedicated fake-timer and end-to-end tests cover the real timing.
- **Tests added:** request failure and Retry, failed submission, title rules, regex unit tests, latency window, end-to-end simulated 3G.
- **Known gap at this point:** a later accessibility review found an `aria-busy` attribute introduced here that could silence the live regions (fixed in step 6).
- **Result:** 135 passing / 17 failing (152 tests).

</details>

<details>
<summary><b>5. Performance Optimization (Green, Part 3)</b> — Memoization + debounce: 240 → 1 card renders per bookmark click</summary>

**Prompt:**
> Now apply the performance constraint. Wrap the expensive filter/search/sort computation in `useMemo` with correct dependencies. Stabilize every handler passed to child components (bookmark toggle, filter change, search change) with `useCallback`. Wrap the article card component in `React.memo` so the stabilized props actually prevent re-renders. Also debounce the search input so it doesn’t recompute on every keystroke. Make the performance tests from Part 2 pass, then explain in one short paragraph why `useCallback` alone wouldn’t prevent re-renders without `React.memo`, and show me how to confirm the improvement in the React DevTools Profiler (before versus after).

**Produced:** `useMemo`, `useCallback`, `React.memo` and a 300 ms search debounce, with a measured before/after: toggling one bookmark re-renders 1 card instead of 240.

**Notes:**
- **Baseline first:** the AI measured the unoptimized app on the real 240 articles using temporary render counters (added to a backup copy and reverted afterwards), then re-measured. Card renders: toggle one bookmark 240 → 1; change sort 240 → 0; type "tech" 422 → 0. Filter runs for a 4-key search burst: 4 → 1 with the debounce.
- **Scope beyond the prompt:** `ArticleControls` was extracted and `StoryForm` memoized so the stabilized filter/search handlers feed memoized children.
- **Conflict with step 2:** "update immediately" vs "debounce the search". Resolved by letting the input echo instantly and the list follow ~300 ms after typing pauses; category and sort stay instant. The main test suite runs with the debounce at 0 so its older assertions stay synchronous, and a separate test turns the real 300 ms on.
- The "why `useCallback` alone isn't enough" paragraph and the Profiler walkthrough were delivered in the chat response (not stored in the repo).
- **Result:** 150 passing / 14 failing (164 tests); all 8 performance tests and the `React.memo` test pass; the 14 failures were telemetry (6) and sanitization (8).

</details>

<details>
<summary><b>6. NFRs: Accessibility, Telemetry & Security (Green, Part 4)</b> — Live regions, contrast, telemetry, sanitizer, secrets scan</summary>

**Prompt:**
> Make the remaining NFR tests pass. (1) Accessibility: add ARIA labels and roles to every interactive element (search, filters, sort, bookmark buttons, form fields, retry button), make everything keyboard navigable with visible focus states, use `aria-live` for the loading and empty states, and check contrast against my design tokens. I’m targeting a 100% Lighthouse accessibility score. (2) Telemetry: log `[Analytics] User interacted with Performance Optimization` to the console whenever a primary action completes (search, filter apply, bookmark, form submit). (3) Security: write a sanitization function that strips or escapes XSS payloads from all text inputs before storing them in state, and show me the function. Make sure no API keys or PII are hardcoded anywhere.

**Produced:** persistent live regions, a skip link and search landmark, AA-checked token contrast, telemetry on completed actions, `sanitizeText`, and a repo scan for secrets and PII; the whole suite green.

**Notes:**
- **Found by a new test, fixed:** the contrast test computed 2.99:1 for input borders on the gray surface (needs 3:1), so `--gray-400` was darkened from `#8f8f8f` to `#8a8a8a`.
- **Bug from step 4, fixed:** `aria-busy` on ancestors of live regions was removed.
- **Existing tests touched (and why):** `9-simulated-network` now finds the loading text by text instead of `role="status"` (there are now two live regions on the page); fake emails in `validateStory.test.js` moved to reserved `example.*` domains so the PII scan can be strict.
- **Iterations on new tests:** the secret scan first failed to load (jsdom's `URL` rejected by Node's `fileURLToPath`), fixed by running that file in the Node environment; it then flagged a code *comment* mentioning `innerHTML`, so it now ignores comments. It was proven non-vacuous by planting a fake API key and an `innerHTML` assignment (both caught, then removed).
- **Trade-offs:** the sanitizer removes rather than escapes and drops stray `<`/`>` in prose; it is defense in depth, not a security boundary.
- **Not done here:** Lighthouse could not be run (the AI's sandbox has no Chrome); axe-core scans and the token-contrast test stand in until it is run locally.
- **Result:** 276 passing / 0 failing (20 test files).

</details>

<details>
<summary><b>7. The Iterative Loop (Manual Verification)</b> — Browser verification checklist (results to be recorded)</summary>

**Prompt:**
> This isn’t a build step. It’s the ticket’s Step 2 rule, which says that when the AI breaks something you don’t fix it by hand. Use these when something goes wrong.
> Browser verification checklist for you: run the app and manually check (a) a search with no results shows “No data found”; (b) throttle the network to Slow 3G in DevTools and confirm the loading indicator appears; (c) submit the form empty and with a bad email and confirm red highlights; (d) tab through the entire page with only the keyboard; (e) run Lighthouse and check the accessibility score; (f) record a Profiler session and confirm the cards don’t re-render when typing in an unrelated field.
> If the AI breaks something, paste the error and send this:
> “That approach caused an error: [paste exact error]. Let’s revert and try a different method.”
> Don’t edit the code yourself. Log the failed attempt and the revert in `PROMPTS.md`, because the log of recoveries is part of what’s being graded.

**Produced:** `VERIFICATION.md`, a fillable checklist for checks a–f with expected results, a "not bugs" list, likely trouble spots and the recovery protocol; no code changed.

**Notes:**
- The AI named the places jsdom cannot see as the likeliest failures: real layout/CSS, the sticky form on short windows (DevTools docked), and the Lighthouse score itself.

> **TODO(you):** record the results of checks a–f here (pass/fail, the Lighthouse scores, screenshot file names). If any check fails, add a recovery entry (format below) *before* fixing anything.

</details>

<details>
<summary><b>8. Finalize PROMPTS.md</b> — This log</summary>

**Prompt:**
> Review my `PROMPTS.md` and clean it up into the exact sequence of prompts I used to guide Antigravity to the final solution. For each entry include the prompt, a one-line summary of what it produced, and notes on any reverts or iterations and why. Check that it reads as a clear TDD story: spec fed in, tests written and failing, implementation turning them green, and optimization applied. Don’t invent prompts I didn’t use. Flag any gaps I should fill in myself.

**Produced:** this log.

**Notes:**
- Corrected earlier errors: entry 2 said 69 failing tests (it was 70), straight quotes had replaced the original curly quotes, the follow-ups and entries 7–8 were missing, and the assistant field was blank.

</details>

## Recovery log

The prescribed recovery prompt (“That approach caused an error: [paste exact error]. Let’s revert and try a different method.”) has **not been needed so far**. Problems that did occur were handled inside the prompts above or through follow-ups 2a–2c; none required reverting a feature. Internal self-corrections by the AI are recorded in the Notes of entries 2, 3 and 6.

> **TODO(you):** add an entry here for every failure found during manual verification (entry 7), before fixing anything.

<details>
<summary><b>Test changes after they were written (and why)</b></summary>

| When | Change | Why |
| --- | --- | --- |
| Step 2 | One loading test strengthened | It passed against a blank page |
| Step 3 | New guard test's regex fixed | Bug in the test, not the CSS |
| Step 4 | Placeholder "tip" form renamed to "story"; summary minimum 10 → 20 characters; failure-mocking options added to the fetch stub | The spec named the form; thresholds were the AI's choice |
| Step 5 | No existing test changed; debounce set to 0 in the test environment | Keep older "immediate" assertions synchronous; real 300 ms tested separately |
| Step 6 | `9-simulated-network` queries loading text by text; fake emails moved to `example.*` domains | A second live region was added; stricter PII scan |

---

</details>

<details>
<summary><b>Other messages in the conversation</b> — no change to the project</summary>

| After | Message | Outcome |
| --- | --- | --- |
| 2b | "is it ok to use step 2 zip file" | Confirmed; latest zip re-shared |
| 2c | "Is fixing the failure not necessary in this project?" | Explained Red → Green: failures are fixed in steps 3–6 |
| 2c | "Write a little good git commit", then "You don't have to mention the ENG-84718 (TDD red)" | Commit messages only |
| 3, 4 | Pasted `npm test` output (no text) | Confirmed it matched the AI's run (65/42, then 135/17) |
| 6 | "Continue" | Sent when a long step was interrupted; work resumed |

---

</details>

<details>
<summary><b>Entry templates</b></summary>

```md
### N. <title>

**Prompt:**
> <exact text sent>

**Produced:** <one line>

**Notes:** <reverts, iterations, trade-offs, and why>
```

Recovery entry:

```md
### Recovery N — <short title>

**Trigger:** manual check <a–f>: <what was seen>
**Exact error:** <paste verbatim>
**Prompt:** That approach caused an error: <error>. Let’s revert and try a different method.
**What the AI reverted / the different approach it took:** <…>
**Outcome:** fixed / partly / failed again
```

</details>
