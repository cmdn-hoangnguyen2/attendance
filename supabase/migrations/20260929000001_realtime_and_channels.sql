-- Migration: 20260929000001_realtime_and_channels.sql
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

-- Enable Realtime for app_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE app_notifications;

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
