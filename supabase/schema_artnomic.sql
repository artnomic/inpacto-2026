-- ============================================================
-- SCHEMA COMPLETO — inpacto-2026 / Supabase artnomic
-- Projeto: lrpjeqlnztpbjmashctv
-- Gerado em: 2026-04-10
-- ============================================================
-- Aplique este arquivo inteiro via Supabase SQL Editor ou MCP.
-- ============================================================


-- ─── EXTENSÕES ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─── 1. PROFILES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT,
  avatar_url  TEXT,
  church      TEXT,
  city        TEXT,
  bio         TEXT,
  age         INTEGER,
  role        TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  xp          INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: leitura pública"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles: dono pode atualizar"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles: dono pode inserir"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger: cria profile automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: atualiza updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─── 2. EVENT_CONFIG ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_config (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name       TEXT        NOT NULL DEFAULT 'Inpacto 2026',
  event_start_date DATE        NOT NULL,
  event_end_date   DATE        NOT NULL,
  total_days       INTEGER     NOT NULL DEFAULT 3,
  tagline          TEXT        NOT NULL DEFAULT 'Saturados do Espírito',
  primary_color    TEXT        NOT NULL DEFAULT '#FA1462',
  logo_url         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_config: leitura pública"
  ON event_config FOR SELECT USING (true);

CREATE POLICY "event_config: apenas admin escreve"
  ON event_config FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ─── 3. SESSIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  day         INTEGER     NOT NULL DEFAULT 1,
  title       TEXT        NOT NULL,
  speaker     TEXT,
  type        TEXT        NOT NULL DEFAULT 'plenaria'
                CHECK (type IN ('plenaria', 'louvor', 'oficina', 'talkshow', 'break', 'especial')),
  start_time  TEXT,        -- formato HH:MM
  end_time    TEXT,        -- formato HH:MM
  description TEXT,
  is_live     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garante que apenas uma sessão pode estar ao vivo por vez
CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_live_idx
  ON sessions (is_live) WHERE is_live = TRUE;

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: leitura pública"
  ON sessions FOR SELECT USING (true);

CREATE POLICY "sessions: apenas admin escreve"
  ON sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ─── 4. MISSIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS missions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  xp_reward   INTEGER     NOT NULL DEFAULT 50,
  icon        TEXT        NOT NULL DEFAULT '⭐',
  day         INTEGER     NOT NULL DEFAULT 1,
  order_index INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "missions: leitura pública"
  ON missions FOR SELECT USING (true);

CREATE POLICY "missions: apenas admin escreve"
  ON missions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ─── 5. USER_MISSIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_missions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id   UUID        NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, mission_id)
);

ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_missions: usuário lê os próprios"
  ON user_missions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_missions: usuário insere os próprios"
  ON user_missions FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ─── 6. ACHIEVEMENTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL UNIQUE,
  icon        TEXT        NOT NULL DEFAULT '🏆',
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements: leitura pública"
  ON achievements FOR SELECT USING (true);

CREATE POLICY "achievements: apenas admin escreve"
  ON achievements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ─── 7. USER_ACHIEVEMENTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID        NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_achievements: usuário lê os próprios"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_achievements: usuário insere os próprios"
  ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ─── 8. LIVE_QUESTIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_questions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE live_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_questions: admin lê todas"
  ON live_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "live_questions: usuário insere as próprias"
  ON live_questions FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ─── 9. FEED_POSTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_posts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'comment'
               CHECK (type IN ('comment', 'prayer', 'announcement')),
  content    TEXT        NOT NULL,
  image_url  TEXT,
  is_pinned  BOOLEAN     NOT NULL DEFAULT FALSE,
  parent_id  UUID        REFERENCES feed_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feed_posts_created_at_idx ON feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS feed_posts_is_pinned_idx  ON feed_posts (is_pinned DESC);
CREATE INDEX IF NOT EXISTS feed_posts_parent_id_idx  ON feed_posts (parent_id);

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_posts: leitura pública"
  ON feed_posts FOR SELECT USING (true);

