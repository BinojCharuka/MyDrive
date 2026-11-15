import { useState, useEffect } from 'react';
import { FileItem } from '../types';
import api from '../lib/api';

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'zeotuhzt';

// Cache presigned R2 preview URLs in memory to avoid redundant network requests
const previewUrlCache = new Map<string, string>();

/**
 * Checks if a file is an image based on mimeType or filename extension
 */
export const isImageFile = (file: { mime_type?: string; name: string }): boolean => {
  if (file.mime_type && file.mime_type.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp|gif|svg|avif|heic|bmp|ico)$/i.test(file.name);
};

/**
 * Checks if a file is a video based on mimeType or filename extension
 */
export const isVideoFile = (file: { mime_type?: string; name: string }): boolean => {
  if (file.mime_type && file.mime_type.startsWith('video/')) return true;
  return /\.(mp4|mov|webm|mkv|avi|wmv|m4v|3gp)$/i.test(file.name);
};

/**
 * Construct direct Cloudinary thumbnail URL for images or videos
 */
export const getCloudinaryThumbnailUrl = (
  storageKey?: string,
  width = 360,
  height = 240
): string | null => {
  if (!storageKey || !storageKey.startsWith('cloudinary:')) return null;

  const parts = storageKey.split(':');
  if (parts.length >= 3) {
    const resourceType = parts[1] || 'image';
    const publicId = parts.slice(2).join(':');

    if (resourceType === 'video') {
      // Cloudinary video thumbnail extraction at 0 seconds
      return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/c_fill,w_${width},h_${height},q_auto,so_0/${publicId}.jpg`;
    }

    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${publicId}`;
  }

  return null;
};

/**
 * React hook to get a thumbnail URL for any FileItem (Cloudinary direct or R2 presigned)
 */
export const useFileThumbnail = (file: FileItem) => {
  const isImage = isImageFile(file);
  const isVideo = isVideoFile(file);
  const isMedia = isImage || isVideo;

  // 1. Direct Cloudinary thumbnail (synchronous, 0ms latency)
  const cloudinaryUrl = getCloudinaryThumbnailUrl(file.storage_key);

  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(cloudinaryUrl);
  const [loading, setLoading] = useState<boolean>(!cloudinaryUrl && isMedia);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // If it's a Cloudinary file, we already computed the URL synchronously
    if (cloudinaryUrl) {
      setThumbnailUrl(cloudinaryUrl);
      setLoading(false);
      return;
    }

    // If it's not a media file, don't attempt to load an image thumbnail
    if (!isMedia) {
      setThumbnailUrl(null);
      setLoading(false);
      return;
    }

    // Check in-memory cache first
    if (previewUrlCache.has(file.id)) {
      setThumbnailUrl(previewUrlCache.get(file.id)!);
      setLoading(false);
      return;
    }

    // Fetch presigned URL from backend for R2 images
    let isMounted = true;
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          storageKey: file.storage_key || '',
          fileName: file.name,
          mimeType: file.mime_type || 'application/octet-stream',
          fileSize: String(file.size || 0),
        }).toString();

        const res = await api.get<{ previewUrl: string }>(`/api/files/preview/${file.id}?${queryParams}`);
        if (isMounted && res.previewUrl) {
          previewUrlCache.set(file.id, res.previewUrl);
          setThumbnailUrl(res.previewUrl);
        }
      } catch {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [file.id, file.storage_key, file.name, file.mime_type, isMedia, cloudinaryUrl]);

  return {
    thumbnailUrl: error ? null : thumbnailUrl,
    isImage,
    isVideo,
    isMedia,
    loading,
    error,
    setError,
  };
};

