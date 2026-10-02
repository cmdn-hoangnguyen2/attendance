-- Development-only squashed baseline. Never apply over production migration history.
-- No seed identities or business INSERT statements. Later subsystems get separate migrations.

-- Description: Core schema, tables, constraints, foreign keys, integer VND money, append-only rules
-- Conforms to docs/02-architecture.md, docs/03-domain-and-states.md, docs/07-api-backend-phase.md

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog;

-- Helper function to prevent UPDATE or DELETE on append-only tables
CREATE OR REPLACE FUNCTION enforce_append_only()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Table % is append-only. Modification or deletion is strictly forbidden.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog;

-- ============================================================================
-- 2. Table: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_subject TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'soft_deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ============================================================================
-- 3. Table: rooms
-- ============================================================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_visibility_status ON rooms(visibility, status);

CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ============================================================================
-- 4. Table: room_memberships
-- ============================================================================
CREATE TABLE IF NOT EXISTS room_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES users(id),
  removal_reason TEXT
);

-- Ensure a user can only have one active membership per room
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_room_membership
  ON room_memberships(room_id, user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_room_memberships_room_id ON room_memberships(room_id);
CREATE INDEX IF NOT EXISTS idx_room_memberships_user_id ON room_memberships(user_id);

-- ============================================================================
-- 5. Table: join_requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure a user cannot have multiple pending requests for the same room
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_join_request
  ON join_requests(room_id, requester_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_join_requests_room_id ON join_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_requester_id ON join_requests(requester_id);

CREATE TRIGGER trg_join_requests_updated_at
  BEFORE UPDATE ON join_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ============================================================================
-- 6. Table: meeting_sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS meeting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  attendance_deadline TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_sessions_room_id ON meeting_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_status ON meeting_sessions(status);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_starts_at ON meeting_sessions(starts_at);

CREATE TRIGGER trg_meeting_sessions_updated_at
  BEFORE UPDATE ON meeting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ============================================================================
-- 7. Table: attendance_records
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_session_id UUID NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
  changed_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attendance_session_user UNIQUE (meeting_session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(meeting_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id ON attendance_records(user_id);

CREATE TRIGGER trg_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ============================================================================
-- 8. Table: fund_candidates (Audit Snapshot for Absent Members at Deadline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fund_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_session_id UUID NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  suggested_amount INTEGER NOT NULL DEFAULT 50000 CHECK (suggested_amount > 0),
  is_manual BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fund_candidate_session_user UNIQUE (meeting_session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fund_candidates_session_id ON fund_candidates(meeting_session_id);

-- ============================================================================
-- 9. Table: fund_contributions
-- ============================================================================
CREATE TABLE IF NOT EXISTS fund_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  meeting_session_id UUID REFERENCES meeting_sessions(id) ON DELETE SET NULL,
  contributor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0), -- Must be positive Integer VND
  reason TEXT NOT NULL CHECK (reason IN ('Đi trễ', 'Bận nhưng chưa xin phép', 'Khác')),
  reason_details TEXT,
  status TEXT NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'paid')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_reason_details_required CHECK (
    reason != 'Khác' OR (reason_details IS NOT NULL AND length(trim(reason_details)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_fund_contributions_room_id ON fund_contributions(room_id);
CREATE INDEX IF NOT EXISTS idx_fund_contributions_contributor_id ON fund_contributions(contributor_id);
CREATE INDEX IF NOT EXISTS idx_fund_contributions_status ON fund_contributions(status);

CREATE TRIGGER trg_fund_contributions_updated_at
  BEFORE UPDATE ON fund_contributions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ============================================================================
-- 10. Table: payments (APPEND-ONLY, Immutable evidence)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id UUID NOT NULL REFERENCES fund_contributions(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_by UUID NOT NULL REFERENCES users(id),
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_contribution_id ON payments(contribution_id);
CREATE INDEX IF NOT EXISTS idx_payments_confirmed_by ON payments(confirmed_by);

-- Enforce append-only on payments
CREATE TRIGGER trg_payments_enforce_append_only
  BEFORE UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION enforce_append_only();

-- ============================================================================
-- 11. Table: room_payment_images (Strict 1 image per room, max 5MB, JPEG/PNG/WebP)
-- ============================================================================
CREATE TABLE IF NOT EXISTS room_payment_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 5242880), -- 5MB limit
  sort_order INTEGER NOT NULL DEFAULT 1,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_room_payment_images_one_per_room UNIQUE (room_id)
);

CREATE INDEX IF NOT EXISTS idx_room_payment_images_room_id ON room_payment_images(room_id);

CREATE TRIGGER trg_room_payment_images_updated_at
  BEFORE UPDATE ON room_payment_images
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- ============================================================================
-- 12. Table: audit_logs (APPEND-ONLY)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_occurred_at ON audit_logs(occurred_at DESC);

-- Enforce append-only on audit_logs
CREATE TRIGGER trg_audit_logs_enforce_append_only
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION enforce_append_only();
-- Description: Add notifications, channel room type, and peer debts for P2P funds.

-- 1. Add type to rooms
ALTER TABLE rooms ADD COLUMN type TEXT NOT NULL DEFAULT 'meeting' CHECK (type IN ('meeting', 'channel'));

-- 2. Table: app_notifications
CREATE TABLE IF NOT EXISTS app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_notifications_user_id ON app_notifications(user_id);

CREATE TRIGGER trg_app_notifications_updated_at
  BEFORE UPDATE ON app_notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();


-- 3. Table: peer_debts (P2P funds in channel rooms)
CREATE TABLE IF NOT EXISTS peer_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  creditor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peer_debts_room_id ON peer_debts(room_id);
CREATE INDEX IF NOT EXISTS idx_peer_debts_creditor_id ON peer_debts(creditor_id);
CREATE INDEX IF NOT EXISTS idx_peer_debts_debtor_id ON peer_debts(debtor_id);

CREATE TRIGGER trg_peer_debts_updated_at
  BEFORE UPDATE ON peer_debts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- 4. Table: peer_payments (APPEND-ONLY, Immutable evidence for P2P debts)
CREATE TABLE IF NOT EXISTS peer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peer_debt_id UUID NOT NULL REFERENCES peer_debts(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_by UUID NOT NULL REFERENCES users(id),
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peer_payments_peer_debt_id ON peer_payments(peer_debt_id);
CREATE INDEX IF NOT EXISTS idx_peer_payments_confirmed_by ON peer_payments(confirmed_by);

CREATE TRIGGER trg_peer_payments_enforce_append_only
  BEFORE UPDATE OR DELETE ON peer_payments
  FOR EACH ROW
  EXECUTE FUNCTION enforce_append_only();

-- 5. Table: user_payment_images (Personal QR codes for P2P debts)
CREATE TABLE IF NOT EXISTS user_payment_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 5242880), -- 5MB limit
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_payment_images_one_per_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_payment_images_user_id ON user_payment_images(user_id);

CREATE TRIGGER trg_user_payment_images_updated_at
  BEFORE UPDATE ON user_payment_images
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

-- Default deny browser access until authenticated policies land in package B.
-- Native service_role BYPASSRLS replaces the unsafe SECURITY DEFINER helper.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_payment_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_images ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.users, public.rooms, public.room_memberships, public.join_requests, public.meeting_sessions, public.attendance_records, public.fund_candidates, public.fund_contributions, public.payments, public.room_payment_images, public.audit_logs, public.app_notifications, public.peer_debts, public.peer_payments, public.user_payment_images FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users, public.rooms, public.room_memberships, public.join_requests, public.meeting_sessions, public.attendance_records, public.fund_candidates, public.fund_contributions, public.payments, public.room_payment_images, public.audit_logs, public.app_notifications, public.peer_debts, public.peer_payments, public.user_payment_images TO service_role;
REVOKE ALL ON FUNCTION public.set_updated_at_column(), public.enforce_append_only() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at_column(), public.enforce_append_only() TO service_role;

-- Bucket metadata is configuration, never a business seed or Storage object.
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-images', 'payment-images', false, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No browser Storage policies: uploads and signing remain server-only until B/E.
-- Supabase creates this publication; fail visibly outside the supported platform.
ALTER PUBLICATION supabase_realtime ADD TABLE public.users, public.rooms, public.room_memberships, public.join_requests, public.meeting_sessions, public.attendance_records, public.fund_candidates, public.fund_contributions, public.payments, public.room_payment_images, public.app_notifications, public.peer_debts, public.peer_payments, public.user_payment_images;
