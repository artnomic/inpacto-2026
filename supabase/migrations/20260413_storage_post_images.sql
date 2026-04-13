-- Fix storage policies for email-only auth (no Supabase Auth session, auth.uid() is always null)
-- Create buckets and use anon-compatible policies (same pattern as other tables)

-- 1. Create post-images bucket (public) if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create avatars bucket (public) if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Drop old policies that use auth.uid() (won't work without Supabase Auth session)
DROP POLICY IF EXISTS "post-images: leitura pública" ON storage.objects;
DROP POLICY IF EXISTS "post-images: usuário autenticado faz upload" ON storage.objects;
DROP POLICY IF EXISTS "post-images public read" ON storage.objects;
DROP POLICY IF EXISTS "post-images authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "post-images owner delete" ON storage.objects;

DROP POLICY IF EXISTS "avatars: leitura pública" ON storage.objects;
DROP POLICY IF EXISTS "avatars: dono faz upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars: dono atualiza" ON storage.objects;

-- 4. Create new anon-compatible policies for post-images
CREATE POLICY "post-images anon select" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'post-images');

CREATE POLICY "post-images anon insert" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "post-images anon delete" ON storage.objects
  FOR DELETE TO anon
  USING (bucket_id = 'post-images');

-- 5. Create new anon-compatible policies for avatars
CREATE POLICY "avatars anon select" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars anon insert" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars anon update" ON storage.objects
  FOR UPDATE TO anon
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');
