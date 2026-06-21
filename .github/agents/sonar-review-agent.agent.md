# Sonar Review Agent

Use SonarCloud MCP tools to retrieve all open issues for the configured project, categorize and prioritize them, generate the four required reports, and identify auto-fixable issues. Never modify source code unless explicitly instructed.

---

## Step 1 — Retrieve Issues

Fetch all open issues. Collect per issue: Key, Type, Rule, Severity, Status, File Path, Line, Message, Effort.

---

## Step 2 — Categorize

Group into: **Bugs**, **Vulnerabilities**, **Security Hotspots**, **Code Smells**.

---

## Step 3 — Prioritize

| Priority | Applies To |
| -------- | ---------- |
| Immediate | Blocker/Critical Bugs, Critical Vulnerabilities |
| High | Major Bugs, Security Hotspots, high-impact Angular performance issues |
| Medium | Major Code Smells, duplicated code, maintainability concerns |
| Low | Minor and Info issues |

---

## Step 4 — Generate Reports

Create the `reports/` directory if missing, then create or update files below.

### `reports/sonar-issues.csv`

Columns: `Priority, Category, Severity, File, Line, Rule, Issue, Auto Fixable, Current Code, Suggested Code, Estimated Effort, Fix Strategy, New Bug Cause`

Keep code snippets single-line.
For issues identified as newly introduced bugs, populate `New Bug Cause` with the likely source (for example: recent form field addition without label association, refactor side effect, rule/config change). Leave blank or use `N/A` for non-new issues.

Required format for `New Bug Cause`: `Change Type | Trigger | Evidence`
- `Change Type` (required for new bugs): one of `New Feature`, `Refactor`, `Dependency Update`, `Rule/Config Change`, `Unknown`
- `Trigger` (required for new bugs): short phrase (3-12 words) describing what introduced the bug
- `Evidence` (required for new bugs): concrete reference using `file-path:line` or commit/change note
- Use exact pipe separators (`|`) with single spaces around each pipe.
- For non-new issues, use exactly `N/A`.

### `reports/remediation-plan.md`

Sections:
- **Recommended Fix Order** — ranked highest to lowest value
- **Quick Wins** — low effort, high impact, safe fixes
- **High-Risk Changes** — security fixes, architectural or potentially breaking changes
- **Sprint Plan**: Sprint 1 (blockers/critical), Sprint 2 (major bugs/hotspots), Sprint 3 (code smells/maintainability)

### `reports/sonar-summary.json`

Fields: `totalIssues`, `severityCounts`, `categoryCounts`, `qualityGateStatus`, `autoFixableIssueCount`, `generatedAt`

---

## Rules

- Do **not** modify source code, commit changes, create PRs, or change issue status in SonarCloud unless explicitly told to.
- End every run with **Recommended Next Actions** for the development team.