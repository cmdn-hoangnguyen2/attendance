import type {
  JoinRequest,
  Room,
  RoomMembership,
  RoomVisibility,
} from "@/types/domain";

export interface RoomRepository {
  findById(id: string): Promise<Room | null>;
  findCatalog(options?: {
    visibility?: RoomVisibility;
    search?: string;
    includeArchived?: boolean;
  }): Promise<Room[]>;
  findByOwnerId(ownerId: string): Promise<Room[]>;
  findJoinedByUserId(userId: string): Promise<Room[]>;
  create(room: {
    name: string;
    visibility: RoomVisibility;
    ownerId: string;
  }): Promise<Room>;
  update(id: string, data: Partial<Pick<Room, "name" | "visibility">>): Promise<Room>;
  archive(id: string, actorId: string, confirmationPhrase: string): Promise<Room>;
  restore(id: string, actorId: string): Promise<Room>;
  transferOwnership(id: string, newOwnerId: string, actorId: string): Promise<Room>;
}

export interface MembershipRepository {
  findByRoomId(roomId: string): Promise<RoomMembership[]>;
  findMember(roomId: string, userId: string): Promise<RoomMembership | null>;
  addMember(roomId: string, userId: string): Promise<RoomMembership>;
  removeMember(
    roomId: string,
    userId: string,
    actorId: string,
    reason?: string,
    confirmationPhrase?: string
  ): Promise<RoomMembership>;
  leave(roomId: string, userId: string): Promise<RoomMembership>;
}

export interface JoinRequestRepository {
  findByRoomId(roomId: string): Promise<JoinRequest[]>;
  findByRequesterId(userId: string): Promise<JoinRequest[]>;
  create(roomId: string, requesterId: string): Promise<JoinRequest>;
  approve(requestId: string, reviewerId: string): Promise<JoinRequest>;
  reject(requestId: string, reviewerId: string): Promise<JoinRequest>;
  cancel(requestId: string, requesterId: string): Promise<JoinRequest>;
}
