import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

console.log("\n=======================================================");
console.log("  VERIFYING SPRINT 5: SUPABASE SCHEMA & DOMAIN PORTS  ");
console.log("=======================================================\n");

// 1. Check Migration Files Existence
console.log("1. Checking SQL Migration Files...");
const migrationsDir = path.join(rootDir, "supabase", "migrations");
assert(fs.existsSync(migrationsDir), "supabase/migrations directory exists");

const migrationFiles = [
  "20260919000001_initial_schema.sql",
  "20260919000002_rls_policies.sql",
  "20260919000003_seed_data.sql",
  "20260919000004_storage_setup.sql",
];

for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  assert(fs.existsSync(filePath), `Migration file exists: ${file}`);
}

// 2. Check Schema Tables & Constraints in initial_schema.sql
console.log("\n2. Checking Table Definitions & Strict Constraints...");
const initialSql = fs.readFileSync(path.join(migrationsDir, "20260919000001_initial_schema.sql"), "utf-8");

const requiredTables = [
  "users",
  "rooms",
  "room_memberships",
  "join_requests",
  "meeting_sessions",
  "attendance_records",
  "fund_candidates",
  "fund_contributions",
  "payments",
  "room_payment_images",
  "audit_logs",
];

for (const table of requiredTables) {
  assert(initialSql.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `Table defined: ${table}`);
}

// Check Strict Domain Constraints from docs/
assert(
  initialSql.includes("amount INTEGER NOT NULL CHECK (amount > 0)"),
  "Money is stored as positive Integer VND (no floating point)"
);

assert(
  initialSql.includes("uq_room_payment_images_one_per_room UNIQUE (room_id)"),
  "Constraint enforces at most one payment image per room"
);

assert(
  initialSql.includes("file_size <= 5242880"),
  "Payment image has 5MB upper limit"
);

assert(
  initialSql.includes("mime_type IN ('image/jpeg', 'image/png', 'image/webp')"),
  "Payment image allows only JPEG, PNG, WebP (SVG rejected)"
);

assert(
  initialSql.includes("reason IN ('Đi trễ', 'Bận nhưng chưa xin phép', 'Khác')"),
  "Fund contribution reasons strictly match domain options"
);

assert(
  initialSql.includes("chk_reason_details_required"),
  "Reason 'Khác' strictly requires non-empty reason_details"
);

assert(
  initialSql.includes("enforce_append_only"),
  "Append-only protection function enforce_append_only() defined"
);

assert(
  initialSql.includes("trg_payments_enforce_append_only") &&
  initialSql.includes("trg_audit_logs_enforce_append_only"),
  "Triggers enforce append-only on payments and audit_logs"
);

// 3. Check RLS Policies
console.log("\n3. Checking Row Level Security (RLS) Policies...");
const rlsSql = fs.readFileSync(path.join(migrationsDir, "20260919000002_rls_policies.sql"), "utf-8");

for (const table of requiredTables) {
  assert(
    rlsSql.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`),
    `RLS enabled on table: ${table}`
  );
}

assert(rlsSql.includes("service_role_all_users"), "Service role bypass policies defined for server actions");

// 4. Check Storage Setup
console.log("\n4. Checking Storage Configuration...");
const storageSql = fs.readFileSync(path.join(migrationsDir, "20260919000004_storage_setup.sql"), "utf-8");
assert(storageSql.includes("'payment-images'"), "Bucket 'payment-images' defined");
assert(storageSql.includes("FALSE, -- Strictly private!"), "Bucket configured strictly as private");

// 5. Check Clean Architecture Domain Ports & Database Types
console.log("\n5. Checking Clean Architecture Domain Ports & Types...");
const filesToCheck = [
  "src/types/database.ts",
  "src/lib/supabase/client.ts",
  "src/lib/supabase/server.ts",
  "src/modules/rooms/domain/repository.ts",
  "src/modules/meetings/domain/repository.ts",
  "src/modules/funds/domain/repository.ts",
  "src/modules/admin/domain/repository.ts",
];

for (const file of filesToCheck) {
  assert(fs.existsSync(path.join(rootDir, file)), `Port/Type file exists: ${file}`);
}

// 6. Summary
console.log("\n=======================================================");
console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED  `);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All schema, persistence constraints, and Clean Architecture ports pass 100%!\n");
  process.exit(0);
}
