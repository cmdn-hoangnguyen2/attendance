-- Migration: 20260919000004_storage_setup.sql
-- Description: Configure private storage bucket for payment QR/bank images
-- Conforms to docs/02-architecture.md, docs/04-auth-security.md, docs/07-api-backend-phase.md

-- 1. Create the private bucket 'payment-images' if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-images',
  'payment-images',
  FALSE, -- Strictly private! Never allow public read
  5242880, -- 5 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp'] -- Reject SVG and all other formats
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Storage Objects RLS Policies
-- Allow service_role to manage all objects in payment-images bucket
CREATE POLICY "service_role_manage_payment_images"
  ON storage.objects
  FOR ALL
  TO authenticated, service_role
  USING (bucket_id = 'payment-images' AND (auth.jwt() ->> 'role' = 'service_role' OR current_user = 'postgres'))
  WITH CHECK (bucket_id = 'payment-images' AND (auth.jwt() ->> 'role' = 'service_role' OR current_user = 'postgres'));

-- Allow authenticated users to read objects via signed URLs (storage.objects select)
CREATE POLICY "authenticated_read_payment_images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment-images');
