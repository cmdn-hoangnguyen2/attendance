# DiemDanhCMDN

DiemDanhCMDN is a mock-first Next.js application for group attendance and fund contribution management.

## Requirements

- Node.js
- pnpm 11

## Local development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Current phase

- UI foundation and deterministic mock data.
- No Auth0, Supabase, API, or Realtime integration yet.
- Product requirements and delivery gates live in [`docs/`](./docs/README.md).

## Project rules

- Follow [`AGENTS.md`](./AGENTS.md) and the approved documents in [`docs/`](./docs/).
- Use the 8-point grid for application spacing and radius values.
- Use Hugeicons as the only application icon source.
- Do not commit to `main` without explicit approval.
# attendance