CREATE POLICY "feed_posts: usuário autenticado insere"
  ON feed_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "feed_posts: dono exclui o próprio post"
  ON feed_posts FOR DELETE USING (auth.uid() = user_id);

-- Admin pode excluir qualquer post
CREATE POLICY "feed_posts: admin exclui qualquer post"
  ON feed_posts FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admin pode atualizar qualquer post (pin/unpin)
CREATE POLICY "feed_posts: admin atualiza qualquer post"
  ON feed_posts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ─── 10. POST_LIKES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_likes: leitura pública"
  ON post_likes FOR SELECT USING (true);

CREATE POLICY "post_likes: usuário gerencia os próprios"
  ON post_likes FOR ALL USING (auth.uid() = user_id);


-- ─── 11. POST_REACTIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_reactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, emoji)
);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_reactions: leitura pública"
  ON post_reactions FOR SELECT USING (true);

CREATE POLICY "post_reactions: usuário gerencia as próprias"
  ON post_reactions FOR ALL USING (auth.uid() = user_id);


-- ─── 12. NOTES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, session_id)
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes: usuário gerencia as próprias"
  ON notes FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS notes_updated_at ON notes;
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─── 13. PRODUCTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT        NOT NULL DEFAULT 'shop' CHECK (category IN ('shop', 'food')),
  name        TEXT        NOT NULL,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  emoji       TEXT        NOT NULL DEFAULT '🛍️',
  description TEXT,
  venue       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products: leitura pública"
  ON products FOR SELECT USING (true);

CREATE POLICY "products: apenas admin escreve"
  ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ─── 14. WISHLIST_ITEMS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_items: usuário gerencia os próprios"
  ON wishlist_items FOR ALL USING (auth.uid() = user_id);


-- ─── 15. VIEW: RANKING ───────────────────────────────────────────────────────
CREATE OR REPLACE VIEW ranking AS
SELECT
  p.id,
  p.name,
  p.church,
  p.avatar_url,
  p.xp,
  ROW_NUMBER() OVER (ORDER BY p.xp DESC) AS position
FROM profiles p
WHERE p.name IS NOT NULL AND p.name <> ''
ORDER BY p.xp DESC;


-- ─── 16. RPC: INCREMENT_XP ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_xp(amount INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET xp = xp + amount
  WHERE id = auth.uid();
END;
$$;


-- ─── 17. RPC: CHECK_AND_UNLOCK_ACHIEVEMENT ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievement(achievement_key TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_achievement_id UUID;
  v_user_id        UUID := auth.uid();
BEGIN
  SELECT id INTO v_achievement_id
  FROM achievements
  WHERE key = achievement_key
  LIMIT 1;

  IF v_achievement_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO user_achievements (user_id, achievement_id)
  VALUES (v_user_id, v_achievement_id)
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;


-- ─── 18. STORAGE BUCKETS ─────────────────────────────────────────────────────
-- Execute via Supabase Dashboard > Storage, ou via API:
-- Bucket: avatars       (público)
-- Bucket: post-images   (público)
--
-- Políticas de storage (Storage Policies):
-- avatars:
--   SELECT: true (público)
--   INSERT: auth.uid()::text = (storage.foldername(name))[1]
--   UPDATE: auth.uid()::text = (storage.foldername(name))[1]
-- post-images:
--   SELECT: true (público)
--   INSERT: auth.uid() IS NOT NULL
--
-- Exemplo de SQL para políticas de storage (execute no SQL editor):
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas para avatars
CREATE POLICY "avatars: leitura pública" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars: dono faz upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: dono atualiza" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Políticas para post-images
CREATE POLICY "post-images: leitura pública" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "post-images: usuário autenticado faz upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images' AND auth.uid() IS NOT NULL
  );


-- ─── FIM DO SCHEMA ────────────────────────────────────────────────────────────
