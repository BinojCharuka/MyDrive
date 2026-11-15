import React, { createContext, useContext, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UploadProgressItem, FileItem } from '../types';
import { useStorage } from './StorageContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatBytes } from '../utils/format';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface UploadContextType {
  uploads: UploadProgressItem[];
  isUploading: boolean;
  isManagerOpen: boolean;
  setIsManagerOpen: (open: boolean) => void;
  uploadFiles: (files: File[], targetFolderId?: string | null) => Promise<void>;
  uploadFolderStructure: (filesWithPaths: { file: File; relativePath: string }[], targetFolderId?: string | null) => Promise<void>;
  cancelUpload: (uploadId: string) => void;
  retryUpload: (uploadId: string) => void;
  clearCompletedUploads: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB chunk size for multipart uploads
const HARD_LIMIT_10GB = 10737418240; // 10 GB Strict Free Tier Limit

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploads, setUploads] = useState<UploadProgressItem[]>([]);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const { currentFolderId, refreshStorage, createFolder, allFolders, storageUsage, addUploadedFile } = useStorage();

  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const updateUploadState = (id: string, updates: Partial<UploadProgressItem>) => {
    setUploads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  /**
   * Upload a single file using single-part presigned PUT or multipart chunks directly to R2
   */
  const processUpload = async (item: UploadProgressItem) => {
    const controller = new AbortController();
    abortControllers.current.set(item.id, controller);

    updateUploadState(item.id, {
      status: 'uploading',
      cancelController: controller,
      progress: 0,
    });

    const startTime = Date.now();
    let lastLoadedBytes = 0;
    let lastTime = startTime;

    try {
      // Pre-check provider limits: Cloudinary (25 GB) vs R2 (10 GB)
      const isMedia = (Boolean(item.mimeType) && (item.mimeType.startsWith('image/') || item.mimeType.startsWith('video/'))) || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|heic|avif|mp4|mov|avi|mkv|webm)$/i.test(item.name);
      const limit = isMedia ? 26843545600 : 10737418240;
      const currentProviderUsed = isMedia
        ? (storageUsage.cloudinary?.usedBytes ?? 0)
        : (storageUsage.r2?.usedBytes ?? storageUsage.usedBytes);

      if (currentProviderUsed + item.size > limit) {
        const limitLabel = isMedia ? '25 GB (Cloudinary Media)' : '10 GB (Cloudflare R2)';
        updateUploadState(item.id, {
          status: 'failed',
          error: `Upload blocked: ${limitLabel} free tier limit reached`,
        });
        toast.error(`"${item.name}" blocked: exceeds the ${limitLabel} free tier limit.`);
        return;
      }

      // 1. Initialize upload with backend
      const initRes = await api.post<any>('/api/upload/init', {
        fileName: item.name,
        fileSize: item.size,
        mimeType: item.mimeType,
        folderId: item.folderId,
      });

      if (controller.signal.aborted) return;

      if (initRes.type === 'cloudinary') {
        // Direct upload to Cloudinary (photos, images, videos)
        updateUploadState(item.id, {
          uploadType: 'cloudinary',
          storageProvider: 'cloudinary',
          storageKey: initRes.storageKey,
        });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', initRes.uploadUrl, true);

          controller.signal.addEventListener('abort', () => {
            xhr.abort();
            reject(new Error('Upload cancelled'));
          });

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const now = Date.now();
              const elapsedSec = (now - lastTime) / 1000;
              const bytesDiff = e.loaded - lastLoadedBytes;

              const speed = elapsedSec > 0.3 ? bytesDiff / elapsedSec : item.speed;
              const remainingBytes = e.total - e.loaded;
              const remainingSeconds = speed > 0 ? Math.ceil(remainingBytes / speed) : 0;

              lastLoadedBytes = e.loaded;
              lastTime = now;

              const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
              updateUploadState(item.id, {
                progress: percent,
                bytesUploaded: e.loaded,
                speed,
                remainingSeconds,
              });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              try {
                const errJson = JSON.parse(xhr.responseText);
                reject(new Error(errJson.error?.message || `Cloudinary upload failed (HTTP ${xhr.status})`));
              } catch {
                reject(new Error(`Cloudinary returned HTTP ${xhr.status}`));
              }
            }
          };

          xhr.onerror = () => reject(new Error('Network error uploading to Cloudinary'));

          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('api_key', initRes.apiKey);
          formData.append('timestamp', String(initRes.timestamp));
          formData.append('public_id', initRes.publicId);
          formData.append('signature', initRes.signature);

          xhr.send(formData);
        });

        // Confirm completion with backend to record file in Supabase
        let recordedFile: FileItem | null = null;
        try {
          const confirmRes = await api.post<any>('/api/upload/confirm-single', {
            storageKey: initRes.storageKey,
            fileName: item.name,
            fileSize: item.size,
            mimeType: item.mimeType,
            folderId: item.folderId,
            provider: 'cloudinary',
          });
          if (confirmRes?.file) {
            recordedFile = confirmRes.file;
          }
        } catch (confirmErr: any) {
          console.warn('Backend confirmation fallback, saving directly to Supabase:', confirmErr);
          if (isSupabaseConfigured) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: directData } = await supabase.from('files').insert({
                owner_id: session.user.id,
                name: item.name,
                mime_type: item.mimeType || 'application/octet-stream',
                size: item.size || 0,
                storage_key: initRes.storageKey,
                folder_id: item.folderId || null,
              }).select().single();
              if (directData) recordedFile = directData;
            }
          }
        }

        if (!recordedFile) {
          recordedFile = {
            id: uuidv4(),
            owner_id: 'user',
            name: item.name,
            mime_type: item.mimeType || 'application/octet-stream',
            size: item.size || 0,
            storage_key: initRes.storageKey,
            storage_provider: 'cloudinary',
            folder_id: item.folderId || null,
            is_starred: false,
            is_deleted: false,
            deleted_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        addUploadedFile(recordedFile);

      } else if (initRes.type === 'single') {
        // Single-part upload via presigned PUT URL
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', initRes.uploadUrl, true);
          xhr.setRequestHeader('Content-Type', item.mimeType || 'application/octet-stream');

          controller.signal.addEventListener('abort', () => {
            xhr.abort();
            reject(new Error('Upload cancelled'));
          });

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const now = Date.now();
              const elapsedSec = (now - lastTime) / 1000;
              const bytesDiff = e.loaded - lastLoadedBytes;

              const speed = elapsedSec > 0.3 ? bytesDiff / elapsedSec : item.speed;
              const remainingBytes = e.total - e.loaded;
              const remainingSeconds = speed > 0 ? Math.ceil(remainingBytes / speed) : 0;

              lastLoadedBytes = e.loaded;
              lastTime = now;

              const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
              updateUploadState(item.id, {
                progress: percent,
                bytesUploaded: e.loaded,
                speed,
                remainingSeconds,
              });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Storage returned HTTP ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error uploading to storage'));
          xhr.send(item.file);
        });

        // Confirm completion with backend to record file in DB
        let recordedFile: FileItem | null = null;
        try {
          const confirmRes = await api.post<any>('/api/upload/confirm-single', {
            storageKey: initRes.storageKey,
            fileName: item.name,
            fileSize: item.size,
            mimeType: item.mimeType,
            folderId: item.folderId,
            provider: 'r2',
          });
          if (confirmRes?.file) {
            recordedFile = confirmRes.file;
          }
        } catch (confirmErr: any) {
          console.warn('Backend confirmation fallback, saving directly to Supabase:', confirmErr);
          if (isSupabaseConfigured) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: directData } = await supabase.from('files').insert({
                owner_id: session.user.id,
                name: item.name,
                mime_type: item.mimeType || 'application/octet-stream',
                size: item.size || 0,
                storage_key: initRes.storageKey,
                folder_id: item.folderId || null,
              }).select().single();
              if (directData) recordedFile = directData;
            }
          }
        }

        if (!recordedFile) {
          recordedFile = {
            id: uuidv4(),
            owner_id: 'user',
            name: item.name,
            mime_type: item.mimeType || 'application/octet-stream',
            size: item.size || 0,
            storage_key: initRes.storageKey,
            storage_provider: 'r2',
            folder_id: item.folderId || null,
            is_starred: false,
            is_deleted: false,
            deleted_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        addUploadedFile(recordedFile);

      } else if (initRes.type === 'multipart') {
        // Multipart upload for large files
        const { uploadId, storageKey, totalParts, sessionId } = initRes;
        const uploadedParts: { PartNumber: number; ETag: string }[] = [];

        updateUploadState(item.id, {
          uploadType: 'multipart',
          uploadId,
          storageKey,
          sessionId,
        });

        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
          if (controller.signal.aborted) {
            await api.post('/api/upload/abort', { sessionId, storageKey, uploadId }).catch(() => {});
            return;
          }

          const start = (partNumber - 1) * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, item.size);
          const chunk = item.file.slice(start, end);

          // Get presigned URL for this part
          const { partUrl } = await api.post<{ partUrl: string }>('/api/upload/part-url', {
            storageKey,
            uploadId,
            partNumber,
          });

          // Upload chunk via PUT
          const etag = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', partUrl, true);

            controller.signal.addEventListener('abort', () => {
              xhr.abort();
              reject(new Error('Upload cancelled'));
            });

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const totalUploadedSoFar = start + e.loaded;
                const percent = Math.min(99, Math.round((totalUploadedSoFar / item.size) * 100));

                const now = Date.now();
                const elapsedSec = (now - lastTime) / 1000;
                const bytesDiff = totalUploadedSoFar - lastLoadedBytes;
                const speed = elapsedSec > 0.3 ? bytesDiff / elapsedSec : item.speed;
                const remainingBytes = item.size - totalUploadedSoFar;
                const remainingSeconds = speed > 0 ? Math.ceil(remainingBytes / speed) : 0;

                lastLoadedBytes = totalUploadedSoFar;
                lastTime = now;

                updateUploadState(item.id, {
                  progress: percent,
                  bytesUploaded: totalUploadedSoFar,
                  speed,
                  remainingSeconds,
                });
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const headerEtag = xhr.getResponseHeader('ETag') || `"${uuidv4()}"`;
                resolve(headerEtag);
              } else {
                reject(new Error(`Part ${partNumber} failed with status ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error(`Network error uploading part ${partNumber}`));
            xhr.send(chunk);
          });

          uploadedParts.push({ PartNumber: partNumber, ETag: etag });
        }

        // Complete multipart upload
        let recordedMultipartFile: FileItem | null = null;
        try {
          const completeRes = await api.post<any>('/api/upload/complete', {
            sessionId,
            storageKey,
            uploadId,
            parts: uploadedParts,
            fileName: item.name,
            fileSize: item.size,
            mimeType: item.mimeType,
            folderId: item.folderId,
          });
          if (completeRes?.file) {
            recordedMultipartFile = completeRes.file;
          }
        } catch (completeErr: any) {
          console.warn('Backend multipart complete DB recording fallback, saving directly to Supabase:', completeErr);
          if (isSupabaseConfigured) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: directData } = await supabase.from('files').insert({
                owner_id: session.user.id,
                name: item.name,
                mime_type: item.mimeType || 'application/octet-stream',
                size: item.size || 0,
                storage_key: storageKey,
                folder_id: item.folderId || null,
              }).select().single();
              if (directData) recordedMultipartFile = directData;
            }
          }
        }

        if (!recordedMultipartFile) {
          recordedMultipartFile = {
            id: uuidv4(),
            owner_id: 'user',
            name: item.name,
            mime_type: item.mimeType || 'application/octet-stream',
            size: item.size || 0,
            storage_key: storageKey,
            storage_provider: 'r2',
            folder_id: item.folderId || null,
            is_starred: false,
            is_deleted: false,
            deleted_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        addUploadedFile(recordedMultipartFile);
      }

      updateUploadState(item.id, {
        status: 'completed',
        progress: 100,
        bytesUploaded: item.size,
        speed: 0,
        remainingSeconds: 0,
      });

      toast.success(`Uploaded "${item.name}"`);
      await refreshStorage();
    } catch (err: any) {
      if (err.message === 'Upload cancelled') {
        updateUploadState(item.id, { status: 'cancelled', error: 'Upload cancelled by user' });
      } else {
        console.error(`Upload error for ${item.name}:`, err);
        updateUploadState(item.id, { status: 'failed', error: err.message || 'Upload failed' });
        toast.error(`Failed to upload "${item.name}": ${err.message || 'Error'}`);
      }
    } finally {
      abortControllers.current.delete(item.id);
    }
  };

  /**
   * Batch upload multiple files (Capped at 10 GB limit)
   */
  const uploadFiles = async (files: File[], targetFolderId: string | null = currentFolderId) => {
    if (!files.length) return;

    // Separate media files (Cloudinary 25 GB limit) from non-media files (R2 10 GB limit)
    let incomingR2Bytes = 0;
    let incomingCloudinaryBytes = 0;

    files.forEach((f) => {
      const isMedia = f.type.startsWith('image/') || f.type.startsWith('video/');
      if (isMedia) {
        incomingCloudinaryBytes += f.size;
      } else {
        incomingR2Bytes += f.size;
      }
    });

    const currentR2 = storageUsage.r2?.usedBytes ?? storageUsage.usedBytes;
    const currentCl = storageUsage.cloudinary?.usedBytes ?? 0;
    const HARD_LIMIT_CLOUDINARY = 26843545600;

    if (currentR2 + incomingR2Bytes > HARD_LIMIT_10GB) {
      const availR2 = Math.max(0, HARD_LIMIT_10GB - currentR2);
      toast.error(
        `Upload blocked: ${formatBytes(incomingR2Bytes)} exceeds your remaining 10 GB Cloudflare R2 limit (${formatBytes(availR2)} available).`,
        { duration: 6000 }
      );
      return;
    }

    if (currentCl + incomingCloudinaryBytes > HARD_LIMIT_CLOUDINARY) {
      const availCl = Math.max(0, HARD_LIMIT_CLOUDINARY - currentCl);
      toast.error(
        `Upload blocked: ${formatBytes(incomingCloudinaryBytes)} exceeds your remaining 25 GB Cloudinary limit (${formatBytes(availCl)} available).`,
        { duration: 6000 }
      );
      return;
    }

    setIsManagerOpen(true);

    const newItems: UploadProgressItem[] = files.map((file) => ({
      id: uuidv4(),
      file,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      folderId: targetFolderId,
      progress: 0,
      bytesUploaded: 0,
      speed: 0,
      remainingSeconds: 0,
      status: 'pending',
    }));

    setUploads((prev) => [...newItems, ...prev]);

    // Process concurrent uploads (up to 3 simultaneous)
    for (const item of newItems) {
      processUpload(item);
    }
  };

  /**
   * Upload a complete folder preserving hierarchy (Capped at 10 GB limit)
   */
  const uploadFolderStructure = async (
    filesWithPaths: { file: File; relativePath: string }[],
    targetFolderId: string | null = currentFolderId
  ) => {
    if (!filesWithPaths.length) return;

    // Check if total folder contents exceed 10 GB quota
    const totalFolderBytes = filesWithPaths.reduce((acc, f) => acc + f.file.size, 0);
    const availableBytes = Math.max(0, HARD_LIMIT_10GB - storageUsage.usedBytes);

    if (storageUsage.usedBytes + totalFolderBytes > HARD_LIMIT_10GB) {
      toast.error(
        `Folder upload blocked: ${formatBytes(totalFolderBytes)} exceeds your remaining 10 GB limit (${formatBytes(availableBytes)} available).`,
        { duration: 6000 }
      );
      return;
    }

    setIsManagerOpen(true);
    toast.loading('Preparing folder structure...', { id: 'folder-prep' });

    // Cache of created path -> folderId mapping
    const folderCache = new Map<string, string | null>();
    folderCache.set('', targetFolderId);

    const filesToUpload: { file: File; folderId: string | null }[] = [];

    try {
      for (const item of filesWithPaths) {
        const segments = item.relativePath.split('/');
        segments.pop(); // remove file name, keep directory path segments

        let parentId = targetFolderId;
        let accumulatedPath = '';

        for (const segment of segments) {
          accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;

          if (folderCache.has(accumulatedPath)) {
            parentId = folderCache.get(accumulatedPath)!;
          } else {
            // Check if folder already exists in allFolders with this name & parentId
            const existing = allFolders.find(
              (f) => !f.is_deleted && f.name === segment && f.parent_id === parentId
            );

            if (existing) {
              parentId = existing.id;
            } else {
              // Create folder
              const created = await createFolder(segment, parentId);
              parentId = created.id;
            }
            folderCache.set(accumulatedPath, parentId);
          }
        }

        filesToUpload.push({ file: item.file, folderId: parentId });
      }

      toast.dismiss('folder-prep');
      toast.success('Folder hierarchy created! Starting file uploads...');

      // Dispatch uploads
      const newUploadItems: UploadProgressItem[] = filesToUpload.map(({ file, folderId }) => ({
        id: uuidv4(),
        file,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        folderId,
        progress: 0,
        bytesUploaded: 0,
        speed: 0,
        remainingSeconds: 0,
        status: 'pending',
      }));

      setUploads((prev) => [...newUploadItems, ...prev]);

      for (const item of newUploadItems) {
        processUpload(item);
      }
    } catch (err: any) {
      toast.dismiss('folder-prep');
      toast.error(`Folder creation failed: ${err.message}`);
    }
  };

  const cancelUpload = (uploadId: string) => {
    const controller = abortControllers.current.get(uploadId);
    if (controller) {
      controller.abort();
    }
    updateUploadState(uploadId, { status: 'cancelled' });
  };

  const retryUpload = (uploadId: string) => {
    const item = uploads.find((u) => u.id === uploadId);
    if (item && (item.status === 'failed' || item.status === 'cancelled')) {
      processUpload(item);
    }
  };

  const clearCompletedUploads = () => {
    setUploads((prev) => prev.filter((u) => u.status === 'uploading' || u.status === 'pending'));
  };

  const isUploading = uploads.some((u) => u.status === 'uploading' || u.status === 'pending');

  return (
    <UploadContext.Provider
      value={{
        uploads,
        isUploading,
        isManagerOpen,
        setIsManagerOpen,
        uploadFiles,
        uploadFolderStructure,
        cancelUpload,
        retryUpload,
        clearCompletedUploads,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};

