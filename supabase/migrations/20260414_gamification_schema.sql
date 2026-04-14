-- Migration 1: Add gamification columns to existing tables

ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'auto';
-- 'auto' | 'text' | 'evidence' | 'quiz' | 'admin' | 'checkin'
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS eixo TEXT DEFAULT 'geral';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS participation_xp INTEGER DEFAULT 0;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.user_missions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
-- 'completed' | 'pending'
ALTER TABLE public.user_missions ADD COLUMN IF NOT EXISTS evidence_url TEXT;
ALTER TABLE public.user_missions ADD COLUMN IF NOT EXISTS response_text TEXT;

ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS condition_key TEXT;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS condition_value TEXT;
