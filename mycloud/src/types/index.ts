// ==========================================
// MyCloud Core TypeScript Type Definitions
// ==========================================

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  owner_id: string;
  name: string;
  parent_id: string | null;
  is_starred: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  file_count?: number;
  subfolder_count?: number;
}

export interface FileItem {
  id: string;
  owner_id: string;
  name: string;
  mime_type: string;
  size: number;
  storage_key: string;
  storage_provider?: 'r2' | 'cloudinary';
  folder_id: string | null;
  is_starred: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
  preview_url?: string;
  // Shared metadata when fetched in shared context
  shared_permission?: 'viewer' | 'editor';
  shared_by_user?: Profile;
}

export interface FileShare {
  id: string;
  file_id: string;
  shared_by: string;
  shared_with: string;
  permission: 'viewer' | 'editor';
  created_at: string;
  file?: FileItem;
  sharer?: Profile;
  recipient?: Profile;
}

export interface FolderShare {
  id: string;
  folder_id: string;
  shared_by: string;
  shared_with: string;
  permission: 'viewer' | 'editor';
  created_at: string;
  folder?: Folder;
  sharer?: Profile;
  recipient?: Profile;
}

export interface StorageProviderQuota {
  usedBytes: number;
  quotaBytes: number;
  percent: number;
  fileCount: number;
}

export interface StorageUsage {
  userId: string;
  usedBytes: number;
  quotaBytes: number;
  fileCount: number;
  folderCount: number;
  updatedAt?: string;
  r2?: StorageProviderQuota;
  cloudinary?: StorageProviderQuota;
}

export type ViewMode = 'grid' | 'list';

export type SortField = 'name' | 'size' | 'updated_at' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export type FileTypeFilter = 'all' | 'image' | 'video' | 'audio' | 'document' | 'spreadsheet' | 'archive' | 'other';

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export interface UploadProgressItem {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  folderId: string | null;
  folderPath?: string;
  progress: number; // 0 to 100
  bytesUploaded: number;
  speed: number; // bytes per second
  remainingSeconds: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  cancelController?: AbortController;
  uploadType?: 'single' | 'multipart' | 'cloudinary';
  storageProvider?: 'r2' | 'cloudinary';
  sessionId?: string;
  storageKey?: string;
  uploadId?: string;
}

