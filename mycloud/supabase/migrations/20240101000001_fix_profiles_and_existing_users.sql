-- ========================================================
-- Quick Fix: Sync Existing Users & Add Profile Insert Policies
-- ========================================================

-- 1. Allow authenticated users to insert their own profile and storage usage
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile"
            ON public.profiles FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'storage_usage' AND policyname = 'Users can insert their own storage usage'
    ) THEN
        CREATE POLICY "Users can insert their own storage usage"
            ON public.storage_usage FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Backfill existing registered users into profiles and storage_usage
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
    raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.storage_usage (user_id, used_bytes, quota_bytes, file_count, folder_count)
SELECT 
    id, 
    0, 
    10737418240, 
    0, 
    0
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

