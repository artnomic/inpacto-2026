-- app_config: key-value store for global runtime settings
-- active_day: 0 = no day active, 1 = Day 1, 2 = Day 2
CREATE TABLE IF NOT EXISTS public.app_config (
  key   TEXT PRIMARY KEY,
  value TEXT
);

INSERT INTO app_config (key, value) VALUES ('active_day', '0') ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='app_config' AND policyname='allow_anon_select'
  ) THEN
    CREATE POLICY "allow_anon_select" ON public.app_config FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='app_config' AND policyname='allow_anon_update'
  ) THEN
    CREATE POLICY "allow_anon_update" ON public.app_config FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;
