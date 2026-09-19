import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  FundContribution,
  FundContributionReason,
  Payment,
  RoomPaymentImage,
} from "@/types/domain";
import type {
  FundContributionRepository,
  PaymentRepository,
  RoomPaymentImageRepository,
} from "../domain/repository";

export class SupabaseFundContributionRepository implements FundContributionRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private mapContribution(row: Database["public"]["Tables"]["fund_contributions"]["Row"]): FundContribution {
    return {
      id: row.id,
      roomId: row.room_id,
      meetingSessionId: row.meeting_session_id ?? undefined,
      contributorId: row.contributor_id,
      amount: row.amount,
      reason: row.reason,
      reasonDetails: row.reason_details ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<FundContribution | null> {
    const { data, error } = await this.client
      .from("fund_contributions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapContribution(data);
  }

  async findByRoomId(roomId: string): Promise<FundContribution[]> {
    const { data, error } = await this.client
      .from("fund_contributions")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapContribution);
  }

  async findByContributorId(userId: string): Promise<FundContribution[]> {
    const { data, error } = await this.client
      .from("fund_contributions")
      .select("*")
      .eq("contributor_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapContribution);
  }

  async create(data: {
    roomId: string;
    contributorId: string;
    amount: number;
    reason: FundContributionReason;
    reasonDetails?: string;
    meetingSessionId?: string;
    createdBy: string;
  }): Promise<FundContribution> {
    if (data.reason === "Khác" && (!data.reasonDetails || data.reasonDetails.trim().length === 0)) {
      throw new Error("Reason 'Khác' requires non-empty details");
    }

    const { data: contribution, error } = await this.client
      .from("fund_contributions")
      .insert({
        room_id: data.roomId,
        contributor_id: data.contributorId,
        amount: Math.round(data.amount), // ensure integer VND
        reason: data.reason,
        reason_details: data.reasonDetails ?? null,
        meeting_session_id: data.meetingSessionId ?? null,
        status: "outstanding",
        created_by: data.createdBy,
      })
      .select("*")
      .single();

    if (error || !contribution) {
      throw new Error(`Failed to create fund contribution: ${error?.message}`);
    }

    await this.client.from("audit_logs").insert({
      actor_id: data.createdBy,
      action: "fund_contribution.created",
      target_type: "fund_contribution",
      target_id: contribution.id,
      metadata: { amount: data.amount, contributorId: data.contributorId },
    });

    return this.mapContribution(contribution);
  }

  async markPaid(id: string): Promise<FundContribution> {
    const { data, error } = await this.client
      .from("fund_contributions")
      .update({
        status: "paid",
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to mark contribution paid: ${error?.message}`);
    }
    return this.mapContribution(data);
  }
}

export class SupabasePaymentRepository implements PaymentRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private mapPayment(row: Database["public"]["Tables"]["payments"]["Row"]): Payment {
    return {
      id: row.id,
      contributionId: row.contribution_id,
      amount: row.amount,
      paidAt: row.paid_at,
      confirmedBy: row.confirmed_by,
      confirmedAt: row.confirmed_at,
    };
  }

  async findByContributionId(contributionId: string): Promise<Payment | null> {
    const { data, error } = await this.client
      .from("payments")
      .select("*")
      .eq("contribution_id", contributionId)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapPayment(data);
  }

  async confirmPayment(data: {
    contributionId: string;
    amount: number;
    confirmedBy: string;
  }): Promise<Payment> {
    // 1. Insert payment record (append-only)
    const { data: payment, error: paymentError } = await this.client
      .from("payments")
      .insert({
        contribution_id: data.contributionId,
        amount: Math.round(data.amount),
        confirmed_by: data.confirmedBy,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (paymentError || !payment) {
      throw new Error(`Failed to insert payment record: ${paymentError?.message}`);
    }

    // 2. Update fund contribution status to paid
    await this.client
      .from("fund_contributions")
      .update({ status: "paid" })
      .eq("id", data.contributionId);

    // 3. Log audit
    await this.client.from("audit_logs").insert({
      actor_id: data.confirmedBy,
      action: "payment.confirmed",
      target_type: "fund_contribution",
      target_id: data.contributionId,
      metadata: { paymentId: payment.id, amount: data.amount },
    });

    return this.mapPayment(payment);
  }

  async revertPayment(contributionId: string, actorId: string): Promise<void> {
    // 1. Delete payment records for this contribution
    const { error: delError } = await this.client
      .from("payments")
      .delete()
      .eq("contribution_id", contributionId);

    if (delError) {
      throw new Error(`Failed to delete payment record: ${delError.message}`);
    }

    // 2. Revert fund contribution status to outstanding
    const { error: updateError } = await this.client
      .from("fund_contributions")
      .update({ status: "outstanding" })
      .eq("id", contributionId);

    if (updateError) {
      throw new Error(`Failed to revert fund contribution: ${updateError.message}`);
    }

    // 3. Log audit
    await this.client.from("audit_logs").insert({
      actor_id: actorId,
      action: "payment.reverted",
      target_type: "fund_contribution",
      target_id: contributionId,
    });
  }
}

export class SupabaseRoomPaymentImageRepository implements RoomPaymentImageRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private mapImage(row: Database["public"]["Tables"]["room_payment_images"]["Row"]): RoomPaymentImage {
    return {
      roomId: row.room_id,
      storagePath: row.storage_path,
      sortOrder: row.sort_order,
      uploadedAt: row.created_at,
    };
  }

  async findByRoomId(roomId: string): Promise<RoomPaymentImage | null> {
    const { data, error } = await this.client
      .from("room_payment_images")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapImage(data);
  }

  async createOrReplace(data: {
    roomId: string;
    storagePath: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    fileSize: number;
    uploadedBy: string;
  }): Promise<RoomPaymentImage> {
    const { data: image, error } = await this.client
      .from("room_payment_images")
      .upsert(
        {
          room_id: data.roomId,
          storage_path: data.storagePath,
          mime_type: data.mimeType,
          file_size: data.fileSize,
          sort_order: 1,
          uploaded_by: data.uploadedBy,
        },
        { onConflict: "room_id" }
      )
      .select("*")
      .single();

    if (error || !image) {
      throw new Error(`Failed to save payment image: ${error?.message}`);
    }
    return this.mapImage(image);
  }

  async uploadAndLinkImage(
    roomId: string,
    file: File | Blob,
    mimeType: string,
    fileSizeBytes: number,
    actorId: string
  ): Promise<{ storagePath: string; signedUrl: string }> {
    const allowedMimes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const ext = allowedMimes[mimeType];
    if (!ext) {
      throw new Error(`Định dạng tệp không được hỗ trợ (${mimeType}). Chỉ chấp nhận JPEG, PNG, WebP.`);
    }

    if (fileSizeBytes > 5242880) {
      throw new Error("Dung lượng tệp vượt quá giới hạn 5 MB.");
    }

    const storagePath = `${roomId}/qr-${Date.now()}.${ext}`;

    // Upload to private bucket
    const { error: uploadError } = await this.client.storage
      .from("payment-images")
      .upload(storagePath, file, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Tải tệp lên Supabase Storage thất bại: ${uploadError.message}`);
    }

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await this.getSignedUrl(storagePath);

    // Persist to room_payment_images metadata table
    await this.createOrReplace({
      roomId,
      storagePath,
      mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
      fileSize: fileSizeBytes,
      uploadedBy: actorId,
    });

    // Audit log
    await this.client.from("audit_logs").insert({
      actor_id: actorId,
      action: "room_payment_image.uploaded",
      target_type: "room",
      target_id: roomId,
      metadata: { storagePath, mimeType, fileSizeBytes },
    });

    return { storagePath, signedUrl };
  }

  async remove(roomId: string, actorId: string): Promise<void> {
    const existing = await this.findByRoomId(roomId);
    if (existing?.storagePath) {
      await this.client.storage.from("payment-images").remove([existing.storagePath]);
    }

    await this.client.from("room_payment_images").delete().eq("room_id", roomId);

    await this.client.from("audit_logs").insert({
      actor_id: actorId,
      action: "room_payment_image.removed",
      target_type: "room",
      target_id: roomId,
    });
  }

  async getSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await this.client.storage
      .from("payment-images")
      .createSignedUrl(storagePath, 3600); // 1 hour expiration

    if (error || !data?.signedUrl) {
      return "";
    }
    return data.signedUrl;
  }
}
