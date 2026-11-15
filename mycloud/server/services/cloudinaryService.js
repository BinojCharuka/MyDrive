import { v4 as uuidv4 } from 'uuid';
import cloudinary, { isCloudinaryConfigured, getCloudinaryConfig } from '../config/cloudinary.js';

// Extensions for media routing
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'heic', 'avif']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v', '3gp']);

/**
 * Checks if a file is an image or video that should be routed to Cloudinary
 */
export const isMediaFile = (mimeType = '', fileName = '') => {
  const cleanMime = (mimeType || '').toLowerCase();
  if (cleanMime.startsWith('image/') || cleanMime.startsWith('video/')) {
    return true;
  }

  const ext = (fileName.split('.').pop() || '').toLowerCase();
  return IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext);
};

/**
 * Determines Cloudinary resource_type ('image' or 'video')
 */
export const getCloudinaryResourceType = (mimeType = '', fileName = '') => {
  const cleanMime = (mimeType || '').toLowerCase();
  if (cleanMime.startsWith('video/')) return 'video';
  if (cleanMime.startsWith('image/')) return 'image';

  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return 'image';
};

/**
 * Generates signed direct upload parameters for client-to-Cloudinary upload
 */
export const generateCloudinaryUploadParams = (userId, folderId, fileName, mimeType) => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing or incomplete');
  }

  const resourceType = getCloudinaryResourceType(mimeType, fileName);
  const timestamp = Math.floor(Date.now() / 1000);

  // Clean filename without extension for public_id
  const nameParts = fileName.split('.');
  if (nameParts.length > 1) nameParts.pop();
  const baseName = nameParts.join('.').replace(/[^a-zA-Z0-9._-]/g, '_');

  const publicId = `mycloud/users/${userId}/${folderId || 'root'}/${Date.now()}-${uuidv4()}-${baseName}`;

  // Parameters to sign
  const paramsToSign = {
    public_id: publicId,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const storageKey = `cloudinary:${resourceType}:${publicId}`;

  return {
    uploadUrl,
    publicId,
    signature,
    timestamp,
    apiKey,
    cloudName,
    resourceType,
    storageKey,
  };
};

/**
 * Generate secure download URL with Content-Disposition attachment header
 */
export const createCloudinaryDownloadUrl = (publicId, resourceType = 'image', fileName = '') => {
  const { cloudName } = getCloudinaryConfig();
  if (!cloudName) {
    return `https://res.cloudinary.com/placeholder/${resourceType}/upload/fl_attachment/${publicId}`;
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cloudinary.url(publicId, {
    cloud_name: cloudName,
    resource_type: resourceType,
    flags: `attachment:${encodeURIComponent(safeName)}`,
    secure: true,
  });
};

/**
 * Generate preview URL optimized for browser viewing
 */
export const createCloudinaryPreviewUrl = (publicId, resourceType = 'image') => {
  const { cloudName } = getCloudinaryConfig();
  if (!cloudName) {
    return `https://res.cloudinary.com/placeholder/${resourceType}/upload/${publicId}`;
  }

  return cloudinary.url(publicId, {
    cloud_name: cloudName,
    resource_type: resourceType,
    secure: true,
  });
};

/**
 * Permanently delete asset from Cloudinary
 */
export const deleteCloudinaryAsset = async (publicId, resourceType = 'image') => {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (err) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, err);
    throw err;
  }
};

/**
 * Extract public_id and resource_type from a storage_key
 * Format: "cloudinary:<resourceType>:<public_id>"
 */
export const parseCloudinaryStorageKey = (storageKey = '') => {
  if (!storageKey.startsWith('cloudinary:')) return null;

  const parts = storageKey.split(':');
  if (parts.length >= 3) {
    const resourceType = parts[1];
    const publicId = parts.slice(2).join(':');
    return { resourceType, publicId };
  } else if (parts.length === 2) {
    return { resourceType: 'image', publicId: parts[1] };
  }
  return null;
};
