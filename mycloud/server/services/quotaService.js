import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

// Hard limits for both Cloudflare R2 and Cloudinary Free Tiers:
export const HARD_LIMIT_R2_10GB = 10737418240; // 10 GB (Cloudflare R2 Free Tier)
export const HARD_LIMIT_CLOUDINARY_25GB = 26843545600; // 25 GB (Cloudinary Free Plan Limit)
export const HARD_LIMIT_10GB = HARD_LIMIT_R2_10GB;

/**
 * Fetch storage usage for a user with live breakdown of Cloudflare R2 & Cloudinary
 */
export const getUserStorageUsage = async (userId, userSupabase = null) => {
  if (!isSupabaseConfigured) {
    return {
      userId,
      usedBytes: 0,
      quotaBytes: HARD_LIMIT_R2_10GB,
      fileCount: 0,
      folderCount: 0,
      r2: {
        usedBytes: 0,
        quotaBytes: HARD_LIMIT_R2_10GB,
        percent: 0,
        fileCount: 0,
      },
      cloudinary: {
        usedBytes: 0,
        quotaBytes: HARD_LIMIT_CLOUDINARY_25GB,
        percent: 0,
        fileCount: 0,
      },
    };
  }

  const db = userSupabase || supabaseAdmin;

  try {
    // 1. Calculate live sum from non-deleted active files
    const { data: files, error: filesError } = await db
      .from('files')
      .select('size, storage_key')
      .eq('owner_id', userId)
      .eq('is_deleted', false);

    if (filesError) {
      console.warn('Error querying files for quota:', filesError.message);
    }

    const { count: folderCount } = await db
      .from('folders')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('is_deleted', false);

    let r2Used = 0;
    let r2Count = 0;
    let cloudinaryUsed = 0;
    let cloudinaryCount = 0;

    (files || []).forEach((f) => {
      const isCloudinary = (typeof f.storage_key === 'string' && f.storage_key.startsWith('cloudinary:')) || f.storage_provider === 'cloudinary';
      const size = Number(f.size || 0);
      if (isCloudinary) {
        cloudinaryUsed += size;
        cloudinaryCount += 1;
      } else {
        r2Used += size;
        r2Count += 1;
      }
    });

    const totalUsed = r2Used + cloudinaryUsed;
    const totalFiles = (files || []).length;

    // 2. Synchronize with storage_usage table safely
    try {
      await db
        .from('storage_usage')
        .upsert({
          user_id: userId,
          used_bytes: r2Used, // Primary R2 usage in main column
          quota_bytes: HARD_LIMIT_R2_10GB,
          file_count: totalFiles,
          folder_count: folderCount || 0,
          updated_at: new Date().toISOString(),
        });
    } catch (uErr) {
      console.warn('Storage usage sync warning:', uErr.message);
    }

    return {
      userId,
      usedBytes: totalUsed,
      quotaBytes: HARD_LIMIT_R2_10GB,
      fileCount: totalFiles,
      folderCount: folderCount || 0,
      r2: {
        usedBytes: r2Used,
        quotaBytes: HARD_LIMIT_R2_10GB,
        percent: Math.min(100, Math.round((r2Used / HARD_LIMIT_R2_10GB) * 100)),
        fileCount: r2Count,
      },
      cloudinary: {
        usedBytes: cloudinaryUsed,
        quotaBytes: HARD_LIMIT_CLOUDINARY_25GB,
        percent: Math.min(100, Math.round((cloudinaryUsed / HARD_LIMIT_CLOUDINARY_25GB) * 100)),
        fileCount: cloudinaryCount,
      },
    };
  } catch (err) {
    console.error('getUserStorageUsage error:', err);
    return {
      userId,
      usedBytes: 0,
      quotaBytes: HARD_LIMIT_R2_10GB,
      fileCount: 0,
      folderCount: 0,
      r2: {
        usedBytes: 0,
        quotaBytes: HARD_LIMIT_R2_10GB,
        percent: 0,
        fileCount: 0,
      },
      cloudinary: {
        usedBytes: 0,
        quotaBytes: HARD_LIMIT_CLOUDINARY_25GB,
        percent: 0,
        fileCount: 0,
      },
    };
  }
};

/**
 * Check if an upload of specified byte size will exceed provider quota
 */
export const checkQuotaAvailable = async (userId, incomingBytes, isCloudinary = false, userSupabase = null) => {
  const usage = await getUserStorageUsage(userId, userSupabase);

  if (isCloudinary) {
    const projected = usage.cloudinary.usedBytes + incomingBytes;
    const allowed = projected <= HARD_LIMIT_CLOUDINARY_25GB;
    return {
      allowed,
      provider: 'cloudinary',
      usedBytes: usage.cloudinary.usedBytes,
      quotaBytes: HARD_LIMIT_CLOUDINARY_25GB,
      remainingBytes: Math.max(0, HARD_LIMIT_CLOUDINARY_25GB - usage.cloudinary.usedBytes),
      incomingBytes,
      hardLimitLocked: true,
    };
  } else {
    const projected = usage.r2.usedBytes + incomingBytes;
    const allowed = projected <= HARD_LIMIT_R2_10GB;
    return {
      allowed,
      provider: 'r2',
      usedBytes: usage.r2.usedBytes,
      quotaBytes: HARD_LIMIT_R2_10GB,
      remainingBytes: Math.max(0, HARD_LIMIT_R2_10GB - usage.r2.usedBytes),
      incomingBytes,
      hardLimitLocked: true,
    };
  }
};

/**
 * Manually recalculate storage usage from files table
 */
export const recalculateUserStorage = async (userId, userSupabase = null) => {
  if (!isSupabaseConfigured) return;

  const db = userSupabase || supabaseAdmin;

  try {
    const { data: files } = await db
      .from('files')
      .select('size, storage_key')
      .eq('owner_id', userId)
      .eq('is_deleted', false);

    const { count: folderCount } = await db
      .from('folders')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('is_deleted', false);

    let r2Used = 0;
    (files || []).forEach((f) => {
      const isCloudinary = (typeof f.storage_key === 'string' && f.storage_key.startsWith('cloudinary:')) || f.storage_provider === 'cloudinary';
      if (!isCloudinary) {
        r2Used += Number(f.size || 0);
      }
    });

    const count = files?.length || 0;

    await db
      .from('storage_usage')
      .upsert({
        user_id: userId,
        used_bytes: r2Used,
        quota_bytes: HARD_LIMIT_R2_10GB,
        file_count: count,
        folder_count: folderCount || 0,
        updated_at: new Date().toISOString(),
      });
  } catch (err) {
    console.warn('recalculateUserStorage error:', err);
  }
};
