# Remediation Plan — productivity-dashboard
**Project:** `Israk11_productivity-dashboard`  
**Quality Gate:** ❌ ERROR — `new_reliability_rating` = C (actual: 3, threshold: 1)  
**Generated:** 2026-06-26  
**Total Open Issues:** 28 (10 Bugs · 1 Vulnerability · 17 Code Smells · 0 Security Hotspots)

---

## ✅ Fixes Applied (2026-06-26)

The following 20 issues that were **causing the quality gate failure** have been auto-fixed:

| Rule | Files | Issues Fixed | Change Made |
|------|-------|-------------|-------------|
| `Web:InputWithoutLabelCheck` | projects.component.html, tasks.component.html | 10 | Added `id` attribute to all `<input>` and `<select>` form controls |
| `Web:S6853` | projects.component.html, tasks.component.html | 10 | Added `for` attribute to all `<label>` elements matching each input `id` |

**IDs added (projects form):** `project-name`, `project-status`, `project-developer`, `project-start-date`, `project-end-date`  
**IDs added (tasks form):** `task-title`, `task-priority`, `task-assigned-to`, `task-start-date`, `task-due-date`

> The `new_reliability_rating` condition should recover to **A (1)** after the next Sonar scan. Re-push and re-trigger analysis to confirm quality gate passes.

---

## Recommended Fix Order

Ranked from highest to lowest remediation value (impact × effort):

| Rank | Issue Group | Files Affected | Issues | Effort | Priority |
|------|-------------|---------------|--------|--------|----------|
| 1 | Input fields missing `id` + labels missing `for` (accessibility bugs) | projects.component.html, tasks.component.html | 20 | ~100min total | High |
| 2 | Useless `tempUrl` variable assignments | project.service.ts, task.service.ts | 2 | 2min | Medium |
| 3 | Express version disclosure (`X-Powered-By` header) | server.ts | 1 | 5min | Low |
| 4 | CSS contrast failures (WCAG AA) | navbar.component.css | 2 | 10min | Medium |
| 5 | Duplicate CSS selector `.project-bottom` | projects.component.css | 1 | 1min | Medium |
| 6 | Empty CSS blocks / empty source | dashboard.component.css, app.component.css | 2 | 2min | Low |

---

## Quick Wins

Low effort, high impact, safe to fix immediately:

- **`typescript:S1854` — Remove useless `tempUrl` variable** (2 issues, ~2min total)
  - `src/app/services/project.service.ts:25` — Replace `let tempUrl = this.apiUrl; return tempUrl;` with `return this.apiUrl;`
  - `src/app/services/task.service.ts:25` — Same pattern; remove intermediate variable

- **`css:S4658` / `css:S4667` — Delete empty CSS blocks and empty source files** (2 issues, ~2min total)
  - `src/app/pages/dashboard/dashboard.component.css:1` — Remove the empty `h1 {}` rule
  - `src/app/app.component.css` — Delete or populate the empty file

- **`css:S4666` — Merge duplicate CSS selector** (1 issue, ~1min)
  - `src/app/pages/projects/projects.component.css:121` — Merge `.project-bottom` rules at line 121 into the original block at line 21

- **`typescript:S5689` — Disable Express `X-Powered-By` header** (1 issue, ~5min)
  - `src/server.ts:12` — Add `app.disable('x-powered-by');` immediately after creating the Express instance

---

## High-Risk Changes

Security fixes and potentially breaking changes — review carefully before merging:

- **`typescript:S5689` — Express version disclosure**
  - **Risk:** Low — disabling `X-Powered-By` is a standard security hardening step with no functional side effects
  - **Action:** `app.disable('x-powered-by');` in `src/server.ts`

- **`css:S7924` — CSS contrast ratio failures** (2 issues in `navbar.component.css`)
  - **Risk:** Medium — changing color values affects visual design; requires sign-off from UI/UX
  - **Action:** Adjust text and/or background colors to achieve WCAG AA minimum contrast ratio of 4.5:1
  - **Tool:** Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to validate new values before committing

- **`Web:InputWithoutLabelCheck` + `Web:S6853` — Accessible form labels** (20 issues)
  - **Risk:** Low-Medium — HTML structure changes; verify Angular form bindings and any CSS selectors targeting `<label>` or `<input>` are not broken
  - **Action:** Add `id` attributes to all unlabelled `<input>` elements and matching `for` attributes to paired `<label>` elements in `projects.component.html` and `tasks.component.html`

---

## Sprint Plan

### Sprint 1 — Blockers & Critical (Quality Gate Recovery)
**Goal:** Pass the quality gate by eliminating all reliability bugs in the new code period.

| Task | Rule | Files | Effort |
|------|------|-------|--------|
| Associate all form inputs with labels | Web:InputWithoutLabelCheck | projects.component.html, tasks.component.html | ~50min |
| Add `for` attributes to all paired labels | Web:S6853 | projects.component.html, tasks.component.html | ~50min |

> **Why:** The quality gate fails on `new_reliability_rating = 3`. These 10 `BUG`-type accessibility issues drive that rating. Fixing them will restore the gate to `OK`.

---

### Sprint 2 — Major Bugs & Security
**Goal:** Eliminate the vulnerability and reduce maintainability debt in services.

| Task | Rule | Files | Effort |
|------|------|-------|--------|
| Remove useless `tempUrl` assignments | typescript:S1854 | project.service.ts, task.service.ts | 2min |
| Disable Express `X-Powered-By` header | typescript:S5689 | server.ts | 5min |

---

### Sprint 3 — Code Smells & Maintainability
**Goal:** Clean up CSS quality and contrast issues; reduce overall technical debt.

| Task | Rule | Files | Effort |
|------|------|-------|--------|
| Fix CSS contrast ratios | css:S7924 | navbar.component.css | ~10min |
| Merge duplicate CSS selector | css:S4666 | projects.component.css | 1min |
| Remove empty CSS blocks/files | css:S4658, css:S4667 | dashboard.component.css, app.component.css | 2min |

---

## Recommended Next Actions for the Development Team

1. **Immediately fix `Web:InputWithoutLabelCheck` bugs** — These are failing the quality gate (`new_reliability_rating`). Add `id` to every form `<input>` and `for` to every `<label>` in `projects.component.html` and `tasks.component.html`.
2. **Remove the `tempUrl` dead code** in `project.service.ts:25` and `task.service.ts:25` — introduced in the latest push (2026-06-26), takes under 2 minutes to fix.
3. **Harden `server.ts`** with `app.disable('x-powered-by')` to resolve the Express version-disclosure vulnerability.
4. **Schedule a CSS review** for navbar contrast and duplicate/empty CSS rules in Sprint 3.
5. **Re-run the Sonar analysis** after Sprint 1 fixes to confirm quality gate recovery.
