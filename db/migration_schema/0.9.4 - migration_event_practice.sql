-- Migration: Add allow_practice_mode column to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS allow_practice_mode BOOLEAN DEFAULT FALSE;
