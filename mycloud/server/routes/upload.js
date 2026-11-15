import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import {
  createPresignedUploadUrl,
  createMultipartUpload,
  createPresignedPartUrl,
  completeMultipartUpload,
  abortMultipartUpload,
} from '../services/r2Service.js';
import { checkQuotaAvailable, recalculateUserStorage } from '../services/quotaService.js';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { isMediaFile, generateCloudinaryUploadParams } from '../services/cloudinaryService.js';

const router = express.Router();

const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5 MB threshold for multipart upload
const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB per part

/**
 * 1. Initialize upload (validates quota, decides single vs multipart, generates presigned URLs)
 */
router.post('/init', requireAuth, uploadLimiter, async (req, res) => {
  try {
    const { fileName, fileSize, mimeType, folderId } = req.body;

    if (!fileName || typeof fileSize !== 'number' || fileSize <= 0) {
      return res.status(400).json({ error: 'Invalid file parameters' });
    }

    const userId = req.user.id;

    // Hard check: File size cannot exceed 10 GB (10,737,418,240 bytes)
    const HARD_LIMIT_10GB = 10737418240;
    if (fileSize > HARD_LIMIT_10GB) {
      return res.status(400).json({
        error: 'File Exceeds 10 GB Free Tier Lock',
        message: 'MyCloud storage is locked at 10 GB. Files larger than 10 GB cannot be uploaded.',
      });
    }

    // Storage Routing: Photos, images and videos route to Cloudinary (25 GB Limit), others to Cloudflare R2 (10 GB Limit)
    const isMedia = isMediaFile(mimeType, fileName);
    const isCloudinary = isMedia && isCloudinaryConfigured;

    // Check quota against provider limit (25 GB for Cloudinary, 10 GB for R2)
    const quotaCheck = await checkQuotaAvailable(userId, fileSize, isCloudinary, req.supabase);
    if (!quotaCheck.allowed) {
      const limitLabel = isCloudinary ? '25 GB Cloudinary Media' : '10 GB Cloudflare R2';
      return res.status(403).json({
        error: `${limitLabel} Quota Exceeded`,
        message: `Upload of ${(fileSize / (1024 * 1024)).toFixed(2)} MB exceeds your ${limitLabel} storage limit. You have ${(quotaCheck.remainingBytes / (1024 * 1024)).toFixed(2)} MB remaining.`,
      });
    }

    if (isCloudinary) {
      try {
        const cloudinaryParams = generateCloudinaryUploadParams(userId, folderId, fileName, mimeType);
        return res.json({
          type: 'cloudinary',
          provider: 'cloudinary',
          uploadUrl: cloudinaryParams.uploadUrl,
          publicId: cloudinaryParams.publicId,
          signature: cloudinaryParams.signature,
          timestamp: cloudinaryParams.timestamp,
          apiKey: cloudinaryParams.apiKey,
          cloudName: cloudinaryParams.cloudName,
          resourceType: cloudinaryParams.resourceType,
          storageKey: cloudinaryParams.storageKey,
          fileSize,
          fileName,
          mimeType,
          folderId: folderId || null,
        });
      } catch (cErr) {
        console.warn('Cloudinary upload initialization warning, falling back to Cloudflare R2:', cErr.message);
      }
    }

    // Default: Route documents, archives, code and non-media files to Cloudflare R2
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `users/${userId}/${folderId || 'root'}/${Date.now()}-${uuidv4()}-${safeName}`;

    // Decide single-part vs multipart for R2
    if (fileSize <= MULTIPART_THRESHOLD) {
      // Single-part upload
      const uploadUrl = await createPresignedUploadUrl(storageKey, mimeType);

      return res.json({
        type: 'single',
        provider: 'r2',
        storageKey,
        uploadUrl,
        fileSize,
        fileName,
        mimeType,
        folderId: folderId || null,
      });
    } else {
      // Multipart upload for large files
      const totalParts = Math.ceil(fileSize / CHUNK_SIZE);
      const { uploadId } = await createMultipartUpload(storageKey, mimeType);

      // Record upload session in DB
      let sessionId = uuidv4();
      if (isSupabaseConfigured) {
        const db = req.supabase || supabaseAdmin;
        const { data: session } = await db
          .from('upload_sessions')
          .insert({
            user_id: userId,
            file_name: fileName,
            file_size: fileSize,
            mime_type: mimeType || 'application/octet-stream',
            folder_id: folderId || null,
            storage_key: storageKey,
            upload_id: uploadId,
            total_parts: totalParts,
            status: 'in_progress',
          })
          .select('id')
          .single();

        if (session) sessionId = session.id;
      }

      return res.json({
        type: 'multipart',
        provider: 'r2',
        sessionId,
        storageKey,
        uploadId,
        chunkSize: CHUNK_SIZE,
        totalParts,
        fileSize,
        fileName,
        mimeType,
        folderId: folderId || null,
      });
    }
  } catch (err) {
    console.error('Upload init error:', err);
    res.status(500).json({ error: 'Failed to initialize upload', details: err.message });
  }
});

/**
 * 2. Get presigned URL for a specific part number in multipart upload
 */
