-- ========================================================
-- MyCloud: Complete Database Schema & Row Level Security
-- ========================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------
-- 1. Profiles Table (Linked to auth.users)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 2. Storage Usage & Quota Table
-- Default quota: 10 GB (10 * 1024 * 1024 * 1024 = 10,737,418,240 bytes)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storage_usage (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    used_bytes BIGINT DEFAULT 0 NOT NULL,
    quota_bytes BIGINT DEFAULT 10737418240 NOT NULL,
    file_count INT DEFAULT 0 NOT NULL,
    folder_count INT DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 3. Folders Table
-- Hierarchical folders supporting nested directories
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    is_starred BOOLEAN DEFAULT FALSE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 4. Files Table
-- File metadata; binaries are stored in Cloudflare R2
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size BIGINT NOT NULL DEFAULT 0,
    storage_key TEXT NOT NULL UNIQUE,
    folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    is_starred BOOLEAN DEFAULT FALSE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 5. File Shares Table
-- Granular file permissions (viewer or editor)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL CHECK (permission IN ('viewer', 'editor')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(file_id, shared_with)
);

-- --------------------------------------------------------
-- 6. Folder Shares Table
-- Granular folder permissions (viewer or editor)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.folder_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL CHECK (permission IN ('viewer', 'editor')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(folder_id, shared_with)
);

-- --------------------------------------------------------
-- 7. Upload Sessions Table (Multipart & Resumable)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    storage_key TEXT NOT NULL,
    upload_id TEXT, -- S3/R2 Multipart UploadId
    parts_completed JSONB DEFAULT '[]'::jsonb NOT NULL,
    total_parts INT DEFAULT 1 NOT NULL,
    status TEXT DEFAULT 'in_progress' NOT NULL CHECK (status IN ('in_progress', 'completed', 'aborted', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- Indexes for High Performance
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_folders_owner ON public.folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_deleted ON public.folders(is_deleted);
CREATE INDEX IF NOT EXISTS idx_folders_starred ON public.folders(is_starred);

CREATE INDEX IF NOT EXISTS idx_files_owner ON public.files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON public.files(is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_starred ON public.files(is_starred);
CREATE INDEX IF NOT EXISTS idx_files_mime ON public.files(mime_type);

CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON public.file_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_by ON public.file_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_folder_shares_shared_with ON public.folder_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_folder_shares_shared_by ON public.folder_shares(shared_by);

-- --------------------------------------------------------
-- Row Level Security (RLS) Configuration
-- --------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view their own profile and profiles of others for sharing"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 2. Storage Usage Policies
CREATE POLICY "Users can view their own storage quota and usage"
    ON public.storage_usage FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own storage usage"
    ON public.storage_usage FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own storage usage"
    ON public.storage_usage FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- 3. Folders Policies
CREATE POLICY "Users can view their own folders or shared folders"
    ON public.folders FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.folder_shares
            WHERE folder_shares.folder_id = folders.id
            AND folder_shares.shared_with = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own folders"
    ON public.folders FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own folders or folders shared with editor permission"
    ON public.folders FOR UPDATE
    TO authenticated
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.folder_shares
            WHERE folder_shares.folder_id = folders.id
            AND folder_shares.shared_with = auth.uid()
            AND folder_shares.permission = 'editor'
        )
    );

CREATE POLICY "Users can delete their own folders"
    ON public.folders FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- 4. Files Policies
CREATE POLICY "Users can view their own files or shared files"
    ON public.files FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.file_shares
            WHERE file_shares.file_id = files.id
            AND file_shares.shared_with = auth.uid()
        ) OR
        (
            folder_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM public.folder_shares
                WHERE folder_shares.folder_id = files.folder_id
                AND folder_shares.shared_with = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert their own files"
    ON public.files FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own files or files shared with editor permission"
    ON public.files FOR UPDATE
    TO authenticated
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.file_shares
            WHERE file_shares.file_id = files.id
            AND file_shares.shared_with = auth.uid()
            AND file_shares.permission = 'editor'
        ) OR
        (
            folder_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM public.folder_shares
                WHERE folder_shares.folder_id = files.folder_id
                AND folder_shares.shared_with = auth.uid()
                AND folder_shares.permission = 'editor'
            )
        )
    );

CREATE POLICY "Users can delete their own files"
    ON public.files FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- 5. Shares Policies
CREATE POLICY "Users can view shares they created or received"
    ON public.file_shares FOR SELECT
    TO authenticated
    USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "Users can share their own files"
    ON public.file_shares FOR INSERT
    TO authenticated
    WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can update shares they created"
    ON public.file_shares FOR UPDATE
    TO authenticated
    USING (shared_by = auth.uid());

CREATE POLICY "Users can delete shares they created or remove themselves from shared"
    ON public.file_shares FOR DELETE
    TO authenticated
    USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "Users can view folder shares they created or received"
    ON public.folder_shares FOR SELECT
    TO authenticated
    USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "Users can share their own folders"
    ON public.folder_shares FOR INSERT
    TO authenticated
    WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can update folder shares they created"
    ON public.folder_shares FOR UPDATE
    TO authenticated
    USING (shared_by = auth.uid());

CREATE POLICY "Users can delete folder shares they created or remove themselves"
    ON public.folder_shares FOR DELETE
    TO authenticated
    USING (shared_by = auth.uid() OR shared_with = auth.uid());

-- 6. Upload Sessions Policies
CREATE POLICY "Users manage their own upload sessions"
    ON public.upload_sessions FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- --------------------------------------------------------
-- Triggers and Stored Procedures
-- --------------------------------------------------------

-- Automatic profile and storage initialization upon user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.storage_usage (user_id, used_bytes, quota_bytes, file_count, folder_count)
    VALUES (
        NEW.id,
        0,
        10737418240, -- 10 GB default
        0,
        0
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Maintain storage usage on file additions/deletions
CREATE OR REPLACE FUNCTION public.handle_file_storage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.storage_usage
        SET used_bytes = used_bytes + NEW.size,
            file_count = file_count + 1,
            updated_at = NOW()
        WHERE user_id = NEW.owner_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.storage_usage
        SET used_bytes = GREATEST(0, used_bytes - OLD.size),
            file_count = GREATEST(0, file_count - 1),
            updated_at = NOW()
        WHERE user_id = OLD.owner_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_file_storage_change ON public.files;
CREATE TRIGGER on_file_storage_change
    AFTER INSERT OR DELETE ON public.files
    FOR EACH ROW EXECUTE FUNCTION public.handle_file_storage_change();

-- Maintain folder count on folder creations/deletions
CREATE OR REPLACE FUNCTION public.handle_folder_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.storage_usage
        SET folder_count = folder_count + 1,
            updated_at = NOW()
        WHERE user_id = NEW.owner_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.storage_usage
        SET folder_count = GREATEST(0, folder_count - 1),
            updated_at = NOW()
        WHERE user_id = OLD.owner_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_folder_change ON public.folders;
CREATE TRIGGER on_folder_change
    AFTER INSERT OR DELETE ON public.folders
    FOR EACH ROW EXECUTE FUNCTION public.handle_folder_change();

