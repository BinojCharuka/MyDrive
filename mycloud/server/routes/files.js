import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createPresignedDownloadUrl,
  createPresignedPreviewUrl,
  deleteObject,
  deleteObjects,
  putObjectDirect,
  getObjectBody,
} from '../services/r2Service.js';
import {
  createCloudinaryDownloadUrl,
  createCloudinaryPreviewUrl,
  deleteCloudinaryAsset,
  parseCloudinaryStorageKey,
} from '../services/cloudinaryService.js';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { recalculateUserStorage } from '../services/quotaService.js';

const router = express.Router();

/**
 * Helper to check if user has access to a file (with fallback metadata support)
 */
const checkFileAccess = async (fileId, userId, userSupabase = null, fallbackMeta = {}) => {
  if (!isSupabaseConfigured) {
    return {
      allowed: true,
      file: {
        id: fileId,
        name: fallbackMeta.fileName || 'sample-file.pdf',
        storage_key: fallbackMeta.storageKey || `mock-key-${fileId}`,
        mime_type: fallbackMeta.mimeType || 'application/pdf',
        size: fallbackMeta.fileSize || 0,
        owner_id: userId,
      },
      permission: 'owner',
    };
  }

  const db = userSupabase || supabaseAdmin;
  let file = null;

  try {
    const { data } = await db
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (data) {
      file = data;
    }
  } catch (dbErr) {
    console.warn('DB lookup note in checkFileAccess:', dbErr.message);
  }

  if (file) {
    if (file.owner_id === userId) {
      return { allowed: true, file, permission: 'owner' };
    }

    // Check if shared directly
    try {
      const { data: fileShare } = await db
        .from('file_shares')
        .select('permission')
        .eq('file_id', fileId)
        .eq('shared_with', userId)
        .single();

      if (fileShare) {
        return { allowed: true, file, permission: fileShare.permission };
      }

      // Check if parent folder is shared
      if (file.folder_id) {
        const { data: folderShare } = await db
          .from('folder_shares')
          .select('permission')
          .eq('folder_id', file.folder_id)
          .eq('shared_with', userId)
          .single();

        if (folderShare) {
          return { allowed: true, file, permission: folderShare.permission };
        }
      }
    } catch (sErr) {}
  }

  // Graceful fallback if storageKey is provided by client (e.g. demo mode or sync delay)
  if (fallbackMeta.storageKey) {
    return {
      allowed: true,
      file: {
        id: fileId,
        name: fallbackMeta.fileName || 'file',
        storage_key: fallbackMeta.storageKey,
        mime_type: fallbackMeta.mimeType || 'application/octet-stream',
        size: fallbackMeta.fileSize || 0,
        owner_id: userId,
      },
      permission: 'owner',
    };
  }

  return { allowed: false, error: 'File not found or access denied' };
};

/**
 * 1. Generate secure presigned download URL (Supports R2 and Cloudinary)
 */
router.get('/download/:id', requireAuth, async (req, res) => {
  try {
    const fileId = req.params.id;
    const fallbackMeta = {
      storageKey: req.query.storageKey,
      fileName: req.query.fileName,
      mimeType: req.query.mimeType,
      fileSize: Number(req.query.fileSize) || 0,
    };
    const access = await checkFileAccess(fileId, req.user.id, req.supabase, fallbackMeta);

    if (!access.allowed) {
      return res.status(403).json({ error: access.error || 'Access denied' });
    }

    const isCloudinary = access.file.storage_provider === 'cloudinary' || access.file.storage_key?.startsWith('cloudinary:');

    if (isCloudinary) {
      const parsed = parseCloudinaryStorageKey(access.file.storage_key);
      const downloadUrl = createCloudinaryDownloadUrl(
        parsed?.publicId || access.file.storage_key,
        parsed?.resourceType || 'image',
        access.file.name
      );

      return res.json({
        downloadUrl,
        fileName: access.file.name,
        fileSize: access.file.size,
        mimeType: access.file.mime_type,
        provider: 'cloudinary',
      });
    }

    const downloadUrl = await createPresignedDownloadUrl(
      access.file.storage_key,
      access.file.name,
      3600 // 1 hour expiration
    );

    res.json({
      downloadUrl,
      fileName: access.file.name,
      fileSize: access.file.size,
      mimeType: access.file.mime_type,
      provider: 'r2',
    });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Failed to generate download URL', details: err.message });
  }
});

