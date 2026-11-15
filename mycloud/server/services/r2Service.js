import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, r2Bucket, isR2Configured } from '../config/r2.js';

/**
 * Generate a presigned PUT URL for single-part direct upload to R2
 */
export const createPresignedUploadUrl = async (storageKey, mimeType = 'application/octet-stream', expiresIn = 3600) => {
  if (!isR2Configured) {
    // Return a mock upload URL for testing when credentials aren't set yet
    return `http://localhost:3001/api/upload/mock-upload/${encodeURIComponent(storageKey)}`;
  }

  const command = new PutObjectCommand({
    Bucket: r2Bucket,
    Key: storageKey,
    ContentType: mimeType,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
};

/**
 * Initialize a multipart upload for large files (> 5MB)
 */
export const createMultipartUpload = async (storageKey, mimeType = 'application/octet-stream') => {
  if (!isR2Configured) {
    return { uploadId: 'mock-upload-id-' + Date.now(), key: storageKey };
  }

  const command = new CreateMultipartUploadCommand({
    Bucket: r2Bucket,
    Key: storageKey,
    ContentType: mimeType,
  });

  const response = await r2Client.send(command);
  return {
    uploadId: response.UploadId,
    key: response.Key,
  };
};

/**
 * Generate a presigned URL for uploading a specific part of a multipart upload
 */
export const createPresignedPartUrl = async (storageKey, uploadId, partNumber, expiresIn = 3600) => {
  if (!isR2Configured) {
    return `http://localhost:3001/api/upload/mock-part/${encodeURIComponent(storageKey)}/${partNumber}`;
  }

  const command = new UploadPartCommand({
    Bucket: r2Bucket,
    Key: storageKey,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
};

/**
 * Complete a multipart upload once all parts are uploaded
 * parts format: [{ PartNumber: 1, ETag: '"..."' }, ...]
 */
export const completeMultipartUpload = async (storageKey, uploadId, parts) => {
  if (!isR2Configured) {
    return { key: storageKey, location: `https://mock.r2.cloudflarestorage.com/${storageKey}` };
  }

  const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

  const command = new CompleteMultipartUploadCommand({
    Bucket: r2Bucket,
    Key: storageKey,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: sortedParts,
    },
  });

  return await r2Client.send(command);
};

/**
 * Abort a failed or cancelled multipart upload to prevent stranded storage
 */
export const abortMultipartUpload = async (storageKey, uploadId) => {
  if (!isR2Configured) {
    return { success: true };
  }

  const command = new AbortMultipartUploadCommand({
    Bucket: r2Bucket,
    Key: storageKey,
    UploadId: uploadId,
  });

  return await r2Client.send(command);
};

/**
 * Generate a secure presigned download URL
 */
export const createPresignedDownloadUrl = async (storageKey, filename, expiresIn = 3600) => {
  if (!isR2Configured) {
    return `http://localhost:3001/api/files/mock-download/${encodeURIComponent(storageKey)}?name=${encodeURIComponent(filename)}`;
  }

  const command = new GetObjectCommand({
    Bucket: r2Bucket,
    Key: storageKey,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
};

/**
 * Generate a secure inline view URL for previewing files in browser (PDF, images, video)
 */
export const createPresignedPreviewUrl = async (storageKey, mimeType, expiresIn = 3600) => {
  if (!isR2Configured) {
    return `http://localhost:3001/api/files/mock-preview/${encodeURIComponent(storageKey)}`;
  }

  const command = new GetObjectCommand({
    Bucket: r2Bucket,
    Key: storageKey,
    ResponseContentType: mimeType,
    ResponseContentDisposition: 'inline',
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
};

/**
 * Delete a single file object from R2
 */
export const deleteObject = async (storageKey) => {
  if (!isR2Configured) {
    return { success: true };
  }

  const command = new DeleteObjectCommand({
    Bucket: r2Bucket,
    Key: storageKey,
  });

  return await r2Client.send(command);
};

/**
 * Delete multiple file objects in a batch
 */
export const deleteObjects = async (storageKeys) => {
  if (!isR2Configured || !storageKeys.length) {
    return { success: true };
  }

  const command = new DeleteObjectsCommand({
    Bucket: r2Bucket,
    Delete: {
      Objects: storageKeys.map((Key) => ({ Key })),
      Quiet: true,
    },
  });

  return await r2Client.send(command);
};

/**
 * Upload raw content directly into R2 (e.g. for text file edits)
 */
export const putObjectDirect = async (storageKey, body, mimeType = 'text/plain') => {
  if (!isR2Configured) {
    return { success: true };
  }

  const command = new PutObjectCommand({
    Bucket: r2Bucket,
    Key: storageKey,
    Body: body,
    ContentType: mimeType,
  });

  return await r2Client.send(command);
};

/**
 * Get raw text content directly from R2 (e.g. for text/markdown preview & editor)
 */
export const getObjectBody = async (storageKey) => {
  if (!isR2Configured) {
    return 'Mock file text content from MyCloud development server.';
  }

  const command = new GetObjectCommand({
    Bucket: r2Bucket,
    Key: storageKey,
  });

  const response = await r2Client.send(command);
  return await response.Body.transformToString('utf-8');
};


