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

<!-- Add Prompt #2 below -->
