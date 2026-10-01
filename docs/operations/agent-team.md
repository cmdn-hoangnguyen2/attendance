# Project agent team

Approved by BOSS on 2026-10-01. This changes execution guidance only, not the
approved MVP scope or application architecture.

## Profiles

| Role | Model | Effort | Configured sandbox |
| --- | --- | --- | --- |
| Scout | gpt-5.6-sol | high | read-only |
| Architect | gpt-6-astra | high | read-only |
| Builder (Writer 1-3) | gpt-6.1-sol | high | workspace-write |
| Challenger (reviewer-coordinator) | gpt-6-astra | medium | read-only |

Profiles live in `.codex/agents/*.toml` in this worktree, not global Codex config.
No nickname, dependency, provider, secret, relaxed approval or extra writable-root
setting is added. Parent runtime permission overrides still apply.

## Authority and routing

The controller coordinates; it does not consume a subagent profile.
Read the approved spec/package plan and latest ledger before dispatch. Keep
`docs/superpowers/plans/2026-09-30-mvp-hardening.md` and its A-H dependencies.
Do not repeat completed work or replace the master plan with a new architecture.

The target execution team is three code writers and one reviewer-coordinator.
Writers reuse the Builder profile with distinct task identities; no duplicate profile
files are required. Scout and Architect remain optional consultants, not mandatory
stages or additional continuously running workers.

1. Reviewer-coordinator prepares a task queue from the approved plan/current ledger:
   task ID, proposed writer, exclusive files, dependencies, checks and stop point.
   Controller validates that queue and performs actual dispatch/ownership changes.
2. Dispatch Scout only when repository facts are missing.
3. Dispatch Architect only when a material solution decision is unresolved.
   An adequate approved contract proceeds directly to Builder.
4. Give each Builder one bounded milestone and exclusive file ownership.
5. Freeze the implementation and dispatch Challenger with the task-scoped diff.
6. Send concrete findings back to its Builder, then request scoped re-review.
7. Controller verifies required evidence, records status and checkpoints the result.
   Review PASS is not automatically DONE, package acceptance, merge or deployment.

Four target workers do not mean four simultaneous children. This session supports
three active subagents plus the controller; saved config cannot override that cap.
Use up to three Sol writers for a genuinely independent authoring batch. When a
writer hands off, schedule the reviewer-coordinator in the freed slot, allowing
the other two writers to continue. Prefer two writers plus reviewer when review
would otherwise queue up; use fewer writers when dependencies require it.
A completed child is not proof a fresh allocation will succeed: respect actual
thread-limit errors. Do not keep idle agents running just to fill slots or claim
four simultaneous workers. Dependent stages and shared-file writes stay serialized.

## Dispatch and durable handoff

A brief supplies: task ID, worktree/base, approved spec/contract pointer, exact owned
files, protected/shared files, interface constraints, verification commands,
acceptance gates, report destination and stop point. Reference artifact paths;
do not paste the whole conversation or every previous report into each dispatch.

Use the existing package-specific `.superpowers/sdd/<plan>/` ledger and artifacts.
The controller saves read-only agent reports. A report carries changed paths,
facts/unknowns, exact commands/results, deviations and remaining evidence gates.
No tokens, cookies, keys, personal-account data or full environment output in reports.

One writer per file. Builder owns implementation; Challenger never writes fixes.
BOSS approved up to three concurrent Builders for disjoint milestones. Every code
writer must use gpt-6.1-sol/high; no silent model substitution when allocation fails.
Overlap authoring only when files and load-bearing dependencies are independent.
Run covering checks and independent acceptance per slice, then combined checks at
integration. Do not accept an integration before its dependencies pass.
The reviewer-coordinator owns read-only review/task-distribution proposals, not
code corrections, actual dispatch or shared-file writes. Prioritize a frozen slice
and its concrete findings before planning more authoring; follow the critical path.
Historical exception: BOSS temporarily allowed an existing Astra Medium endpoint
writer after Sol allocation failed. That exception is now revoked for future work;
retain its genuine endpoint report/model history rather than relabeling past work.
Controller alone manages Git, shared config/interfaces/docs, Docker, test targets,
resets and external configuration unless the human explicitly changes authority.
If Builder writes stall, stop the pending writer before controller applies a
worker-authored patch; preserve saved work and obtain independent review afterward.

## Project boundaries

- Business authority comes from approved `docs/`, never invented requirements.
- Keep white Cobalt Commons, Vietnamese-first UI and existing spacing conventions;
  only approved contrast/accessibility/behavior fixes, no second redesign.
- No production mocks or mock-auth bypass. Test doubles remain test-only.
- Auth0 namespaced claims supply global roles; subject is a string, not a UUID.
- Maintain scoped RLS/realtime, private Storage, active lifecycle checks,
  positive integer VND, full payment and append-only financial/audit records.
- Preserve `Archive this room`, `Archive this user` and
  `I agree to remove this user`; trim outer whitespace only.
- No extra agents or browser subagents. Native browser verification stays with
  the controller; no infrastructure mutation or remote reset delegated.

## Verification and stalled calls

For logic changes, RED must exercise the actual helper/API/SQL, then GREEN.
Do not repeat identical checks unless code changed, evidence is unreliable or a
specific independent diagnostic requires it. Controller runs combined checks at
the milestone handoff. Missing infrastructure or credentials remains visible;
unit success is not genuine auth/SQL/Storage/realtime/runtime acceptance.

Report a concrete artifact/result or blocker promptly, then at least every three
minutes when tools allow. A pending tool can prevent messages: this is not evidence
that an agent is progressing. After five minutes without evidence, controller asks
for a checkpoint; after ten it inspects, interrupts if needed and reduces scope.
Earlier interruption is appropriate for a known stalled call. Never retry blindly,
bypass a denied approval or erase saved work. These are escalation thresholds,
not completion deadlines. After three unsuccessful fix/re-review rounds, controller
checks the contract and reduces the slice; no endless automated fix loop.

Challenger returns both spec and quality verdicts plus PASS, CHANGES_REQUIRED or
UNVERIFIED. Controller marks DONE only when all required milestone gates pass.
A wider runtime gate may remain pending only if the bounded contract explicitly
assigns it to a later milestone; keep that distinction in the ledger.

## Activation and compatibility

Official docs describe automatic discovery of standalone project agent TOML files.
Parse/model mapping checks prove saved configuration, not live model assignment.
Existing children retain their original settings; writing profiles does not switch
their model. Verify discovery in a new compatible project session before claiming
these profiles were loaded; do not restart the app or destroy active work automatically.

When the current dispatch API lacks custom-role selection, the controller can pass
the exact model/effort and role instructions explicitly on a fresh child. Such a
dispatch is a prompt/model fallback, not proof that the profile sandbox was loaded.
Do not claim read-only enforcement beyond the actual inherited tool permissions.
A model change requires a supported fresh dispatch, not merely messaging an old
child or changing the parent composer. Respect actual thread limits; no silent
fallback to a different model if allocation fails.

## References

- [Official custom-agent configuration](https://learn.chatgpt.com/docs/agent-configuration/subagents#custom-agents)
- [Official configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)