/**
 * 2. Generate secure preview URL for in-browser viewing
 */
router.get('/preview/:id', requireAuth, async (req, res) => {
  try {
    const fileId = req.params.id;
    const fallbackMeta = {
      storageKey: req.query.storageKey,
      fileName: req.query.fileName,
      mimeType: req.query.mimeType,
      fileSize: Number(req.query.fileSize) || 0,
    };
    const access = await checkFileAccess(fileId, req.user.id, req.supabase, fallbackMeta);

    if (!access.allowed) {
      return res.status(403).json({ error: access.error || 'Access denied' });
    }

    const isCloudinary = access.file.storage_provider === 'cloudinary' || access.file.storage_key?.startsWith('cloudinary:');

    if (isCloudinary) {
      const parsed = parseCloudinaryStorageKey(access.file.storage_key);
      const previewUrl = createCloudinaryPreviewUrl(
        parsed?.publicId || access.file.storage_key,
        parsed?.resourceType || 'image'
      );

      return res.json({
        previewUrl,
        fileName: access.file.name,
        mimeType: access.file.mime_type,
        provider: 'cloudinary',
      });
    }

    const previewUrl = await createPresignedPreviewUrl(
      access.file.storage_key,
      access.file.mime_type,
      3600
    );

    res.json({
      previewUrl,
      fileName: access.file.name,
      mimeType: access.file.mime_type,
      provider: 'r2',
    });
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ error: 'Failed to generate preview URL', details: err.message });
  }
});

/**
 * 2b. Fetch raw text content directly from R2 (for in-browser preview & editing)
 */
router.get('/raw/:id', requireAuth, async (req, res) => {
  try {
    const fileId = req.params.id;
    const fallbackMeta = {
      storageKey: req.query.storageKey,
      fileName: req.query.fileName,
      mimeType: req.query.mimeType,
      fileSize: Number(req.query.fileSize) || 0,
    };
    const access = await checkFileAccess(fileId, req.user.id, req.supabase, fallbackMeta);

    if (!access.allowed) {
      return res.status(403).json({ error: access.error || 'Access denied' });
    }

    const content = await getObjectBody(access.file.storage_key);
    res.setHeader('Content-Type', access.file.mime_type || 'text/plain; charset=utf-8');
    res.send(content);
  } catch (err) {
    console.error('Raw content error:', err);
    res.status(500).json({ error: 'Failed to fetch file content', details: err.message });
  }
});

/**
 * 3. Permanently delete a file (Removes from R2/Cloudinary and database)
 */
router.delete('/permanent/:id', requireAuth, async (req, res) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;
    const db = req.supabase || supabaseAdmin;

    if (!isSupabaseConfigured) {
      return res.json({ success: true, message: 'File permanently deleted' });
    }

    // Only owner can permanently delete
    const { data: file, error } = await db
      .from('files')
      .select('storage_key, owner_id')
      .eq('id', fileId)
      .eq('owner_id', userId)
      .single();

    if (error || !file) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }

    // Delete binary from Cloudinary or R2
    const isCloudinary = (file.storage_key && file.storage_key.startsWith('cloudinary:')) || file.storage_provider === 'cloudinary';
    if (isCloudinary) {
      const parsed = parseCloudinaryStorageKey(file.storage_key);
      if (parsed) {
        await deleteCloudinaryAsset(parsed.publicId, parsed.resourceType).catch((cErr) => {
          console.warn('Cloudinary delete warn:', cErr.message);
        });
      }
    } else {
      await deleteObject(file.storage_key).catch((rErr) => {
        console.warn('R2 delete warn:', rErr.message);
      });
    }

    // Delete record from Supabase
    await db.from('files').delete().eq('id', fileId);

    // Recalculate storage usage immediately
    await recalculateUserStorage(userId, db);

    res.json({ success: true, message: 'File permanently deleted' });
  } catch (err) {
    console.error('Permanent delete error:', err);
    res.status(500).json({ error: 'Failed to permanently delete file', details: err.message });
  }
});

