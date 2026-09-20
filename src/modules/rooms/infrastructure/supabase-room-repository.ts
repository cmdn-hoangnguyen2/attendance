import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  JoinRequest,
  Room,
  RoomMembership,
  RoomVisibility,
} from "@/types/domain";
import type {
  JoinRequestRepository,
  MembershipRepository,
  RoomRepository,
} from "../domain/repository";

export class SupabaseRoomRepository implements RoomRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private mapRoom(row: Database["public"]["Tables"]["rooms"]["Row"], memberCount = 0): Room {
    return {
      id: row.id,
      name: row.name,
      visibility: row.visibility,
      ownerId: row.owner_id,
      status: row.status,
      memberCount,
      paymentImageUrl: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<Room | null> {
    const { data: room, error } = await this.client
      .from("rooms")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !room) return null;

    // Fetch active member count
    const { count } = await this.client
      .from("room_memberships")
      .select("*", { count: "exact", head: true })
      .eq("room_id", id)
      .eq("status", "active");

    return this.mapRoom(room, count ?? 0);
  }

  async findCatalog(options?: {
    visibility?: RoomVisibility;
    search?: string;
    includeArchived?: boolean;
  }): Promise<Room[]> {
    let query = this.client.from("rooms").select("*");

    if (!options?.includeArchived) {
      query = query.eq("status", "active");
    }

    if (options?.visibility) {
      query = query.eq("visibility", options.visibility);
    }

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    const { data: rooms, error } = await query.order("created_at", { ascending: false });
    if (error || !rooms) return [];

    // Get active memberships count grouped by room
    const { data: memberships } = await this.client
      .from("room_memberships")
      .select("room_id")
      .eq("status", "active");

    const countMap = new Map<string, number>();
    memberships?.forEach((m) => {
      countMap.set(m.room_id, (countMap.get(m.room_id) ?? 0) + 1);
    });

    return rooms.map((r) => this.mapRoom(r, countMap.get(r.id) ?? 0));
  }

  async findByOwnerId(ownerId: string): Promise<Room[]> {
    const { data: rooms, error } = await this.client
      .from("rooms")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error || !rooms) return [];

    const { data: memberships } = await this.client
      .from("room_memberships")
      .select("room_id")
      .eq("status", "active");

    const countMap = new Map<string, number>();
    memberships?.forEach((m) => {
      countMap.set(m.room_id, (countMap.get(m.room_id) ?? 0) + 1);
    });

