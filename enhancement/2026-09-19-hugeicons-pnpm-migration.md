# Hugeicons and pnpm migration

## Thời gian

2026-09-19 16:41:15 +07

## Feature

UI foundation — package manager and icon source.

## Lý do change

The project previously used npm and declared Tabler Icons while the approved UI foundation requires pnpm and Hugeicons as the single application icon source.

## Cách thức change

- Convert the dependency lockfile from npm to pnpm.
- Pin the repository package manager to pnpm 11.19.0.
- Remove `@tabler/icons-react`.
- Add `@hugeicons/react` as the React renderer and `@hugeicons/core-free-icons` as the icon data package.
- Document the prohibition on Lucide, emoji, custom/default SVG icon sources, and require accessible names for icon-only controls.

## Scope ảnh hưởng

- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json` (removed)
- `docs/06-ui-mock-phase.md`

No application component, layout, styling, or mock repository behavior changes in this feature.

## Lợi ích

- One reproducible package-management workflow.
- One explicit icon source, preventing inconsistent visual language.
- Clear accessibility requirement for icon-only controls.
