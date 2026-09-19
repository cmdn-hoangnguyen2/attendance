---
name: zhon-conventions
description: Apply reusable frontend and full-stack coding conventions, including JSX logic separation, conditional-flow rules, semantic HTML, and Tailwind-friendly BEM hooks. Use when writing or refactoring application code.
---

# Coding Conventions

Use this skill for code changes. It supplies a portable baseline; repository instructions, approved specifications, and an active project design system take precedence.

## Start-of-task routing

1. Read relevant repository instructions, `specs/`, and project-local skills first.
2. Identify active edge rules using [the registry](references/edge-rule-registry.md). Check project configuration and the requested work; never assume every edge rule applies.
3. State active edge rules in the first implementation update. If a required edge rule is missing or conflicts with the specification, stop before complex implementation and ask for direction.
4. Do not add a dependency, framework, state manager, or architectural layer merely to satisfy this skill.

## Common rules

### Source structure and formatting

- Keep `app/` or an equivalent route layer thin: routing, metadata, page composition, and framework boundaries only. Put reusable UI and business logic in project-defined modules.
- Prefer feature ownership. Shared UI must not import feature code. Avoid circular and deep cross-feature imports; use a feature public API when composition is explicitly needed.
- Use the project's formatter and linter as the source of truth for syntax layout. Do not introduce formatting rules that conflict with them.
- Use the project import convention. If none exists, apply this order with one blank line between non-empty groups:
  1. Side-effect or style imports that the module legitimately owns.
  2. Framework or runtime imports (`next`, `react`, and their packages).
  3. Third-party packages.
  4. Internal core modules (`libs`, `utils`, `services`, `hooks`, `stores`, shared types).
  5. Feature public APIs.
  6. Shared and feature UI components.
  7. Relative modules.
- Keep a type-only import beside the import group that owns it; do not create an artificial type-import group. Avoid deep imports that bypass a feature's public API.
- Use meaningful names. Avoid cryptic abbreviations such as `e`, `idx`, `res`, or `req`. Standard names such as `event`, `index`, `user`, and `record` are allowed when their scope makes the referent clear.
- Components use PascalCase files; non-component files use camelCase. Directory names follow the repository convention.
- Keep reusable constants and domain option lists outside rendering components. A truly local one-use value may stay local when extracting it would make code harder to read.
- End text and code files with one newline and run the repository formatter.

### Component and logic boundaries

- Prefer arrow components: `const ComponentName = () => { ... }`. Do not force this where the framework or project tooling requires another form.
- Keep JSX declarative. JSX may display already-prepared values and compose components; it must not contain control-flow or transformation logic.
- Before `return`, derive display-ready values, callbacks, and content branches. Extract reusable or substantial rendering into a child component or a named render helper.
- Never place an IIFE, callback with statements, `map`, `filter`, `reduce`, nested ternary, template-building logic, or inline object or array construction inside JSX.
- A simple property display such as `{user.name}` is presentation, not prohibited logic. If it needs formatting, fallback, or transformation, prepare it before JSX.
- Keep simple component-local state local. Extract a hook or helper only for reusable logic, side effects, asynchronous behavior, domain rules, or complexity that obscures the component.

### Conditional flow

- Prefer guard clauses and early returns for invalid state, permissions, loading, and errors.
- Use `switch` for a finite discriminated state or enum with three or more mutually exclusive branches.
- Use `if` when conditions are not a finite state set.
- Never write nested ternaries. Do not nest `if` or `else` chains when guards, a `switch`, or a named predicate makes the flow flatter.
- Do not use `else` after a branch that returns. Limit conditions to one decision per branch where practical; name complex predicates.

### Tailwind and BEM hooks

- Use `cn()` when composing, conditionally applying, or merging classes. A single immutable class string does not require `cn()`.
- Every authored DOM element must have a stable BEM hook class before its Tailwind styling classes. This includes layout, semantic, interactive, and text elements; it excludes React fragments, `html` and `body`, and DOM rendered internally by third-party components.
- BEM classes are for discoverability and semantic structure, not for duplicating Tailwind declarations. Use `Block`, `Block__element`, and `Block--modifier`; do not use nesting-dependent selectors.
- Use `cn("RoomCard__title", "text-sm font-semibold")`. Keep the BEM hook first, then Tailwind classes. Group responsive Tailwind classes coherently when multiline.
- Do not use inline `style` attributes unless a runtime value cannot be represented safely with Tailwind or CSS variables and the project explicitly accepts it.

### HTML and accessibility

- Use semantic HTML. Choose `main`, `header`, `footer`, `nav`, `section`, `article`, `aside`, `figure`, `time`, `details`, and list elements when their semantics apply; do not use `div` or `span` as default structure.
- Put prose paragraphs in `p`; do not simulate paragraphs with repeated `br`.
- Use `ul`, `ol`, or `dl` for lists. Do not use visually repeated `div` or `p` elements to represent a list.
- Pair every visible form label with its control using `label` and `htmlFor` or `id`; give icon-only controls an accessible name.
- Do not manually set positive `tabIndex`. Use native interactive elements and browser focus order. `tabIndex={-1}` is permitted only for an established accessibility pattern.
- Use meaningful `alt`; decorative images use empty alt text. Heading order must follow document hierarchy.
- Attribute order: `className`, `id` or `name`, `data-*`, functional attributes (`src`, `href`, `type`, `value`, `htmlFor`), descriptive attributes (`title`, `alt`), event handlers, boolean attributes, then `role` or `aria-*`. Follow repository linting if it imposes a different valid order.

## Project edge rules

Use only the rules that the project activates. The active set must be visible to the agent at task start; see the [edge rule registry](references/edge-rule-registry.md).

Common examples are i18n, a design system, Auth and security, API and data fetching, forms, test strategy, analytics, and CSS or module rules. An edge rule can be **required**, **active**, or **inactive**. Required and active rules must be read before implementation; inactive rules must not influence the code.

## Validation before handoff

- Run the project formatter, lint, typecheck, and relevant tests when they exist and the task scope allows it.
- Check changed components for JSX control-flow, nested ternaries, missing BEM hooks, semantic HTML, labels, keyboard behavior, and active edge-rule compliance.
- Report unresolved specification or edge-rule conflicts rather than silently choosing a behavior.