    return rooms.map((r) => this.mapRoom(r, countMap.get(r.id) ?? 0));
  }

  async findJoinedByUserId(userId: string): Promise<Room[]> {
    const { data: memberships, error: memError } = await this.client
      .from("room_memberships")
      .select("room_id")
      .eq("user_id", userId)
      .eq("status", "active");

    if (memError || !memberships || memberships.length === 0) return [];

    const roomIds = memberships.map((m) => m.room_id);
    const { data: rooms, error } = await this.client
      .from("rooms")
      .select("*")
      .in("id", roomIds)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error || !rooms) return [];

    // Fetch member counts
    const { data: allMemberships } = await this.client
      .from("room_memberships")
      .select("room_id")
      .eq("status", "active")
      .in("room_id", roomIds);

    const countMap = new Map<string, number>();
    allMemberships?.forEach((m) => {
      countMap.set(m.room_id, (countMap.get(m.room_id) ?? 0) + 1);
    });

    return rooms.map((r) => this.mapRoom(r, countMap.get(r.id) ?? 0));
  }

  async create(roomData: {
    name: string;
    visibility: RoomVisibility;
    ownerId: string;
  }): Promise<Room> {
    const { data: newRoom, error } = await this.client
      .from("rooms")
      .insert({
        name: roomData.name,
        visibility: roomData.visibility,
        owner_id: roomData.ownerId,
        status: "active",
      })
      .select("*")
      .single();

    if (error || !newRoom) {
      throw new Error(`Failed to create room: ${error?.message}`);
    }

    // Owner automatically becomes active member
    await this.client.from("room_memberships").insert({
      room_id: newRoom.id,
      user_id: roomData.ownerId,
      status: "active",
    });

    return this.mapRoom(newRoom, 1);
  }

  async update(id: string, data: Partial<Pick<Room, "name" | "visibility">>): Promise<Room> {
    const { data: updated, error } = await this.client
      .from("rooms")
      .update({
        ...(data.name && { name: data.name }),
        ...(data.visibility && { visibility: data.visibility }),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update room: ${error?.message}`);
    }

    return this.mapRoom(updated);
  }

  async archive(id: string, actorId: string, confirmationPhrase: string): Promise<Room> {
    if (confirmationPhrase.trim() !== "Archive this room") {
      throw new Error("Invalid confirmation phrase for archiving room");
    }

    const { data: archived, error } = await this.client
      .from("rooms")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
        archived_by: actorId,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !archived) {
      throw new Error(`Failed to archive room: ${error?.message}`);
    }

    // Record audit log
    await this.client.from("audit_logs").insert({
      actor_id: actorId,
      action: "room.archived",
      target_type: "room",
      target_id: id,
    });

    return this.mapRoom(archived);
  }

  async restore(id: string, actorId: string): Promise<Room> {
    const { data: restored, error } = await this.client
      .from("rooms")
      .update({
        status: "active",
        archived_at: null,
        archived_by: null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !restored) {
      throw new Error(`Failed to restore room: ${error?.message}`);
    }

    // Record audit log
    await this.client.from("audit_logs").insert({
      actor_id: actorId,
      action: "room.restored",
      target_type: "room",
      target_id: id,
    });

    return this.mapRoom(restored);
  }

  async transferOwnership(id: string, newOwnerId: string, actorId: string): Promise<Room> {
    const { data: transferred, error } = await this.client
      .from("rooms")
      .update({
        owner_id: newOwnerId,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !transferred) {
      throw new Error(`Failed to transfer ownership: ${error?.message}`);
    }

    await this.client.from("audit_logs").insert({
      actor_id: actorId,
      action: "room.ownership_transferred",
      target_type: "room",
      target_id: id,
      metadata: { newOwnerId },
    });

    return this.mapRoom(transferred);
  }
}

export class SupabaseMembershipRepository implements MembershipRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private mapMembership(row: Database["public"]["Tables"]["room_memberships"]["Row"]): RoomMembership {
    return {
      roomId: row.room_id,
      userId: row.user_id,
      status: row.status,
      joinedAt: row.joined_at,
      leftAt: row.left_at ?? undefined,
    };
  }

  async findByRoomId(roomId: string): Promise<RoomMembership[]> {
    const { data, error } = await this.client
      .from("room_memberships")
      .select("*")
      .eq("room_id", roomId);

    if (error || !data) return [];
    return data.map(this.mapMembership);
  }

  async findMember(roomId: string, userId: string): Promise<RoomMembership | null> {
    const { data, error } = await this.client
      .from("room_memberships")
      .select("*")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapMembership(data);
  }

  async addMember(roomId: string, userId: string): Promise<RoomMembership> {
    const { data, error } = await this.client
      .from("room_memberships")
      .insert({
        room_id: roomId,
        user_id: userId,
        status: "active",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to add member: ${error?.message}`);
    }
    return this.mapMembership(data);
  }

  async removeMember(
    roomId: string,
    userId: string,
    actorId: string,
    reason?: string,
    confirmationPhrase?: string
  ): Promise<RoomMembership> {
    // Check if user has outstanding fund contributions
    const { data: debts } = await this.client
      .from("fund_contributions")
      .select("id")
      .eq("room_id", roomId)
      .eq("contributor_id", userId)
      .eq("status", "outstanding");

    if (debts && debts.length > 0) {
      if (confirmationPhrase?.trim() !== "I agree to remove this user") {
        throw new Error("Confirmation phrase 'I agree to remove this user' required for member with debt");
      }
    }

    const { data, error } = await this.client
      .from("room_memberships")
      .update({
        status: "removed",
        removed_at: new Date().toISOString(),
        removed_by: actorId,
        removal_reason: reason ?? null,
      })
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .eq("status", "active")
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to remove member: ${error?.message}`);
    }

    await this.client.from("audit_logs").insert({
      actor_id: actorId,
      action: "membership.removed",
      target_type: "room_membership",
      target_id: `${roomId}:${userId}`,
      metadata: { reason, hadOutstandingDebt: debts && debts.length > 0 },
    });

    return this.mapMembership(data);
  }

  async leave(roomId: string, userId: string): Promise<RoomMembership> {
    // Owner cannot leave room (docs/01-product-scope.md line 26)
    const { data: room } = await this.client
      .from("rooms")
      .select("owner_id")
      .eq("id", roomId)
      .maybeSingle();

    if (room && room.owner_id === userId) {
      throw new Error("Chủ phòng không thể tự rời phòng. Vui lòng chuyển giao quyền chủ phòng hoặc lưu trữ phòng họp trước.");
    }

    const { data, error } = await this.client
      .from("room_memberships")
      .update({
        status: "left",
        left_at: new Date().toISOString(),
      })
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .eq("status", "active")
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to leave room: ${error?.message}`);
    }
    return this.mapMembership(data);
  }
}

export class SupabaseJoinRequestRepository implements JoinRequestRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private mapRequest(row: Database["public"]["Tables"]["join_requests"]["Row"]): JoinRequest {
    return {
      id: row.id,
      roomId: row.room_id,
      requesterId: row.requester_id,
      status: row.status,
      reviewedBy: row.reviewed_by ?? undefined,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at ?? undefined,
    };
  }

  async findByRoomId(roomId: string): Promise<JoinRequest[]> {
    const { data, error } = await this.client
      .from("join_requests")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapRequest);
  }

  async findByRequesterId(userId: string): Promise<JoinRequest[]> {
    const { data, error } = await this.client
      .from("join_requests")
      .select("*")
      .eq("requester_id", userId);

    if (error || !data) return [];
    return data.map(this.mapRequest);
  }

  async create(roomId: string, requesterId: string): Promise<JoinRequest> {
    const { data, error } = await this.client
      .from("join_requests")
      .insert({
        room_id: roomId,
        requester_id: requesterId,
        status: "pending",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create join request: ${error?.message}`);
    }
    return this.mapRequest(data);
  }

  async approve(requestId: string, reviewerId: string): Promise<JoinRequest> {
    const { data: request, error } = await this.client
      .from("join_requests")
      .update({
        status: "approved",
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select("*")
      .single();

    if (error || !request) {
      throw new Error(`Failed to approve join request: ${error?.message}`);
    }

    // Add requester as active member
    await this.client.from("room_memberships").insert({
      room_id: request.room_id,
      user_id: request.requester_id,
      status: "active",
    });

    return this.mapRequest(request);
  }

  async reject(requestId: string, reviewerId: string): Promise<JoinRequest> {
    const { data, error } = await this.client
      .from("join_requests")
      .update({
        status: "rejected",
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to reject join request: ${error?.message}`);
    }
    return this.mapRequest(data);
  }

  async cancel(requestId: string, requesterId: string): Promise<JoinRequest> {
    const { data, error } = await this.client
      .from("join_requests")
      .update({
        status: "cancelled",
      })
      .eq("id", requestId)
      .eq("requester_id", requesterId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to cancel join request: ${error?.message}`);
    }
    return this.mapRequest(data);
  }
}
