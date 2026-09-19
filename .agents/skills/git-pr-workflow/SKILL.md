---
name: git-pr-workflow
description: Enforces Git branching rules, commit message conventions, and Pull Request (PR) markdown templates for the HRM project. Use whenever committing code or generating PR descriptions.
---

# Git & Pull Request Workflow (HRM Design System)

Standardized Git conventions and PR description guidelines for `cmdn-hrm-design`.

---

## 1. Branching Strategy
- Base branch for development: `develop`.
- Production branch: `main`.
- Feature branch naming conventions:
  - `feature/<short-description>` (e.g. `feature/project-management-view`, `feature/enhance-filter-section`).
  - `fix/<short-description>` (e.g. `fix/table-pagination-sync`, `fix/favicon-base-path`).
  - `refactor/<short-description>` (e.g. `refactor/unify-enhanced-components`).
  - `chore/<short-description>` (e.g. `chore/update-skills-and-workflow`).

---

## 2. Commit Message Conventions
Commit format must follow the bracketed `[TYPE]` prefix:

```text
[TYPE] Short descriptive summary in imperative mood

- Bullet points explaining key changes if needed
- Rationale or design decisions
```

### Supported Commit Types:
- `[FEAT]`: New screen, component, or interactive feature.
- `[FIX]`: Bug fix, layout alignment, broken interaction.
- `[ENHANCE]`: Improving an existing UI screen, component, or pattern.
- `[REFACTOR]`: Code cleanup without altering visual behavior.
- `[CHORE]`: Config, documentation, skills, tooling updates.

*Example:*
```text
[FEAT] Add project management preview view

- Implement Pattern 1 Table Dashboard with EnhancedFilterSection
- Add in-memory mock store for project list and status updates
- Verify 0 errors with TypeScript and ESLint
```

---

## 3. Pull Request (PR) Description Template

Always generate PR descriptions in clear, professional English Markdown using the standard structure below (avoiding unnecessary emojis):

```markdown
## Overview
Brief 1-2 sentence summary of what this PR introduces and the problem it solves.

## Key Changes
- **Component / View**: Description of changes adhering to the Enhanced Component Architecture.
- **State / Mocks**: Details on mock store updates in `src/pages/PreviewDesign/mock/`.
- **Styling / Tokens**: Confirmation of 8-point grid and Design Tokens usage from `globals.css`.

## Pattern & Architecture Compliance
- [x] Follows Pattern 1 (Table Dashboard) / Pattern 2 (Form Drawer) / Pattern 3 (Detail View).
- [x] Uses `Enhanced*` components exclusively (`EnhancedDataTable`, `EnhancedFilterSection`, etc.).
- [x] Adheres to Scope Lock (no unintended config or root file changes).

## Verification & Quality Report
| Check | Result |
| :--- | :--- |
| `pnpm run typecheck` | Passed (0 errors) |
| `pnpm run lint` | Passed (0 errors, 0 warnings) |
```