/**
 * 4. Permanently delete batch of files (Empty Trash)
 */
router.post('/permanent/batch', requireAuth, async (req, res) => {
  try {
    const { fileIds } = req.body;
    const userId = req.user.id;
    const db = req.supabase || supabaseAdmin;

    if (!Array.isArray(fileIds) || !fileIds.length) {
      return res.status(400).json({ error: 'fileIds array required' });
    }

    if (!isSupabaseConfigured) {
      return res.json({ success: true, deletedCount: fileIds.length });
    }

    // Fetch storage keys and providers for files owned by user
    const { data: files } = await db
      .from('files')
      .select('id, storage_key')
      .eq('owner_id', userId)
      .in('id', fileIds);

    if (files && files.length > 0) {
      const r2Keys = [];

      for (const f of files) {
        const isCloudinary = (f.storage_key && f.storage_key.startsWith('cloudinary:')) || f.storage_provider === 'cloudinary';
        if (isCloudinary) {
          const parsed = parseCloudinaryStorageKey(f.storage_key);
          if (parsed) {
            await deleteCloudinaryAsset(parsed.publicId, parsed.resourceType).catch(() => {});
          }
        } else {
          r2Keys.push(f.storage_key);
        }
      }

      if (r2Keys.length > 0) {
        await deleteObjects(r2Keys).catch(() => {});
      }

      await db.from('files').delete().in('id', files.map((f) => f.id));

      // Recalculate storage usage immediately
      await recalculateUserStorage(userId, db);
    }

    res.json({ success: true, deletedCount: files?.length || 0 });
  } catch (err) {
    console.error('Batch permanent delete error:', err);
    res.status(500).json({ error: 'Failed to empty files', details: err.message });
  }
});

/**
 * 5. Update file text content (In-browser editor)
 */
router.put('/content/:id', requireAuth, async (req, res) => {
  try {
    const fileId = req.params.id;
    const { content, storageKey, fileName, mimeType } = req.body;

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content string required' });
    }

    const fallbackMeta = {
      storageKey,
      fileName,
      mimeType,
    };

    const access = await checkFileAccess(fileId, req.user.id, req.supabase, fallbackMeta);
    if (!access.allowed || (access.permission !== 'owner' && access.permission !== 'editor')) {
      return res.status(403).json({ error: 'Permission denied: must be owner or editor' });
    }

    const file = access.file;
    const newSize = Buffer.byteLength(content, 'utf8');

    // Put new content into R2
    await putObjectDirect(file.storage_key, content, file.mime_type || 'text/plain');

    // Update size & updated_at in Supabase if present
    if (isSupabaseConfigured) {
      try {
        const db = req.supabase || supabaseAdmin;
        await db
          .from('files')
          .update({
            size: newSize,
            updated_at: new Date().toISOString(),
          })
          .eq('id', fileId);
      } catch (dbErr) {
        console.warn('DB update note for edited file:', dbErr.message);
      }
    }

    res.json({
      success: true,
      message: 'File content saved successfully',
      size: newSize,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Update file content error:', err);
    res.status(500).json({ error: 'Failed to save file content', details: err.message });
  }
});

// Mock download / preview responders for development
router.get('/mock-download/:key', (req, res) => {
  const filename = req.query.name || 'sample-file.txt';
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('Mock file content from MyCloud local development server.');
});

router.get('/mock-preview/:key', (req, res) => {
  res.type('text/plain').send('Mock file preview content from MyCloud local development server.');
});

export default router;

