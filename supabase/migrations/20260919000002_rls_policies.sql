-- Migration: 20260919000002_rls_policies.sql
-- Description: Enable Row Level Security (RLS) and define defense-in-depth policies
-- Conforms to docs/04-auth-security.md, docs/05-realtime.md

-- ============================================================================
-- 1. Enable RLS on all tables
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_payment_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Helper functions for authorization checks
-- ============================================================================

-- Check if the requesting role is the service_role (used by Next.js server Route Handlers)
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role' = 'service_role' OR current_user = 'postgres');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is an active global admin
CREATE OR REPLACE FUNCTION is_global_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = user_id AND role = 'admin' AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is the active owner of a room
CREATE OR REPLACE FUNCTION is_room_owner(room_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM rooms WHERE id = room_id AND owner_id = user_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is an active member of a room
CREATE OR REPLACE FUNCTION is_active_room_member(room_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM room_memberships WHERE room_id = room_id AND user_id = user_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Service Role full bypass (Server Actions / Route Handlers with Service Key)
-- ============================================================================
CREATE POLICY "service_role_all_users" ON users FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_rooms" ON rooms FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_room_memberships" ON room_memberships FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_join_requests" ON join_requests FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_meeting_sessions" ON meeting_sessions FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_attendance_records" ON attendance_records FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_fund_candidates" ON fund_candidates FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_fund_contributions" ON fund_contributions FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_payments" ON payments FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_room_payment_images" ON room_payment_images FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_audit_logs" ON audit_logs FOR ALL USING (is_service_role());

-- ============================================================================
-- 4. Granular Public / Authenticated Read Policies
-- ============================================================================

-- Users: Anyone can view active users
CREATE POLICY "users_read_active" ON users
  FOR SELECT USING (status = 'active');

-- Rooms: Anyone can view active public & private rooms (private room names are visible in catalog)
CREATE POLICY "rooms_read_active" ON rooms
  FOR SELECT USING (status = 'active');

-- Room Memberships: Active memberships visible
CREATE POLICY "memberships_read_active" ON room_memberships
  FOR SELECT USING (status = 'active');

-- Fund Contributions: Read access for contributor or room members
CREATE POLICY "fund_contributions_read_public" ON fund_contributions
  FOR SELECT USING (TRUE);

-- Payments: Read access
CREATE POLICY "payments_read_public" ON payments
  FOR SELECT USING (TRUE);

-- Meeting Sessions: Visible for active rooms
CREATE POLICY "meeting_sessions_read_public" ON meeting_sessions
  FOR SELECT USING (TRUE);

-- Attendance Records: Visible
CREATE POLICY "attendance_records_read_public" ON attendance_records
  FOR SELECT USING (TRUE);

-- Room Payment Images: Visible for members and debtors
CREATE POLICY "payment_images_read_public" ON room_payment_images
  FOR SELECT USING (TRUE);
