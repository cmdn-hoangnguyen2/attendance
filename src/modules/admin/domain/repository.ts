import type { AuditLog, User } from "@/types/domain";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByAuth0Subject(auth0Subject: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  listAll(options?: { includeArchived?: boolean }): Promise<User[]>;
  createOrSync(data: {
    auth0Subject: string;
    email: string;
    displayName: string;
    role?: "admin" | "user";
  }): Promise<User>;
  archiveUser(
    id: string,
    replacementAdminId: string,
    actorId: string,
    confirmationPhrase: string
  ): Promise<User>;
  restoreUser(id: string, actorId: string): Promise<User>;
}

export interface AuditLogRepository {
  record(entry: {
    actorId?: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
  findByTarget(targetType: string, targetId: string): Promise<AuditLog[]>;
  listRecent(limit?: number): Promise<AuditLog[]>;
}
