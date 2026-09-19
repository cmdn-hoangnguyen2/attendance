import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AuditLog, User } from "@/types/domain";
import type {
  AuditLogRepository,
  UserRepository,
} from "../domain/repository";

export class SupabaseUserRepository implements UserRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private mapUser(row: Database["public"]["Tables"]["users"]["Row"]): User {
    return {
      id: row.id,
      auth0Subject: row.auth0_subject,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapUser(data);
  }

  async findByAuth0Subject(auth0Subject: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("auth0_subject", auth0Subject)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapUser(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapUser(data);
  }

  async listAll(options?: { includeArchived?: boolean }): Promise<User[]> {
    let query = this.client.from("users").select("*");

    if (!options?.includeArchived) {
      query = query.eq("status", "active");
    }

    const { data, error } = await query.order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map(this.mapUser);
  }

  async createOrSync(data: {
    auth0Subject: string;
    email: string;
    displayName: string;
    role?: "admin" | "user";
  }): Promise<User> {
    const { data: user, error } = await this.client
      .from("users")
      .upsert(
        {
          auth0_subject: data.auth0Subject,
          email: data.email,
          display_name: data.displayName,
          ...(data.role && { role: data.role }),
        },
        { onConflict: "auth0_subject" }
      )
      .select("*")
      .single();

    if (error || !user) {
      throw new Error(`Failed to sync user: ${error?.message}`);
    }
    return this.mapUser(user);
  }

  async archiveUser(
    id: string,
    replacementAdminId: string,
    actorId: string,
    confirmationPhrase: string
  ): Promise<User> {
    if (confirmationPhrase.trim() !== "Archive this user") {
      throw new Error("Confirmation phrase 'Archive this user' required");
    }

    // Transfer any active rooms owned by this user to replacement admin
    const { data: ownedRooms } = await this.client
      .from("rooms")
      .select("id")
      .eq("owner_id", id)
      .eq("status", "active");

    if (ownedRooms && ownedRooms.length > 0) {
      if (!replacementAdminId) {
        throw new Error("Must select an active replacement admin to receive owned rooms");
      }

      await this.client
        .from("rooms")
        .update({ owner_id: replacementAdminId })
        .eq("owner_id", id)
        .eq("status", "active");
    }

    // Soft-delete the user
    const { data: user, error } = await this.client
      .from("users")
      .update({
        status: "soft_deleted",
        deleted_at: new Date().toISOString(),
        deleted_by: actorId,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !user) {
      throw new Error(`Failed to archive user: ${error?.message}`);
    }

    await this.client.from("audit_logs").insert({
      actor_id: actorId,
      action: "user.soft_deleted",
      target_type: "user",
      target_id: id,
      metadata: { replacementAdminId, transferredRoomsCount: ownedRooms?.length ?? 0 },
    });

    return this.mapUser(user);
  }

  async restoreUser(id: string, actorId: string): Promise<User> {
    const { data: user, error } = await this.client
      .from("users")
      .update({
        status: "active",
        deleted_at: null,
        deleted_by: null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !user) {
      throw new Error(`Failed to restore user: ${error?.message}`);
    }

    await this.client.from("audit_logs").insert({
      actor_id: actorId,
      action: "user.restored",
      target_type: "user",
      target_id: id,
    });

    return this.mapUser(user);
  }
}

export class SupabaseAuditLogRepository implements AuditLogRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private mapLog(row: Database["public"]["Tables"]["audit_logs"]["Row"]): AuditLog {
    return {
      id: row.id,
      actorId: row.actor_id ?? "",
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: (row.metadata as Record<string, unknown>) ?? undefined,
      occurredAt: row.occurred_at,
    };
  }

  async record(entry: {
    actorId?: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.client.from("audit_logs").insert({
      actor_id: entry.actorId ?? null,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      metadata: entry.metadata as Database["public"]["Tables"]["audit_logs"]["Insert"]["metadata"],
    });
  }

  async findByTarget(targetType: string, targetId: string): Promise<AuditLog[]> {
    const { data, error } = await this.client
      .from("audit_logs")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("occurred_at", { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapLog);
  }

  async listRecent(limit = 50): Promise<AuditLog[]> {
    const { data, error } = await this.client
      .from("audit_logs")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(this.mapLog);
  }
}
