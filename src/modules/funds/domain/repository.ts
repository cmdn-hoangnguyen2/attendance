import type {
  FundContribution,
  FundContributionReason,
  Payment,
  RoomPaymentImage,
} from "@/types/domain";

export interface FundContributionRepository {
  findById(id: string): Promise<FundContribution | null>;
  findByRoomId(roomId: string): Promise<FundContribution[]>;
  findByContributorId(userId: string): Promise<FundContribution[]>;
  create(data: {
    roomId: string;
    contributorId: string;
    amount: number; // Integer VND
    reason: FundContributionReason;
    reasonDetails?: string;
    meetingSessionId?: string;
    createdBy: string;
  }): Promise<FundContribution>;
  markPaid(id: string): Promise<FundContribution>;
}

export interface PaymentRepository {
  findByContributionId(contributionId: string): Promise<Payment | null>;
  confirmPayment(data: {
    contributionId: string;
    amount: number; // Integer VND
    confirmedBy: string;
  }): Promise<Payment>;
  revertPayment(contributionId: string, actorId: string): Promise<void>;
}

export interface RoomPaymentImageRepository {
  findByRoomId(roomId: string): Promise<RoomPaymentImage | null>;
  createOrReplace(data: {
    roomId: string;
    storagePath: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    fileSize: number;
    uploadedBy: string;
  }): Promise<RoomPaymentImage>;
  uploadAndLinkImage(
    roomId: string,
    file: File | Blob,
    mimeType: string,
    fileSizeBytes: number,
    actorId: string
  ): Promise<{ storagePath: string; signedUrl: string }>;
  remove(roomId: string, actorId: string): Promise<void>;
  getSignedUrl(storagePath: string): Promise<string>;
}
