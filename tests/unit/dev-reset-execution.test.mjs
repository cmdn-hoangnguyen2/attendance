import assert from "node:assert/strict";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";

import { buildResetManifest, resetVerifiedTarget } from "../../scripts/devReset.mjs";

const inputs = { mode: "linked", environment: "development", linkedRef: "abcdefghijklmnopqrst", expectedRef: "abcdefghijklmnopqrst", productionRef: "zyxwvutsrqponmlkjihg", supabaseUrl: "https://abcdefghijklmnopqrst.supabase.co", acknowledgement: "DELETE DEV DATA" };

function boundaryFixture(options = {}) {
  const effects = [];
  const files = new Map([["", Array.from({ length: 102 }, (_, index) => ({ name: `file-${index}`, id: `id-${index}` })).concat({ name: "nested", id: null })], ["nested", [{ name: "qr.png", id: "qr" }]]]);
  let reset = false;
  const client = {
    from: () => ({ select: (columns, queryOptions) => {
      assert.equal(columns, "id");
      assert.deepEqual(queryOptions, { count: "exact", head: false });
      return { limit: async (limit) => {
        assert.equal(limit, 0);
        return { count: reset ? (options.nonemptyAfter ? 1 : 0) : 2, error: options.absentBefore && !reset ? { code: "PGRST205" } : null };
      } };
    } }),
    storage: {
      getBucket: async () => options.absentBucketBefore && !reset ? { data: null, error: { statusCode: "404" } } : { data: { id: "payment-images", public: Boolean(options.publicAfter && reset) }, error: null },
      from: () => ({
        list: async (prefix, { limit, offset }) => {
          effects.push(["list", prefix, offset]);
          if (options.listFailure) return { data: null, error: { message: "secret" } };
          if (reset && options.residualAfter) return { data: [{ name: "new.png", id: "new" }], error: null };
          if (options.absentBucketBefore) return { data: [], error: null };
          return { data: (files.get(prefix) ?? []).slice(offset, offset + limit), error: null };
        },
        remove: async (paths) => {
          effects.push(["remove", ...paths]);
          if (options.removeFailure) return { error: { message: "secret" } };
          if (!options.residual) for (const [prefix, entries] of files) files.set(prefix, entries.filter((entry) => !paths.includes(prefix ? `${prefix}/${entry.name}` : entry.name)));
          return { error: null };
        },
      }),
    },
  };
  return {
    effects,
    boundaries: {
      environment: { SUPABASE_SERVICE_ROLE_KEY: "secret-key" },
      discoverInputs: () => ({ ...inputs, ...options.drift }),
      createClient: () => { effects.push(["client"]); return client; },
      spawn: (executable, args, settings) => { effects.push(["reset", executable, args, settings.cwd]); reset = true; return { status: options.resetFailure ? 1 : 0, stdout: "secret", stderr: "secret" }; },
    },
  };
}

