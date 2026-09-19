import { supabase } from "@/lib/supabase/client";
import {
  SupabaseJoinRequestRepository,
  SupabaseMembershipRepository,
  SupabaseRoomRepository,
} from "@/modules/rooms/infrastructure/supabase-room-repository";
import {
  SupabaseAttendanceRepository,
  SupabaseMeetingSessionRepository,
} from "@/modules/meetings/infrastructure/supabase-meeting-repository";
import {
  SupabaseFundContributionRepository,
  SupabasePaymentRepository,
  SupabaseRoomPaymentImageRepository,
} from "@/modules/funds/infrastructure/supabase-fund-repository";
import {
  SupabaseAuditLogRepository,
  SupabaseUserRepository,
} from "@/modules/admin/infrastructure/supabase-admin-repository";

export const roomRepository = new SupabaseRoomRepository(supabase);
export const membershipRepository = new SupabaseMembershipRepository(supabase);
export const joinRequestRepository = new SupabaseJoinRequestRepository(supabase);

export const meetingSessionRepository = new SupabaseMeetingSessionRepository(supabase);
export const attendanceRepository = new SupabaseAttendanceRepository(supabase);

export const fundContributionRepository = new SupabaseFundContributionRepository(supabase);
export const paymentRepository = new SupabasePaymentRepository(supabase);
export const roomPaymentImageRepository = new SupabaseRoomPaymentImageRepository(supabase);

export const userRepository = new SupabaseUserRepository(supabase);
export const auditLogRepository = new SupabaseAuditLogRepository(supabase);
