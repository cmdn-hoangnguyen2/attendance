import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { assertDisposableTarget } from "./devResetGuard.mjs";

const CLI_ARGS = ["dlx", "supabase@2.118.0"];
const REPO_ROOT = new URL("../", import.meta.url);
const BUSINESS_TABLES = ["users", "rooms", "room_memberships", "join_requests", "meeting_sessions", "attendance_records", "fund_candidates", "fund_contributions", "payments", "room_payment_images", "audit_logs", "app_notifications", "peer_debts", "peer_payments", "user_payment_images"];

export function buildResetManifest(inputs, { action = "execute" } = {}) {
  const target = assertDisposableTarget({ ...inputs, acknowledgement: action === "plan" ? "DELETE DEV DATA" : inputs.acknowledgement });
  return {
    ...target,
    environment: inputs.environment,
    supabaseOrigin: new URL(inputs.supabaseUrl).origin,
    refs: target.mode === "linked" ? { expected: inputs.expectedRef, linked: inputs.linkedRef, production: inputs.productionRef } : null,
    timestamp: new Date().toISOString(),
    tables: [...BUSINESS_TABLES],
    buckets: ["payment-images"],
    command: { executable: "pnpm", args: [...CLI_ARGS, "db", "reset", `--${target.mode}`, "--no-seed", ...(target.mode === "linked" ? ["--project-ref", target.projectRef] : [])] },
    scope: "Database reset recreates the application schema; Storage objects require a separate verified cleanup.",
  };
}

export async function resetVerifiedTarget(manifest, {
  environment = process.env,
  discoverInputs = discoverResetInputs,
  createClient: connect = createClient,
  spawn = spawnSync,
} = {}) {
  const key = environment.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof key !== "string" || !key.trim()) throw new Error("Reset requires the process-only SUPABASE_SERVICE_ROLE_KEY.");
  const freshManifest = () => {
    const inputs = discoverInputs({ mode: manifest.mode, environment });
    const fresh = buildResetManifest(inputs);
    if (fresh.mode !== manifest.mode || fresh.projectRef !== manifest.projectRef || fresh.supabaseOrigin !== manifest.supabaseOrigin || JSON.stringify(fresh.refs) !== JSON.stringify(manifest.refs)) {
      throw new Error("Reset target changed since planning; aborting.");
    }
    return fresh;
  };
  const canonical = freshManifest();
  let client;
  try { client = connect(canonical.supabaseOrigin, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }); }
  catch { throw new Error("Unable to initialize the reset service client."); }
  const bucket = client.storage.from("payment-images");

  async function tableCounts(requirePresent) {
    const counts = {};
    for (const table of canonical.tables) {
      // HEAD loses a missing-table404 body in the SDK; zero-row GET preserves PGRST205.
      const { count, error } = await client.from(table).select("id", { count: "exact", head: false }).limit(0);
      if (error && !requirePresent && ["PGRST205", "42P01"].includes(error.code)) { counts[table] = null; continue; }
      if (error || !Number.isInteger(count) || count < 0) throw new Error("Unable to verify business table counts.");
      if (requirePresent && count !== 0) throw new Error("Business records remain after database reset.");
      counts[table] = count;
    }
    return counts;
  }

  async function storageState(requirePresent) {
    const { data, error } = await client.storage.getBucket("payment-images");
    if (error && !requirePresent && String(error.statusCode ?? error.status) === "404") return { present: false, private: null, paths: null };
    if (error || !data || data.id !== "payment-images" || data.public !== false) throw new Error("Payment Storage bucket must exist and remain private.");
    const paths = [];
    async function visit(prefix) {
      for (let offset = 0; ; offset += 100) {
        const { data: entries, error: listError } = await bucket.list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
        if (listError || !Array.isArray(entries)) throw new Error("Unable to enumerate payment Storage objects.");
        for (const entry of entries) {
          if (typeof entry.name !== "string" || !entry.name || [".", ".."].includes(entry.name) || entry.name.includes("/")) throw new Error("Storage returned an invalid object path.");
          const path = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.id === null) await visit(path);
          else if (typeof entry.id === "string" && entry.id) paths.push(path);
          else throw new Error("Storage returned an ambiguous object entry.");
        }
        if (entries.length < 100) break;
      }
    }
    await visit("");
    return { present: true, private: true, paths };
  }

  try {
    const beforeTables = await tableCounts(false);
    const beforeStorage = await storageState(false);
    // Snapshot all object paths before deleting; live paginated offsets would skip shifted entries.
    const paths = beforeStorage.paths ?? [];
    for (let offset = 0; offset < paths.length; offset += 100) {
      freshManifest();
      const { error } = await bucket.remove(paths.slice(offset, offset + 100));
      if (error) throw new Error("Payment Storage cleanup failed; database reset was not started.");
    }
    const cleanedStorage = await storageState(false);
    if (cleanedStorage.paths?.length) throw new Error("Payment Storage objects remain; database reset was not started.");
    const verified = freshManifest();
    const result = spawn(verified.command.executable, verified.command.args, { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120000 });
    if (result.error || result.status !== 0) throw new Error("Database reset failed; inspect local CLI diagnostics privately.");
    const afterTables = await tableCounts(true);
    const afterStorage = await storageState(true);
    if (afterStorage.paths.length) throw new Error("Payment Storage objects remain after database reset.");
    const summarize = (state) => ({ present: state.present, private: state.private, objects: state.paths === null ? null : state.paths.length });
    return {
      mode: canonical.mode, projectRef: canonical.projectRef, supabaseOrigin: canonical.supabaseOrigin,
      startedAt: canonical.timestamp, completedAt: new Date().toISOString(),
      command: verified.command,
      before: { tables: beforeTables, storage: summarize(beforeStorage) },
      after: { tables: afterTables, storage: summarize(afterStorage) },
    };
  } catch (error) {
    // Never forward transport/SDK exceptions: they may contain keys, URLs or CLI diagnostics.
    const safeMessages = ["Unable to verify business table counts.", "Business records remain after database reset.", "Payment Storage bucket must exist and remain private.", "Unable to enumerate payment Storage objects.", "Storage returned an invalid object path.", "Storage returned an ambiguous object entry.", "Payment Storage cleanup failed; database reset was not started.", "Payment Storage objects remain; database reset was not started.", "Database reset failed; inspect local CLI diagnostics privately.", "Payment Storage objects remain after database reset.", "Reset target changed since planning; aborting."];
    if (safeMessages.includes(error.message)) throw error;
    throw new Error("Reset verification or cleanup failed; operation stopped. Inspect diagnostics privately.");
  }
}

