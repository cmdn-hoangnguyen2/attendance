# Development reset

Only explicitly configured development data is disposable. Production is excluded.

Set process environment values (the script does not automatically load `.env.local`):

| Variable | Required value |
| --- | --- |
| `APP_ENVIRONMENT` | Exactly `development` |
| `NEXT_PUBLIC_SUPABASE_URL` | Actual local CLI origin or exact linked Supabase HTTPS origin |
| `DEV_RESET_PROJECT_REF` | Actual approved development project ref, required for linked mode |
| `PRODUCTION_PROJECT_REF` | Actual production ref, or exact `none` only when no production project exists; required explicitly for linked mode |
| `DEV_RESET_ACKNOWLEDGEMENT` | Exactly `DELETE DEV DATA`, process-only during execution |

Do not save acknowledgement, tokens, keys or passwords in a plan or committed environment file. Project refs are identifiers, not credentials.

`PRODUCTION_PROJECT_REF=none` records BOSS's explicit declaration that no production project exists. It does not waive development environment, exact expected/linked/URL matching or acknowledgement checks. Missing, empty, uppercase `NONE` and whitespace-padded values are rejected. When production is created, replace `none` with its actual ref before any later reset.

Run `node scripts/devReset.mjs --plan --local` or `--plan --linked`. A plan is read-only and needs no acknowledgement. Local discovery reads `supabase status --output json` and compares its actual API origin with configuration. Linked discovery reads this repository's `supabase/.temp/project-ref` and requires expected ref, linked ref and URL ref to match. No ref is inferred from an example URL; staging and ambiguous targets are rejected.

Commands use the approved pinned CLI `pnpm dlx supabase@2.118.0`, with argument arrays and repository working directory. CLI diagnostic output is captured and never printed, since status may contain credentials.

The manifest lists all 15 application business tables and the private `payment-images` bucket. Its database command uses `db reset --local|--linked --no-seed`. Database reset can affect other user-created schema objects in that database; the business-table list describes application verification scope, not a selective SQL deletion. A database reset alone cannot prove Storage blobs are gone.

Execution uses fresh inputs and requires acknowledgement again, plus process-only `SUPABASE_SERVICE_ROLE_KEY` with no fallback. The executor rediscovers the target before each Storage removal batch and immediately before the database command. It rejects changes to mode, origin or linked reference contract. A saved plan is never execution approval. Do not bypass the guard by running its manifest command manually.

Run `node scripts/devReset.mjs --execute --local` or `--execute --linked` with the exact process acknowledgement. Linked execution explicitly binds `--project-ref` to the freshly verified development ref. Only the operator authorized to discard this exact development target should execute it.

The executor reads counts for all 15 tables, records missing pre-reset tables as `null`, and checks the private bucket. It recursively enumerates folders in pages of 100 and snapshots all exact blob paths before any deletion, then removes batches of 100. A list/removal error or remaining blob blocks database reset. It verifies physical Storage listings are empty both before and after database reset. A missing pre-reset bucket is recorded as absent with `null` object count; the post-reset bucket must exist, be private and contain zero objects. All post-reset tables must exist with exact count zero. CLI/SDK diagnostic strings are suppressed to protect credentials; failures exit nonzero.

Successful evidence includes target origin/ref, command, timestamps and before/after table/Storage counts. Keep that sanitized evidence and run the separate baseline database assertions to verify functions, triggers, RLS and Realtime publication. The executor count checks alone do not prove these schema properties. Development data erased by reset or Storage removal is not recoverable unless an external backup exists. No initial product record is seeded; create records through authenticated product flows.
