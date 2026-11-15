-- ========================================================
-- MyCloud: Hard-Lock Storage at 10 GB (Cloudflare R2 Free Tier)
-- Migration: 20240101000002_lock_10gb_quota.sql
-- ========================================================

-- 1. Ensure all storage_usage records are locked to 10 GB (10,737,418,240 bytes)
UPDATE public.storage_usage
SET quota_bytes = 10737418240
WHERE quota_bytes != 10737418240;

-- 2. Alter default quota to 10 GB
ALTER TABLE public.storage_usage
    ALTER COLUMN quota_bytes SET DEFAULT 10737418240;

-- 3. Strict Database-Level Guard: Prevent file inserts exceeding 10 GB
CREATE OR REPLACE FUNCTION public.check_10gb_quota_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_used BIGINT := 0;
    v_quota BIGINT := 10737418240; -- 10 GB hard lock
BEGIN
    SELECT COALESCE(used_bytes, 0), LEAST(COALESCE(quota_bytes, 10737418240), 10737418240)
    INTO v_used, v_quota
    FROM public.storage_usage
    WHERE user_id = NEW.owner_id;

    IF (v_used + NEW.size) > v_quota THEN
        RAISE EXCEPTION 'Upload rejected: 10 GB storage limit reached. Current: % bytes, Incoming: % bytes, Max: 10,737,418,240 bytes.',
            v_used, NEW.size;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_10gb_quota_before_insert ON public.files;
CREATE TRIGGER trg_check_10gb_quota_before_insert
    BEFORE INSERT ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION public.check_10gb_quota_before_insert();