export async function runDevReset({ action, inputs, execute }) {
  if (!["plan", "execute"].includes(action)) throw new Error("Invalid reset action.");
  const manifest = buildResetManifest(inputs, { action });
  if (action === "plan") return manifest;
  if (!execute) throw new Error("Reset executor is not ready; A2 Storage cleanup and post-reset verification must be integrated first.");
  return execute(manifest);
}

function cliJson(args) {
  const result = spawnSync("pnpm", [...CLI_ARGS, ...args, "--output", "json"], { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60000 });
  if (result.error || result.status !== 0) throw new Error("Supabase read-only target verification failed; check CLI installation, login and local services.");
  try { return JSON.parse(result.stdout); } catch { throw new Error("Supabase target verification returned invalid metadata."); }
}

export function discoverResetInputs({ mode, environment = process.env }) {
  const inputs = {
    mode, environment: environment.APP_ENVIRONMENT,
    expectedRef: environment.DEV_RESET_PROJECT_REF,
    productionRef: environment.PRODUCTION_PROJECT_REF,
    supabaseUrl: environment.NEXT_PUBLIC_SUPABASE_URL,
    acknowledgement: environment.DEV_RESET_ACKNOWLEDGEMENT,
    linkedRef: null,
  };
  // Validate configured values before invoking even read-only tooling.
  if (mode === "linked") {
    try { inputs.linkedRef = readFileSync(new URL("supabase/.temp/project-ref", REPO_ROOT), "utf8").trim(); }
    catch { throw new Error("No linked Supabase project metadata; explicitly link the approved development target first."); }
  }
  assertDisposableTarget({ ...inputs, acknowledgement: "DELETE DEV DATA" });
  if (mode === "local") {
    const status = cliJson(["status"]);
    if (!status.API_URL) throw new Error("CLI status did not identify the local API URL.");
    assertDisposableTarget({ ...inputs, supabaseUrl: status.API_URL, acknowledgement: "DELETE DEV DATA" });
    if (new URL(status.API_URL).origin !== new URL(inputs.supabaseUrl).origin) throw new Error("Configured local URL differs from actual CLI status.");
    return inputs;
  }
  return inputs;
}

async function main() {
  const args = process.argv.slice(2);
  const actionFlags = args.filter((value) => ["--plan", "--execute"].includes(value));
  const modeFlags = args.filter((value) => ["--local", "--linked"].includes(value));
  if (args.length !== 2 || actionFlags.length !== 1 || modeFlags.length !== 1) throw new Error("Invalid reset arguments. Use --plan|--execute and --local|--linked.");
  const inputs = discoverResetInputs({ mode: modeFlags[0].slice(2) });
  const result = await runDevReset({ action: actionFlags[0].slice(2), inputs, execute: resetVerifiedTarget });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
