-- Migration: 20260929000002_rls_policies_for_channels.sql
-- Description: Enable RLS and define policies for new tables (notifications, peer debts, etc)

-- 1. Enable RLS
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_images ENABLE ROW LEVEL SECURITY;

-- 2. Service Role full bypass
CREATE POLICY "service_role_all_app_notifications" ON app_notifications FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_peer_debts" ON peer_debts FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_peer_payments" ON peer_payments FOR ALL USING (is_service_role());
CREATE POLICY "service_role_all_user_payment_images" ON user_payment_images FOR ALL USING (is_service_role());

-- 3. Public / Authenticated Read Policies
CREATE POLICY "app_notifications_read_public" ON app_notifications
  FOR SELECT USING (TRUE);

CREATE POLICY "peer_debts_read_public" ON peer_debts
  FOR SELECT USING (TRUE);

CREATE POLICY "peer_payments_read_public" ON peer_payments
  FOR SELECT USING (TRUE);

CREATE POLICY "user_payment_images_read_public" ON user_payment_images
  FOR SELECT USING (TRUE);

-- 4. Update rooms_read_active for Channel privacy
DROP POLICY IF EXISTS "rooms_read_active" ON rooms;
CREATE POLICY "rooms_read_active" ON rooms
  FOR SELECT USING (
    status = 'active' AND (
      type = 'meeting' OR (
        type = 'channel' AND (
          is_service_role() -- Relies on service_role filtering for non-realtime, but for realtime RLS we'd ideally check memberships
          -- Note: Complex membership RLS is typically handled in server actions, 
          -- but we allow generic read here and filter in the backend / realtime topics
        )
      )
    )
  );
