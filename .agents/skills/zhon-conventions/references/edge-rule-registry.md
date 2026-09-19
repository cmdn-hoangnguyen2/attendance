# Edge rule registry

## Purpose

Common rules apply to every project. Edge rules apply only when a project declares them through repository instructions, a local skill, a specification, dependency or configuration evidence, or the user request.

At the beginning of an implementation task, report the active rules in this format:

```text
Active edge rules: i18n (required), design system (required), Auth0 security (active).
Inactive or not evidenced: analytics, CMS, multi-tenant support.
```

Do not claim a rule is active without evidence. If the repository has a local edge-rule index, it supersedes this registry.

## Registry

| Edge rule | Activate when | Required implementation concern |
| --- | --- | --- |
| i18n | `next-intl`, locale routing, message files, or an explicit multilingual requirement exists | Read the local i18n rule. All user-facing strings, including aria labels and errors, use translations. Machine codes, database enums, URLs, and analytics keys are not UI copy. |
| Design system | A design-system skill, token files, Figma library, or explicit UI token requirement exists | Read it before styling. Do not invent colors, spacing, radius, shadows, typography, or icon policy. |
| Auth and security | An auth library, protected data, roles, uploads, or secrets are in scope | Authorization runs server-side for every mutation. Do not expose secrets or persist bearer tokens outside the approved session design. |
| API and data fetching | API routes, server actions, external data, caching, or mutations are in scope | Define loading, error, empty, mutation, and invalidation behavior. Keep transport details outside presentational components. |
| Realtime | WebSocket, SSE, subscriptions, collaborative state, or event publishing is in scope | Database or server mutation is authoritative. Realtime events do not grant permission and are emitted only after a successful commit. |
| Forms and validation | User input or destructive actions are in scope | Validate on server; expose accessible field errors; use explicit confirmation for destructive operations when specified. |
| Testing | Test setup or an explicit test requirement exists | Follow the repository test pyramid and naming. Add coverage for changed permission, state transition, and edge cases proportionate to risk. |
| Analytics | A tracking SDK, analytics specification, or event ID is provided | Do not invent event names or IDs. Require an explicit event contract and consent or privacy requirements. |
| CSS modules or custom CSS | CSS Modules, Sass, vanilla CSS, or shared stylesheets are used alongside Tailwind | Keep BEM selectors shallow, avoid descendant coupling and high specificity, and do not duplicate Tailwind declarations. |
| Accessibility | Accessibility requirements, UI primitives, forms, dialogs, or keyboard interactions are in scope | Verify focus management, escape behavior, focus-visible, labels, contrast, and keyboard operation. |
| Backend architecture | Repository, server, database, or domain logic is in scope | Apply the project architecture. When none exists, separate domain, application, infrastructure, and presentation only if complexity warrants it; do not impose layers on a simple static page. |
| Monorepo | Workspace configuration or multiple packages are present | Respect package ownership and dependency boundaries; do not reach across packages without the public API. |

## Project-local edge index template

Projects may copy this into `.agents/skills/project-rules/SKILL.md` or an equivalent project instruction file:

```md
## Active edge rules

| Rule | Status | Source of truth |
| --- | --- | --- |
| i18n | required | .agents/skills/i18n/SKILL.md |
| design system | required | .agents/skills/design-system/SKILL.md |
| Auth0 | required | specs/auth.md |
| analytics | inactive | — |
```

An entry marked `required` must be read before relevant work. `active` applies only when the task touches it. `inactive` is intentionally ignored.
