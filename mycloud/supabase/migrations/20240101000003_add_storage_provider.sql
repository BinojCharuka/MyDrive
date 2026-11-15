-- ========================================================
-- Migration: Add storage_provider to files table
-- Distinguishes between Cloudflare R2 and Cloudinary assets
-- ========================================================

ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'r2';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'files_storage_provider_check'
    ) THEN
        ALTER TABLE public.files 
        ADD CONSTRAINT files_storage_provider_check 
        CHECK (storage_provider IN ('r2', 'cloudinary'));
    END IF;
END $$;