router.post('/part-url', requireAuth, async (req, res) => {
  try {
    const { storageKey, uploadId, partNumber } = req.body;

    if (!storageKey || !uploadId || !partNumber) {
      return res.status(400).json({ error: 'Missing required parameters (storageKey, uploadId, partNumber)' });
    }

    const partUrl = await createPresignedPartUrl(storageKey, uploadId, Number(partNumber));
    res.json({ partNumber, partUrl });
  } catch (err) {
    console.error('Part URL error:', err);
    res.status(500).json({ error: 'Failed to generate part URL', details: err.message });
  }
});

/**
 * 3. Complete multipart upload
 */
router.post('/complete', requireAuth, async (req, res) => {
  try {
    const { sessionId, storageKey, uploadId, parts, fileName, fileSize, mimeType, folderId } = req.body;

    if (!storageKey || !uploadId || !Array.isArray(parts)) {
      return res.status(400).json({ error: 'Missing required parameters for completing multipart upload' });
    }

    // Complete on R2
    const result = await completeMultipartUpload(storageKey, uploadId, parts);

    // Record file in Supabase files table
    let fileRecord = {
      id: uuidv4(),
      owner_id: req.user.id,
      name: fileName,
      mime_type: mimeType || 'application/octet-stream',
      size: fileSize,
      storage_key: storageKey,
      folder_id: folderId || null,
      is_starred: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const db = req.supabase || supabaseAdmin;

      // Auto-ensure user profile exists in case user registered before migration
      try {
        await db.from('profiles').upsert({
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'User',
        }, { onConflict: 'id' });
      } catch (pErr) {
        console.warn('Profile auto-ensure warning:', pErr);
      }

      let insertPayload = {
        owner_id: req.user.id,
        name: fileName,
        mime_type: mimeType || 'application/octet-stream',
        size: fileSize,
        storage_key: storageKey,
        folder_id: folderId || null,
      };

      try {
        const { data, error } = await db
          .from('files')
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          console.warn('Supabase files table insert note (will use generated fileRecord):', error.message);
        } else if (data) {
          fileRecord = data;
        }
      } catch (insertErr) {
        console.warn('DB insert exception handled gracefully:', insertErr.message);
      }

      // Update upload session to completed
      if (sessionId) {
        try {
          await db
            .from('upload_sessions')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', sessionId);
        } catch (sErr) {}
      }

      // Recalculate storage quota immediately
      await recalculateUserStorage(req.user.id, db);
    }

    res.json({
      success: true,
      file: fileRecord,
      location: result.Location,
    });
  } catch (err) {
    console.error('Multipart complete error:', err);
    res.status(500).json({ error: 'Failed to complete multipart upload', details: err.message });
  }
});

/**
 * 4. Confirm upload completion (supports both Cloudflare R2 and Cloudinary)
 */
router.post('/confirm-single', requireAuth, async (req, res) => {
  try {
    const { storageKey, fileName, fileSize, mimeType, folderId, provider } = req.body;

    if (!storageKey || !fileName) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const storageProvider = provider || (storageKey.startsWith('cloudinary:') ? 'cloudinary' : 'r2');

    let fileRecord = {
      id: uuidv4(),
      owner_id: req.user.id,
      name: fileName,
      mime_type: mimeType || 'application/octet-stream',
      size: fileSize || 0,
      storage_key: storageKey,
      storage_provider: storageProvider,
      folder_id: folderId || null,
      is_starred: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const db = req.supabase || supabaseAdmin;

      // Auto-ensure user profile exists in case user registered before migration
      try {
        await db.from('profiles').upsert({
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'User',
        }, { onConflict: 'id' });
      } catch (pErr) {
        console.warn('Profile auto-ensure warning:', pErr);
      }

      let insertPayload = {
        owner_id: req.user.id,
        name: fileName,
        mime_type: mimeType || 'application/octet-stream',
        size: fileSize || 0,
        storage_key: storageKey,
        folder_id: folderId || null,
      };

      try {
        const { data, error } = await db
          .from('files')
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          console.warn('Supabase files table insert note (will use generated fileRecord):', error.message);
        } else if (data) {
          fileRecord = {
            ...data,
            storage_provider: storageProvider,
          };
        }
      } catch (insertErr) {
        console.warn('DB insert exception handled gracefully:', insertErr.message);
      }

      // Recalculate storage quota immediately
      await recalculateUserStorage(req.user.id, db);
    }

    res.json({
      success: true,
      file: fileRecord,
    });
  } catch (err) {
    console.error('Confirm upload error:', err);
    res.status(500).json({ error: 'Failed to confirm upload', details: err.message });
  }
});

/**
 * 5. Abort multipart upload
 */
router.post('/abort', requireAuth, async (req, res) => {
  try {
    const { sessionId, storageKey, uploadId } = req.body;

    if (storageKey && uploadId) {
      await abortMultipartUpload(storageKey, uploadId);
    }

    if (sessionId && isSupabaseConfigured) {
      const db = req.supabase || supabaseAdmin;
      await db
        .from('upload_sessions')
        .update({ status: 'aborted', updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    res.json({ success: true, message: 'Upload aborted' });
  } catch (err) {
    console.error('Abort upload error:', err);
    res.status(500).json({ error: 'Failed to abort upload', details: err.message });
  }
});

// Mock upload handler for development testing when R2 credentials aren't active yet
router.put('/mock-upload/:key', (req, res) => {
  res.status(200).send();
});
router.put('/mock-part/:key/:part', (req, res) => {
  res.setHeader('ETag', `"${uuidv4()}"`);
  res.status(200).send();
});

export default router;

