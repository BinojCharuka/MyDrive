import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getUserStorageUsage, recalculateUserStorage, HARD_LIMIT_10GB } from '../services/quotaService.js';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

const router = express.Router();

/**
 * 1. Get user storage quota and usage (Hard-locked to 10 GB)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const usage = await getUserStorageUsage(req.user.id, req.supabase);
    res.json({
      ...usage,
      quotaBytes: HARD_LIMIT_10GB,
      hardLocked: true,
      maxAllowedBytes: HARD_LIMIT_10GB,
    });
  } catch (err) {
    console.error('Get quota error:', err);
    res.status(500).json({ error: 'Failed to retrieve storage quota', details: err.message });
  }
});

/**
 * 2. Recalculate storage usage
 */
router.post('/recalculate', requireAuth, async (req, res) => {
  try {
    await recalculateUserStorage(req.user.id, req.supabase);
    const usage = await getUserStorageUsage(req.user.id, req.supabase);
    res.json({
      success: true,
      usage: {
        ...usage,
        quotaBytes: HARD_LIMIT_10GB,
        hardLocked: true,
      },
    });
  } catch (err) {
    console.error('Recalculate error:', err);
    res.status(500).json({ error: 'Failed to recalculate storage', details: err.message });
  }
});

/**
 * 3. Update quota (Strictly locked to 10 GB max to protect free tier)
 */
router.post('/update-quota', requireAuth, async (req, res) => {
  try {
    const { newQuotaBytes } = req.body;

    if (!newQuotaBytes || typeof newQuotaBytes !== 'number' || newQuotaBytes <= 0) {
      return res.status(400).json({ error: 'Invalid newQuotaBytes value' });
    }

    if (newQuotaBytes > HARD_LIMIT_10GB) {
      return res.status(400).json({
        error: '10 GB Free Tier Locked',
        message: 'MyCloud storage is locked at 10 GB (Cloudflare R2 free tier limit). Upgrades beyond 10 GB are restricted.',
      });
    }

    if (isSupabaseConfigured) {
      const db = req.supabase || supabaseAdmin;
      await db
        .from('storage_usage')
        .update({ quota_bytes: newQuotaBytes, updated_at: new Date().toISOString() })
        .eq('user_id', req.user.id);
    }

    res.json({ success: true, message: 'Quota updated successfully', newQuotaBytes });
  } catch (err) {
    console.error('Update quota error:', err);
    res.status(500).json({ error: 'Failed to update quota', details: err.message });
  }
});

export default router;

