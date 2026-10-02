import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { assertDisposableTarget } from "../../scripts/devResetGuard.mjs";
import { buildResetManifest, runDevReset } from "../../scripts/devReset.mjs";

const safeLinked = {
  mode: "linked",
  environment: "development",
  linkedRef: "abcdefghijklmnopqrst",
  expectedRef: "abcdefghijklmnopqrst",
  productionRef: "zyxwvutsrqponmlkjihg",
  supabaseUrl: "https://abcdefghijklmnopqrst.supabase.co",
  acknowledgement: "DELETE DEV DATA",
};

const unsafeTargets = [
  ["production environment", { environment: "production" }],
  ["staging is not development", { environment: "staging" }],
  ["missing environment", { environment: "" }],
  ["production project", { productionRef: safeLinked.expectedRef }],
  ["linked project mismatch", { linkedRef: "zyxwvutsrqponmlkjihg" }],
  ["URL project mismatch", { supabaseUrl: "https://zyxwvutsrqponmlkjihg.supabase.co" }],
  ["missing linked project", { linkedRef: null }],
  ["missing expected project", { expectedRef: null }],
  ["missing production exclusion", { productionRef: null }],
  ["uppercase no-production declaration", { productionRef: "NONE" }],
  ["padded no-production declaration", { productionRef: " none " }],
  ["empty no-production declaration", { productionRef: "" }],
  ["placeholder project", { expectedRef: "your-project-ref" }],
  ["insecure remote URL", { supabaseUrl: "http://abcdefghijklmnopqrst.supabase.co" }],
  ["URL credentials", { supabaseUrl: "https://secret@abcdefghijklmnopqrst.supabase.co" }],
  ["lookalike domain", { supabaseUrl: "https://abcdefghijklmnopqrst.supabase.co.evil.test" }],
  ["URL path", { supabaseUrl: "https://abcdefghijklmnopqrst.supabase.co/rest/v1" }],
  ["URL query", { supabaseUrl: "https://abcdefghijklmnopqrst.supabase.co?token=secret" }],
  ["remote URL in local mode", { mode: "local" }],
  ["missing acknowledgement", { acknowledgement: "" }],
  ["incorrect acknowledgement", { acknowledgement: "DELETE ALL DATA" }],
  ["unknown mode", { mode: "production" }],
];

test("explicit none production declaration permits only fully verified development target", () => {
  assert.deepEqual(assertDisposableTarget({ ...safeLinked, productionRef: "none" }), { mode: "linked", projectRef: safeLinked.expectedRef });
});

for (const [name, overrides] of unsafeTargets) {
  if (Object.hasOwn(overrides, "productionRef")) continue;
  test(`no-production declaration still rejects ${name} before executor`, async () => {
    let calls = 0;
    await assert.rejects(runDevReset({ action: "execute", inputs: { ...safeLinked, productionRef: "none", ...overrides }, execute: async () => { calls += 1; } }));
    assert.equal(calls, 0);
  });
}

for (const [name, overrides] of unsafeTargets) {
  test(`reset rejects ${name} before any destructive executor call`, async () => {
    const inputs = { ...safeLinked, ...overrides };
    assert.throws(() => assertDisposableTarget(inputs));
    let calls = 0;
    await assert.rejects(runDevReset({
      action: "execute", inputs,
      execute: async () => { calls += 1; },
    }));
    assert.equal(calls, 0);
  });
}

test("verified linked target yields only mode and exact project ref", () => {
  assert.deepEqual(assertDisposableTarget(safeLinked), {
    mode: "linked", projectRef: "abcdefghijklmnopqrst",
  });
});

test("local guard permits CLI loopback origins but rejects arbitrary local services", () => {
  for (const supabaseUrl of ["http://127.0.0.1:54321", "http://localhost:54321", "http://[::1]:54321"]) {
    assert.deepEqual(assertDisposableTarget({ ...safeLinked, mode: "local", supabaseUrl }), {
      mode: "local", projectRef: null,
    });
  }
  for (const supabaseUrl of ["http://127.0.0.1:3000", "http://127.0.0.2:54321", "http://localhost.evil.test:54321"]) {
    assert.throws(() => assertDisposableTarget({ ...safeLinked, mode: "local", supabaseUrl }));
  }
});

test("manifest names exact business scope and reset flags without credentials", () => {
  const manifest = buildResetManifest(safeLinked);
  assert.deepEqual(manifest.command.args.slice(2, 6), ["db", "reset", "--linked", "--no-seed"]);
  const projectRefIndex = manifest.command.args.indexOf("--project-ref");
  assert.ok(projectRefIndex > 3);
  assert.equal(manifest.command.args[projectRefIndex + 1], safeLinked.expectedRef);
  const localManifest = buildResetManifest({ ...safeLinked, mode: "local", supabaseUrl: "http://127.0.0.1:54321" });
  assert.ok(localManifest.command.args.includes("--local"));
  assert.equal(localManifest.command.args.includes("--project-ref"), false);
  assert.ok(manifest.tables.includes("payments"));
  assert.ok(manifest.tables.includes("peer_debts"));
  assert.ok(manifest.tables.includes("app_notifications"));
  assert.ok(manifest.tables.includes("peer_payments"));
  assert.ok(manifest.tables.includes("user_payment_images"));
  assert.equal(manifest.tables.includes("channels"), false);
  assert.deepEqual(manifest.buckets, ["payment-images"]);
  assert.equal(manifest.projectRef, "abcdefghijklmnopqrst");
  assert.equal(JSON.stringify(manifest).includes("DELETE DEV DATA"), false);
});

test("read-only plan never invokes destructive executor and does not need acknowledgement", async () => {
  let calls = 0;
  const manifest = await runDevReset({
    action: "plan", inputs: { ...safeLinked, acknowledgement: "" },
    execute: async () => { calls += 1; },
  });
  assert.equal(manifest.mode, "linked");
  assert.equal(calls, 0);
});

test("execution freshly rejects acknowledgement missing after a valid plan", async () => {
  const inputs = { ...safeLinked, acknowledgement: "" };
  await runDevReset({ action: "plan", inputs });
  await assert.rejects(runDevReset({ action: "execute", inputs }));
});

test("verified execution passes only a fresh manifest to executor exactly once", async () => {
  const manifests = [];
  const result = await runDevReset({
    action: "execute", inputs: safeLinked,
    execute: async (manifest) => { manifests.push(manifest); return { verified: true }; },
  });
  assert.equal(manifests.length, 1);
  assert.equal(manifests[0].projectRef, "abcdefghijklmnopqrst");
  assert.deepEqual(result, { verified: true });
});

test("CLI fails closed on unknown arguments without leaking secret environment values", () => {
  const result = spawnSync(process.execPath, ["scripts/devReset.mjs", "--execute", "--force"], {
    cwd: new URL("../../", import.meta.url), encoding: "utf8",
    env: { ...process.env, SUPABASE_SERVICE_ROLE_KEY: "sentinel-secret-never-print" },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid reset arguments/);
  assert.equal((result.stdout + result.stderr).includes("sentinel-secret-never-print"), false);
});
