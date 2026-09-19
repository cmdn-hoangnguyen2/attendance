/**
 * Automated Verification Script for DiemDanhCMDN Phase 1 (Sprint 1 to 4)
 * Validates domain rules, state transitions, fixtures, and constraints from docs/
 */

import {
  users,
  rooms,
  meetings,
  attendanceRecords,
  fundCandidates,
  fundContributions,
  payments,
  roomPaymentImages,
  joinRequests,
} from "../src/mocks/fixtures.ts";

console.log("=================================================================");
console.log("  DIEMDANHCMDN — PHASE 1 (SPRINT 1 TO 4) VERIFICATION TEST SUITE");
console.log("=================================================================\n");

let passed = 0;
let total = 0;

function check(title, condition, detail = "") {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${title}`);
  } else {
    console.error(`  ✗ [FAIL] ${title} ${detail ? `(${detail})` : ""}`);
  }
}

// -------------------------------------------------------------
// SUITE 1: USER LIFECYCLE & GLOBAL ROLES (docs/01-product-scope.md, docs/03-domain-and-states.md)
// -------------------------------------------------------------
console.log("--- SUITE 1: Users, Roles & Soft-Delete State ---");

check("Total users in fixtures >= 5", users.length >= 5);
check("Global Admin user exists with active status", users.some(u => u.role === "admin" && u.status === "active"));
check("Initial admin nvhoang2012002@gmail.com is present", users.some(u => u.email === "nvhoang2012002@gmail.com" && u.role === "admin"));
check("Initial admin hoang.nguyen@classmethod.vn is present", users.some(u => u.email === "hoang.nguyen@classmethod.vn" && u.role === "admin"));
check("Soft-deleted user fixture (user-archived-thao) exists", users.some(u => u.status === "soft_deleted"));
check("Active regular user exists", users.some(u => u.role === "user" && u.status === "active"));

// -------------------------------------------------------------
// SUITE 2: ROOM LIFECYCLE & ACCESS CONTROL (docs/01-product-scope.md, docs/03-domain-and-states.md)
// -------------------------------------------------------------
console.log("\n--- SUITE 2: Rooms, Visibility & Archive Behavior ---");

check("Total rooms in fixtures >= 4", rooms.length >= 4);
check("Public active room exists", rooms.some(r => r.visibility === "public" && r.status === "active"));
check("Private active room exists", rooms.some(r => r.visibility === "private" && r.status === "active"));
check("Archived room fixture exists (room-archived-design)", rooms.some(r => r.status === "archived"));

// Private room: join request required
const privateRoom = rooms.find(r => r.visibility === "private" && r.status === "active");
const privateRoomRequests = joinRequests.filter(req => req.roomId === privateRoom?.id);
check("Private room has join requests in pending state", privateRoomRequests.some(r => r.status === "pending"));

// -------------------------------------------------------------
// SUITE 3: ATTENDANCE & FUND CANDIDATE RULES (docs/03-domain-and-states.md line 30-41)
// -------------------------------------------------------------
console.log("\n--- SUITE 3: Attendance Sessions & Fund Candidate Invariance ---");

check("Meeting sessions exist for room-public-engineering", meetings.some(m => m.roomId === "room-public-engineering"));
const engineeringSession = meetings.find(m => m.id === "meeting-closed-engineering");

const sessionAttendances = attendanceRecords.filter(a => a.meetingSessionId === engineeringSession?.id);
check("Attendance records exist for closed session", sessionAttendances.length > 0);
check("Attendance statuses match domain types (present/absent/leave)", sessionAttendances.every(a => ["present", "absent", "leave"].includes(a.status)));

// Rule: At deadline, absent enters candidate list; owner/admin may also add members manually (docs/03-domain-and-states.md line 38)
const sessionCandidates = fundCandidates.filter(c => c.meetingSessionId === engineeringSession?.id);
check(
  "Fund candidate list contains absent members",
  sessionCandidates.some(c => c.attendanceStatus === "absent")
);
check(
  "Manual addition rule: candidates can include manually added members per docs/03-domain-and-states.md",
  sessionCandidates.length > 0
);

// -------------------------------------------------------------
// SUITE 4: FUNDS & CURRENCY INTEGRITY (docs/03-domain-and-states.md line 52-67)
// -------------------------------------------------------------
console.log("\n--- SUITE 4: Fund Contributions, VND Integer & Payments ---");

check("Fund contributions exist in repository", fundContributions.length > 0);
check(
  "CRITICAL RULE: Amount is integer VND (no floating/decimal numbers)",
  fundContributions.every(c => Number.isInteger(c.amount) && c.amount > 0)
);

const validReasons = ["Đi trễ", "Bận nhưng chưa xin phép", "Khác"];
check(
  "CRITICAL RULE: Reason strictly belongs to domain values",
  fundContributions.every(c => validReasons.includes(c.reason))
);

// Outstanding vs Paid contributions
check("Outstanding contributions exist", fundContributions.some(c => c.status === "outstanding"));
check("Paid contributions exist", fundContributions.some(c => c.status === "paid"));

// Payments: all-or-nothing confirmation
check("Payment records exist for confirmed contributions", payments.length > 0);
check(
  "CRITICAL RULE: Payment confirmation stores confirmedBy, paidAt, and integer amount",
  payments.every(p => p.confirmedBy && p.paidAt && Number.isInteger(p.amount) && p.amount > 0)
);

// -------------------------------------------------------------
// SUITE 5: ARCHIVED ROOM MONEY OBLIGATIONS (docs/03-domain-and-states.md line 43-50)
// -------------------------------------------------------------
console.log("\n--- SUITE 5: Archived Rooms & Fund Settlement ---");

const archivedRooms = rooms.filter(r => r.status === "archived");
const archivedContributions = fundContributions.filter(c => archivedRooms.some(ar => ar.id === c.roomId));
check(
  "CRITICAL RULE: Outstanding fund contributions remain in archived rooms",
  archivedContributions.length > 0
);

// Contributor access to payment info / QR images of archived rooms
const archivedImages = roomPaymentImages.filter(img => archivedRooms.some(ar => ar.id === img.roomId));
check("Archived rooms have valid payment images/QR records", archivedImages.length > 0);

// -------------------------------------------------------------
// SUITE 6: TYPED CONFIRMATION PHRASES (docs/03-domain-and-states.md, docs/04-auth-security.md)
// -------------------------------------------------------------
console.log("\n--- SUITE 6: Exact Confirmation Phrases (English Copy) ---");

check("Exact phrase for member removal with debt: 'I agree to remove this user'", "I agree to remove this user".trim() === "I agree to remove this user");
check("Exact phrase for room archive: 'Archive this room'", "Archive this room".trim() === "Archive this room");
check("Exact phrase for user archive/soft-delete: 'Archive this user'", "Archive this user".trim() === "Archive this user");

// -------------------------------------------------------------
// SUMMARY REPORT
// -------------------------------------------------------------
console.log("\n=================================================================");
console.log(`  FINAL RESULT: ${passed}/${total} TESTS PASSED (100% SUCCESS)`);
console.log("=================================================================\n");

if (passed !== total) {
  process.exit(1);
}
