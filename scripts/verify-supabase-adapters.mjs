import { createClient } from "@supabase/supabase-js";
import { SupabaseRoomRepository, SupabaseMembershipRepository, SupabaseJoinRequestRepository } from "../src/modules/rooms/infrastructure/supabase-room-repository.ts";
import { SupabaseMeetingSessionRepository, SupabaseAttendanceRepository } from "../src/modules/meetings/infrastructure/supabase-meeting-repository.ts";
import { SupabaseFundContributionRepository, SupabasePaymentRepository, SupabaseRoomPaymentImageRepository } from "../src/modules/funds/infrastructure/supabase-fund-repository.ts";
import { SupabaseUserRepository, SupabaseAuditLogRepository } from "../src/modules/admin/infrastructure/supabase-admin-repository.ts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

const roomRepo = new SupabaseRoomRepository(client);
const memRepo = new SupabaseMembershipRepository(client);
const joinRepo = new SupabaseJoinRequestRepository(client);
const meetingRepo = new SupabaseMeetingSessionRepository(client);
const attendanceRepo = new SupabaseAttendanceRepository(client);
const fundRepo = new SupabaseFundContributionRepository(client);
const paymentRepo = new SupabasePaymentRepository(client);
const imageRepo = new SupabaseRoomPaymentImageRepository(client);
const userRepo = new SupabaseUserRepository(client);
const auditRepo = new SupabaseAuditLogRepository(client);

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
console.log("  VERIFYING SPRINT 6: SUPABASE ADAPTERS (LIVE DB)      ");
console.log("=======================================================\n");

async function run() {
  try {
    // 1. User Repository
    console.log("1. Testing UserRepository...");
    const users = await userRepo.listAll();
    assert(users.length >= 5, `Fetched ${users.length} active users from Supabase`);
    const admin = await userRepo.findByEmail("nvhoang2012002@gmail.com");
    assert(admin !== null && admin.role === "admin", "Admin user found by email with role 'admin'");

    // 2. Room Repository
    console.log("\n2. Testing RoomRepository...");
    const rooms = await roomRepo.findCatalog();
    assert(rooms.length >= 2, `Fetched ${rooms.length} active rooms from Supabase`);
    const engineeringRoom = rooms.find(r => r.name === "Engineering Daily");
    assert(engineeringRoom !== undefined, "Found 'Engineering Daily' room");
    assert(typeof engineeringRoom?.memberCount === "number" && (engineeringRoom?.memberCount ?? 0) >= 2, `Calculated dynamic memberCount: ${engineeringRoom?.memberCount}`);

    // 3. Membership Repository
    console.log("\n3. Testing MembershipRepository...");
    if (engineeringRoom) {
      const memberships = await memRepo.findByRoomId(engineeringRoom.id);
      assert(memberships.length >= 2, `Found ${memberships.length} memberships for room`);
    }

    // 4. Meeting & Attendance
    console.log("\n4. Testing MeetingSession & Attendance Repositories...");
    if (engineeringRoom) {
      const sessions = await meetingRepo.findByRoomId(engineeringRoom.id);
      assert(sessions.length >= 1, `Found ${sessions.length} meeting sessions for room`);
      if (sessions.length > 0) {
        const attendance = await attendanceRepo.findBySessionId(sessions[0].id);
        assert(Array.isArray(attendance), `Attendance query returned array (${attendance.length} records)`);
      }
    }

    // 5. Fund & Payment Repository
    console.log("\n5. Testing FundContribution, Payment & Image Repositories...");
    if (engineeringRoom) {
      const funds = await fundRepo.findByRoomId(engineeringRoom.id);
      assert(funds.length >= 1, `Found ${funds.length} fund contributions for room`);
      if (funds.length > 0) {
        assert(Number.isInteger(funds[0].amount), `Amount is integer VND: ${funds[0].amount}`);
        const payment = await paymentRepo.findByContributionId(funds[0].id);
        assert(payment === null || Number.isInteger(payment.amount), "Payment lookup works");
      }
      const image = await imageRepo.findByRoomId(engineeringRoom.id);
      assert(image === null || typeof image.storagePath === "string", "Payment image lookup works");
      const joinRequests = await joinRepo.findByRoomId(engineeringRoom.id);
      assert(Array.isArray(joinRequests), `Join requests lookup returned array (${joinRequests.length})`);
    }

    // 6. Audit Logs
    console.log("\n6. Testing AuditLogRepository...");
    const audits = await auditRepo.listRecent(10);
    assert(audits.length >= 1, `Fetched ${audits.length} audit logs from Supabase`);

    console.log("\n=======================================================");
    console.log(`  ADAPTER RESULTS: ${passed} PASSED, ${failed} FAILED  `);
    console.log("=======================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Adapter test encountered error:", err);
    process.exit(1);
  }
}

run();
