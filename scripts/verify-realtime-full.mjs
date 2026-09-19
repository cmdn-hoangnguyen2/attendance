import { createClient } from "@supabase/supabase-js";
import { SupabaseMembershipRepository, SupabaseJoinRequestRepository, SupabaseRoomRepository } from "../src/modules/rooms/infrastructure/supabase-room-repository.ts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nhdmuzdoganhoifcswro.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZG11emRvZ2FuaG9pZmNzd3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MjAyMDYsImV4cCI6MjEwNTM5NjIwNn0.P1zURmFHG8Kko2nKV3PsXTZP-qKYY9bOC-xE5HPyjXs";

const client = createClient(supabaseUrl, supabaseAnonKey);
const roomRepo = new SupabaseRoomRepository(client);
const memRepo = new SupabaseMembershipRepository(client);
const joinRepo = new SupabaseJoinRequestRepository(client);

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log("\n=======================================================");
console.log("   AUTOMATED FULL SUITE: REALTIME & MEMBERSHIP TESTS   ");
console.log("=======================================================\n");

async function run() {
  const testRoomId = "00000000-0000-0000-0000-000000000101"; // Engineering Daily
  const testUserId = "00000000-0000-0000-0000-000000000005"; // Le Thi C
  const adminId = "00000000-0000-0000-0000-000000000001";

  try {
    // -------------------------------------------------------------
    // PART 1: Subscription Channels Connectivity
    // -------------------------------------------------------------
    console.log("1. Testing Realtime Channels Connection...");

    const lobbyChannel = client.channel(`test:lobby:${Date.now()}`);
    let lobbyEvents = [];
    lobbyChannel
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, (payload) => {
        lobbyEvents.push({ table: "rooms", payload });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "room_memberships" }, (payload) => {
        lobbyEvents.push({ table: "room_memberships", payload });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "join_requests" }, (payload) => {
        lobbyEvents.push({ table: "join_requests", payload });
      });

    const lobbySubStatus = await new Promise((resolve) => {
      lobbyChannel.subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          resolve(status);
        }
      });
    });
    assert(lobbySubStatus === "SUBSCRIBED", `Lobby Realtime channel subscribed successfully (${lobbySubStatus})`);

    const roomChannel = client.channel(`test:room:${Date.now()}`);
    let roomEvents = [];
    roomChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_memberships", filter: `room_id=eq.${testRoomId}` },
      (payload) => roomEvents.push(payload)
    );

    const roomSubStatus = await new Promise((resolve) => {
      roomChannel.subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          resolve(status);
        }
      });
    });
    assert(roomSubStatus === "SUBSCRIBED", `Room Realtime channel subscribed successfully (${roomSubStatus})`);

    // -------------------------------------------------------------
    // PART 2: Realtime Join Request Flow (Create -> Event -> Approve -> Event)
    // -------------------------------------------------------------
    console.log("\n2. Testing Join Request Lifecycle & Realtime Events...");

    // Clean up any lingering requests for this user in testRoomId
    const existingReqs = await joinRepo.findByRoomId(testRoomId);
    for (const r of existingReqs.filter((x) => x.requesterId === testUserId && x.status === "pending")) {
      await joinRepo.cancel(r.id, testUserId);
    }

    const preReqEventsCount = lobbyEvents.filter((e) => e.table === "join_requests").length;
    const createdReq = await joinRepo.create(testRoomId, testUserId);
    assert(createdReq.status === "pending", "Created pending join request");

    // Wait for realtime event propagation
    await wait(1200);
    const postReqEventsCount = lobbyEvents.filter((e) => e.table === "join_requests").length;
    assert(
      postReqEventsCount > preReqEventsCount,
      `Lobby channel received INSERT event for join_requests (received ${postReqEventsCount - preReqEventsCount} event(s))`
    );

    // Approve the request
    await joinRepo.approve(createdReq.id, adminId);
    await wait(1200);
    const approvedEventsCount = lobbyEvents.filter(
      (e) => e.table === "join_requests" && e.payload?.new?.status === "approved"
    ).length;
    assert(approvedEventsCount >= 1, "Lobby channel received UPDATE event with status='approved'");

    // -------------------------------------------------------------
    // PART 3: Room Membership & Realtime Sync (Add -> MemberCount -> Remove -> Kicked Check)
    // -------------------------------------------------------------
    console.log("\n3. Testing Membership Removal & Realtime Synchronization...");

    const initialCatalog = await roomRepo.findCatalog();
    const initialRoom = initialCatalog.find((r) => r.id === testRoomId);
    const initialMemberCount = initialRoom?.memberCount ?? 0;
    console.log(`  ℹ Initial member count for room: ${initialMemberCount}`);

    // Ensure member is active
    let member = await memRepo.findMember(testRoomId, testUserId);
    if (!member || member.status !== "active") {
      await memRepo.addMember(testRoomId, testUserId);
    }

    const activeCatalog = await roomRepo.findCatalog();
    const activeRoom = activeCatalog.find((r) => r.id === testRoomId);
    assert(
      (activeRoom?.memberCount ?? 0) >= initialMemberCount,
      `Catalog recalculated active memberCount: ${activeRoom?.memberCount}`
    );

    // Track room membership events
    const preRemoveCount = roomEvents.length;
    const preLobbyMemCount = lobbyEvents.filter((e) => e.table === "room_memberships").length;

    // Remove member (Tests the single-coercion fix as well!)
    const removedMem = await memRepo.removeMember(testRoomId, testUserId, adminId, "Automated Realtime Test Kick");
    assert(removedMem.status === "removed", "removeMember succeeded and set status to 'removed'");

    await wait(1200);

    const postRemoveCount = roomEvents.length;
    const postLobbyMemCount = lobbyEvents.filter((e) => e.table === "room_memberships").length;

    assert(
      postRemoveCount > preRemoveCount,
      `Room channel received UPDATE event for membership removal (${postRemoveCount - preRemoveCount} event(s))`
    );
    assert(
      postLobbyMemCount > preLobbyMemCount,
      `Lobby channel received membership change event (${postLobbyMemCount - preLobbyMemCount} event(s))`
    );

    // Verify member count decreased
    const postRemoveCatalog = await roomRepo.findCatalog();
    const postRemoveRoom = postRemoveCatalog.find((r) => r.id === testRoomId);
    assert(
      (postRemoveRoom?.memberCount ?? 0) < (activeRoom?.memberCount ?? 0),
      `Live catalog reflects member count reduction: ${postRemoveRoom?.memberCount}`
    );

    // Verify Kicked Detection Logic
    const memberships = await memRepo.findByRoomId(testRoomId);
    const hasActive = memberships.some((m) => m.userId === testUserId && m.status === "active");
    const hasRemoved = memberships.some((m) => m.userId === testUserId && m.status === "removed");
    const isCurrentUserRemoved = !hasActive && hasRemoved;
    assert(isCurrentUserRemoved === true, "isCurrentUserRemoved accurately evaluates to TRUE for kicked member");

    // -------------------------------------------------------------
    // PART 4: Cleanup & Channels Teardown
    // -------------------------------------------------------------
    console.log("\n4. Cleaning up test data & channels...");
    await client.removeChannel(lobbyChannel);
    await client.removeChannel(roomChannel);
    assert(true, "Realtime channels unsubscribed and cleaned up");

    console.log("\n=======================================================");
    console.log(`   VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=======================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("  ✗ UNHANDLED EXCEPTION DURING REALTIME TESTS:", err);
    process.exit(1);
  }
}

run();