for (const [name, drift] of [
  ["changed link", { linkedRef: "zyxwvutsrqponmlkjihg" }],
  ["production", { environment: "production" }],
  ["missing acknowledgement", { acknowledgement: "" }],
  ["changed origin", { supabaseUrl: "https://zyxwvutsrqponmlkjihg.supabase.co" }],
  ["changed production exclusion", { productionRef: "aaaaaaaaaaaaaaaaaaaa" }],
  ["valid but changed target", { expectedRef: "aaaaaaaaaaaaaaaaaaaa", linkedRef: "aaaaaaaaaaaaaaaaaaaa", supabaseUrl: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co" }],
]) test(`fresh ${name} prevents all external effects`, async () => {
  const fixture = boundaryFixture({ drift });
  await assert.rejects(resetVerifiedTarget(buildResetManifest(inputs), fixture.boundaries));
  assert.deepEqual(fixture.effects, []);
});

test("missing service key prevents all external effects", async () => {
  const fixture = boundaryFixture();
  fixture.boundaries.environment = {};
  await assert.rejects(resetVerifiedTarget(buildResetManifest(inputs), fixture.boundaries));
  assert.deepEqual(fixture.effects, []);
});

test("enumerates nested paginated blobs before batch removal, binds canonical CLI and sanitizes evidence", async () => {
  const fixture = boundaryFixture({ absentBefore: true });
  const manifest = buildResetManifest(inputs);
  manifest.command = { executable: "evil", args: ["delete"] };
  manifest.tables = ["evil"];
  manifest.buckets = ["evil"];
  const evidence = await resetVerifiedTarget(manifest, fixture.boundaries);
  const removes = fixture.effects.filter(([operation]) => operation === "remove");
  assert.equal(removes.flatMap(([, ...paths]) => paths).length, 103);
  assert.ok(removes.flatMap(([, ...paths]) => paths).includes("nested/qr.png"));
  const firstRemove = fixture.effects.findIndex(([operation]) => operation === "remove");
  assert.ok(fixture.effects.slice(0, firstRemove).some(([operation, prefix, offset]) => operation === "list" && prefix === "" && offset === 100));
  const reset = fixture.effects.find(([operation]) => operation === "reset");
  assert.equal(reset[1], "pnpm");
  assert.deepEqual(reset[2], ["dlx", "supabase@2.118.0", "db", "reset", "--linked", "--no-seed", "--project-ref", "abcdefghijklmnopqrst"]);
  assert.equal(evidence.before.tables.users, null);
  assert.equal(evidence.after.tables.users, 0);
  assert.equal(evidence.after.storage.objects, 0);
  assert.equal(JSON.stringify(evidence).includes("secret"), false);
  assert.equal(JSON.stringify(evidence).includes("evil"), false);
});

for (const failure of ["listFailure", "removeFailure", "residual"]) test(`${failure} blocks database reset`, async () => {
  const fixture = boundaryFixture({ [failure]: true });
  await assert.rejects(resetVerifiedTarget(buildResetManifest(inputs), fixture.boundaries), (error) => !error.message.includes("secret"));
  assert.equal(fixture.effects.some(([operation]) => operation === "reset"), false);
});

test("database reset failure is propagated without CLI diagnostics", async () => {
  const fixture = boundaryFixture({ resetFailure: true });
  await assert.rejects(resetVerifiedTarget(buildResetManifest(inputs), fixture.boundaries), /Database reset failed/);
});

test("uninitialized bucket is recorded as absent, and reset must create private empty bucket", async () => {
  const fixture = boundaryFixture({ absentBucketBefore: true });
  const evidence = await resetVerifiedTarget(buildResetManifest(inputs), fixture.boundaries);
  assert.deepEqual(evidence.before.storage, { present: false, private: null, objects: null });
  assert.deepEqual(evidence.after.storage, { present: true, private: true, objects: 0 });
});

for (const failure of ["residualAfter", "nonemptyAfter", "publicAfter"]) test(`${failure} rejects post-reset verification`, async () => {
  const fixture = boundaryFixture({ [failure]: true });
  await assert.rejects(resetVerifiedTarget(buildResetManifest(inputs), fixture.boundaries));
  assert.equal(fixture.effects.filter(([operation]) => operation === "reset").length, 1);
});

test("target drift after listing prevents the first removal and reset", async () => {
  const fixture = boundaryFixture();
  let discoveries = 0;
  fixture.boundaries.discoverInputs = () => ({ ...inputs, acknowledgement: ++discoveries === 1 ? "DELETE DEV DATA" : "" });
  await assert.rejects(resetVerifiedTarget(buildResetManifest(inputs), fixture.boundaries));
  assert.equal(fixture.effects.some(([operation]) => ["remove", "reset"].includes(operation)), false);
});

test("service client constructor exception never exposes its secret diagnostics", async () => {
  const fixture = boundaryFixture();
  fixture.boundaries.createClient = () => { throw new Error("secret-key"); };
  await assert.rejects(resetVerifiedTarget(buildResetManifest(inputs), fixture.boundaries), (error) => !error.message.includes("secret-key"));
});

test("real installed SDK preserves missing-table errors through zero-row GET counts during bootstrap", async () => {
  let reset = false;
  const requests = [];
  const fetch = async (url, init) => {
    const parsed = new URL(url);
    requests.push({ url: parsed, method: init.method, headers: init.headers });
    if (parsed.pathname.startsWith("/rest/v1/")) {
      if (!reset && init.method === "HEAD") return new Response(null, { status: 404 });
      if (!reset) return Response.json({ code: "PGRST205", message: "Missing table", details: null, hint: null }, { status: 404 });
      return Response.json([], { headers: { "content-range": "*/0" } });
    }
    if (parsed.pathname.includes("/storage/v1/bucket/")) return Response.json({ id: "payment-images", name: "payment-images", public: false });
    if (parsed.pathname.includes("/storage/v1/object/list/")) return Response.json([]);
    throw new Error("Unexpected SDK endpoint");
  };
  const client = createClient(inputs.supabaseUrl, "test-only-service-key", { global: { fetch }, auth: { persistSession: false, autoRefreshToken: false } });
  const head = await client.from("users").select("id", { count: "exact", head: true });
  assert.equal(head.status, 204);
  assert.equal(head.error, null);
  assert.equal(head.count, null);
  requests.length = 0;
  const evidence = await resetVerifiedTarget(buildResetManifest(inputs), {
    environment: { SUPABASE_SERVICE_ROLE_KEY: "test-only-service-key" },
    discoverInputs: () => inputs,
    createClient: () => client,
    spawn: () => { reset = true; return { status: 0 }; },
  });
  assert.equal(evidence.before.tables.users, null);
  assert.equal(evidence.after.tables.users, 0);
  const tableRequests = requests.filter(({ url }) => url.pathname.startsWith("/rest/v1/"));
  assert.equal(tableRequests.length, 30);
  for (const request of tableRequests) {
    assert.equal(request.method, "GET");
    assert.equal(request.url.searchParams.get("select"), "id");
    assert.equal(request.url.searchParams.get("limit"), "0");
    assert.match(new Headers(request.headers).get("prefer"), /count=exact/);
  }
});
