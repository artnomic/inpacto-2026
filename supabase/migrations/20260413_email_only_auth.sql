-- Email-only auth: remove Supabase Auth dependency, open RLS for anon, insert admin

-- 1. Remove FK constraints that reference auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Ensure profiles.id has a default UUID (standalone, no auth.users dep)
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Ensure email column exists and is unique
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique ON profiles(email);

-- 4. Drop FK constraints on user tables that may reference auth.users directly
ALTER TABLE user_missions    DROP CONSTRAINT IF EXISTS user_missions_user_id_fkey;
ALTER TABLE user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
ALTER TABLE feed_posts        DROP CONSTRAINT IF EXISTS feed_posts_user_id_fkey;
ALTER TABLE post_likes        DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE post_reactions    DROP CONSTRAINT IF EXISTS post_reactions_user_id_fkey;
ALTER TABLE notes             DROP CONSTRAINT IF EXISTS notes_user_id_fkey;
ALTER TABLE wishlist_items    DROP CONSTRAINT IF EXISTS wishlist_items_user_id_fkey;
ALTER TABLE live_questions    DROP CONSTRAINT IF EXISTS live_questions_user_id_fkey;

-- 5. Drop all existing RLS policies and recreate with open anon access
--    (closed conference app — all authenticated users are pre-approved)

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow read for authenticated" ON profiles;
DROP POLICY IF EXISTS "Allow update for owner" ON profiles;
DROP POLICY IF EXISTS "profiles_select_anon" ON profiles;
DROP POLICY IF EXISTS "profiles_update_anon" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_anon" ON profiles;
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT TO anon WITH CHECK (true);

-- feed_posts
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all posts" ON feed_posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON feed_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON feed_posts;
DROP POLICY IF EXISTS "anon_select_feed_posts" ON feed_posts;
DROP POLICY IF EXISTS "anon_insert_feed_posts" ON feed_posts;
DROP POLICY IF EXISTS "anon_update_feed_posts" ON feed_posts;
DROP POLICY IF EXISTS "anon_delete_feed_posts" ON feed_posts;
CREATE POLICY "anon_select_feed_posts" ON feed_posts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_feed_posts" ON feed_posts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_feed_posts" ON feed_posts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_feed_posts" ON feed_posts FOR DELETE TO anon USING (true);

-- post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_post_likes" ON post_likes;
DROP POLICY IF EXISTS "anon_insert_post_likes" ON post_likes;
DROP POLICY IF EXISTS "anon_delete_post_likes" ON post_likes;
CREATE POLICY "anon_select_post_likes" ON post_likes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_post_likes" ON post_likes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_delete_post_likes" ON post_likes FOR DELETE TO anon USING (true);

-- post_reactions
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_post_reactions" ON post_reactions;
DROP POLICY IF EXISTS "anon_insert_post_reactions" ON post_reactions;
DROP POLICY IF EXISTS "anon_delete_post_reactions" ON post_reactions;
CREATE POLICY "anon_select_post_reactions" ON post_reactions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_post_reactions" ON post_reactions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_delete_post_reactions" ON post_reactions FOR DELETE TO anon USING (true);

-- user_missions
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_user_missions" ON user_missions;
DROP POLICY IF EXISTS "anon_insert_user_missions" ON user_missions;
CREATE POLICY "anon_select_user_missions" ON user_missions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_user_missions" ON user_missions FOR INSERT TO anon WITH CHECK (true);

-- user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_user_achievements" ON user_achievements;
DROP POLICY IF EXISTS "anon_insert_user_achievements" ON user_achievements;
CREATE POLICY "anon_select_user_achievements" ON user_achievements FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_user_achievements" ON user_achievements FOR INSERT TO anon WITH CHECK (true);

-- wishlist_items
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_wishlist_items" ON wishlist_items;
DROP POLICY IF EXISTS "anon_insert_wishlist_items" ON wishlist_items;
DROP POLICY IF EXISTS "anon_delete_wishlist_items" ON wishlist_items;
CREATE POLICY "anon_select_wishlist_items" ON wishlist_items FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_wishlist_items" ON wishlist_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_delete_wishlist_items" ON wishlist_items FOR DELETE TO anon USING (true);

-- notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_notes" ON notes;
DROP POLICY IF EXISTS "anon_insert_notes" ON notes;
DROP POLICY IF EXISTS "anon_update_notes" ON notes;
CREATE POLICY "anon_select_notes" ON notes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_notes" ON notes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_notes" ON notes FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- live_questions
ALTER TABLE live_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_live_questions" ON live_questions;
DROP POLICY IF EXISTS "anon_insert_live_questions" ON live_questions;
CREATE POLICY "anon_select_live_questions" ON live_questions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_live_questions" ON live_questions FOR INSERT TO anon WITH CHECK (true);

-- sessions (anon read + update for live toggle)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- missions, achievements, products, event_config (read-only)
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_missions" ON missions;
CREATE POLICY "anon_select_missions" ON missions FOR SELECT TO anon USING (true);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_achievements" ON achievements;
CREATE POLICY "anon_select_achievements" ON achievements FOR SELECT TO anon USING (true);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT TO anon USING (true);

ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_event_config" ON event_config;
CREATE POLICY "anon_select_event_config" ON event_config FOR SELECT TO anon USING (true);

-- 6. Insert admin profile
INSERT INTO profiles (email, name, role)
VALUES ('giovannaberson@gmail.com', 'Admin', 'admin')
ON CONFLICT (email) DO UPDATE SET name = 'Admin', role = 'admin';
