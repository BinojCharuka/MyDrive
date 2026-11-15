import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  FileItem,
  Folder,
  StorageUsage,
  BreadcrumbItem,
  SortField,
  SortOrder,
  ViewMode,
  FileTypeFilter,
} from '../types';
import api from '../lib/api';

interface StorageContextType {
  currentFolderId: string | null;
  breadcrumbs: BreadcrumbItem[];
  folders: Folder[];
  files: FileItem[];
  allFolders: Folder[];
  allFiles: FileItem[];
  starredFiles: FileItem[];
  starredFolders: Folder[];
  sharedWithMeFiles: FileItem[];
  sharedWithMeFolders: Folder[];
  sharedByMeFiles: FileItem[];
  sharedByMeFolders: Folder[];
  trashFiles: FileItem[];
  trashFolders: Folder[];
  storageUsage: StorageUsage;
  loading: boolean;
  viewMode: ViewMode;
  sortField: SortField;
  sortOrder: SortOrder;
  fileTypeFilter: FileTypeFilter;
  searchQuery: string;
  setViewMode: (mode: ViewMode) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setFileTypeFilter: (filter: FileTypeFilter) => void;
  setSearchQuery: (query: string) => void;
  navigateToFolder: (folderId: string | null, folderName?: string) => void;
  refreshStorage: () => Promise<void>;
  createFolder: (name: string, parentId?: string | null) => Promise<Folder>;
  renameFolder: (id: string, newName: string) => Promise<void>;
  renameFile: (id: string, newName: string) => Promise<void>;
  toggleStarFolder: (id: string) => Promise<void>;
  toggleStarFile: (id: string) => Promise<void>;
  moveToTrashFolder: (id: string) => Promise<void>;
  moveToTrashFile: (id: string) => Promise<void>;
  restoreFolder: (id: string) => Promise<void>;
  restoreFile: (id: string) => Promise<void>;
  permanentlyDeleteFile: (id: string) => Promise<void>;
  permanentlyDeleteFolder: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  moveFile: (fileId: string, targetFolderId: string | null) => Promise<void>;
  moveFolder: (folderId: string, targetFolderId: string | null) => Promise<void>;
  shareFile: (fileId: string, email: string, permission: 'viewer' | 'editor') => Promise<void>;
  shareFolder: (folderId: string, email: string, permission: 'viewer' | 'editor') => Promise<void>;
  revokeFileShare: (shareId: string) => Promise<void>;
  revokeFolderShare: (shareId: string) => Promise<void>;
  addUploadedFile: (file: FileItem) => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

// Initial mock data for unconfigured / demo mode
const INITIAL_DEMO_FOLDERS: Folder[] = [
  {
    id: 'folder-1',
    owner_id: '00000000-0000-0000-0000-000000000001',
    name: 'Work Documents',
    parent_id: null,
    is_starred: true,
    is_deleted: false,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'folder-2',
    owner_id: '00000000-0000-0000-0000-000000000001',
    name: 'Brand Assets & Media',
    parent_id: null,
    is_starred: false,
    is_deleted: false,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'folder-3',
    owner_id: '00000000-0000-0000-0000-000000000001',
    name: 'Q4 Financial Reports',
    parent_id: 'folder-1',
    is_starred: false,
    is_deleted: false,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_DEMO_FILES: FileItem[] = [
  {
    id: 'file-1',
    owner_id: '00000000-0000-0000-0000-000000000001',
    name: 'Platform Architecture Specification.pdf',
    mime_type: 'application/pdf',
    size: 4850000,
    storage_key: 'users/demo/root/arch-spec.pdf',
    folder_id: null,
    is_starred: true,
    is_deleted: false,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'file-2',
    owner_id: '00000000-0000-0000-0000-000000000001',
    name: 'Cloudflare R2 Integration Guide.docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1250000,
    storage_key: 'users/demo/root/r2-guide.docx',
    folder_id: null,
    is_starred: false,
    is_deleted: false,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'file-3',
    owner_id: '00000000-0000-0000-0000-000000000001',
    name: 'Product_Hero_Banner_4K.png',
    mime_type: 'image/png',
    size: 8900000,
    storage_key: 'users/demo/folder-2/banner.png',
    folder_id: 'folder-2',
    is_starred: true,
    is_deleted: false,
    deleted_at: null,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'My Files' },
  ]);

  const [allFolders, setAllFolders] = useState<Folder[]>(() => {
    try {
      const cached = localStorage.getItem('mycloud_cached_folders');
      if (cached) return JSON.parse(cached);
    } catch {}
    return INITIAL_DEMO_FOLDERS;
  });

  const [allFiles, setAllFiles] = useState<FileItem[]>(() => {
    try {
      const cached = localStorage.getItem('mycloud_cached_files');
      if (cached) return JSON.parse(cached);
    } catch {}
    return INITIAL_DEMO_FILES;
  });

  // Calculate initial storage usage from cached files
  const computeInitialUsage = (): StorageUsage => {
    let initialFiles = INITIAL_DEMO_FILES;
    try {
      const cached = localStorage.getItem('mycloud_cached_files');
      if (cached) initialFiles = JSON.parse(cached);
    } catch {}

    const activeFiles = initialFiles.filter((f) => !f.is_deleted);
    let r2 = 0;
    let cl = 0;
    let r2Count = 0;
    let clCount = 0;

    activeFiles.forEach((f) => {
      const isCl = (typeof f.storage_key === 'string' && f.storage_key.startsWith('cloudinary:')) || f.storage_provider === 'cloudinary';
      const sz = Number(f.size || 0);
      if (isCl) {
        cl += sz;
        clCount += 1;
      } else {
        r2 += sz;
        r2Count += 1;
      }
    });

    const HARD_LIMIT_R2 = 10737418240;
    const HARD_LIMIT_CLOUDINARY = 26843545600;

    return {
      userId: user?.id || 'demo-user',
      usedBytes: r2 + cl,
      quotaBytes: HARD_LIMIT_R2,
      fileCount: activeFiles.length,
      folderCount: 0,
      r2: {
        usedBytes: r2,
        quotaBytes: HARD_LIMIT_R2,
        percent: Math.min(100, Math.round((r2 / HARD_LIMIT_R2) * 100)),
        fileCount: r2Count,
      },
      cloudinary: {
        usedBytes: cl,
        quotaBytes: HARD_LIMIT_CLOUDINARY,
        percent: Math.min(100, Math.round((cl / HARD_LIMIT_CLOUDINARY) * 100)),
        fileCount: clCount,
      },
    };
  };

  const [storageUsage, setStorageUsage] = useState<StorageUsage>(computeInitialUsage);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mycloud_cached_files', JSON.stringify(allFiles));
    } catch {}
  }, [allFiles]);

  useEffect(() => {
    try {
      localStorage.setItem('mycloud_cached_folders', JSON.stringify(allFolders));
    } catch {}
  }, [allFolders]);

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Helper to recompute and apply storage usage immediately from local state
  const updateUsageFromLocalState = (currentFiles: FileItem[], currentFolders: Folder[]) => {
    const activeFiles = currentFiles.filter((f) => !f.is_deleted);
    const activeFolders = currentFolders.filter((f) => !f.is_deleted);

    let r2Used = 0;
    let r2Count = 0;
    let cloudinaryUsed = 0;
    let cloudinaryCount = 0;

    activeFiles.forEach((f) => {
      const isCloudinary = f.storage_provider === 'cloudinary' || f.storage_key?.startsWith('cloudinary:');
      const size = Number(f.size || 0);
      if (isCloudinary) {
        cloudinaryUsed += size;
        cloudinaryCount += 1;
      } else {
        r2Used += size;
        r2Count += 1;
      }
    });

    const totalBytes = r2Used + cloudinaryUsed;
    const HARD_LIMIT_R2 = 10737418240; // 10 GB
    const HARD_LIMIT_CLOUDINARY = 26843545600; // 25 GB

    setStorageUsage((prev) => ({
      ...prev,
      usedBytes: totalBytes,
      fileCount: activeFiles.length,
      folderCount: activeFolders.length,
      r2: {
        usedBytes: r2Used,
        quotaBytes: HARD_LIMIT_R2,
        percent: Math.min(100, Math.round((r2Used / HARD_LIMIT_R2) * 100)),
        fileCount: r2Count,
      },
      cloudinary: {
        usedBytes: cloudinaryUsed,
        quotaBytes: HARD_LIMIT_CLOUDINARY,
        percent: Math.min(100, Math.round((cloudinaryUsed / HARD_LIMIT_CLOUDINARY) * 100)),
        fileCount: cloudinaryCount,
      },
    }));
  };

  // Fast helper to add an uploaded file immediately and compute storage
  const addUploadedFile = (newFile: FileItem) => {
    setAllFiles((prev) => {
      const exists = prev.some((f) => f.id === newFile.id || (f.storage_key && f.storage_key === newFile.storage_key));
      const updated = exists
        ? prev.map((f) => (f.id === newFile.id || (f.storage_key && f.storage_key === newFile.storage_key) ? newFile : f))
        : [newFile, ...prev];
      updateUsageFromLocalState(updated, allFolders);
      try {
        localStorage.setItem('mycloud_cached_files', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Fetch files, folders and usage from Supabase / API
  const refreshStorage = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (!isSupabaseConfigured) {
      // In demo mode, recalculate usage from local state
      updateUsageFromLocalState(allFiles, allFolders);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch all folders
      const { data: foldersData, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('owner_id', user.id);

      let effectiveFolders = allFolders;
      if (!folderError && foldersData && foldersData.length > 0) {
        setAllFolders(foldersData);
        effectiveFolders = foldersData;
      }

      // 2. Fetch all files
      const { data: filesData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('owner_id', user.id);

      let effectiveFiles = allFiles;
      if (!fileError && filesData && filesData.length > 0) {
        setAllFiles(filesData);
        effectiveFiles = filesData;
      }

      // 3. Immediately update storage usage from active files
      updateUsageFromLocalState(effectiveFiles, effectiveFolders);

      // 4. Also synchronize from backend /api/quota
      try {
        const usageData = await api.get<StorageUsage>('/api/quota');
        if (usageData && usageData.usedBytes > 0) {
          setStorageUsage(usageData);
        }
      } catch (err) {
        // Already updated from local state
      }
    } catch (err) {
      console.error('Failed to refresh storage:', err);
    } finally {
      setLoading(false);
    }
  }, [user, allFiles, allFolders]);

  useEffect(() => {
    refreshStorage();
  }, [user]);

  // Navigate breadcrumb hierarchy
  const navigateToFolder = (folderId: string | null, folderName?: string) => {
    setCurrentFolderId(folderId);

    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'My Files' }]);
      return;
    }

    // Build breadcrumb trail by walking up parent hierarchy
    const trail: BreadcrumbItem[] = [];
    let current: Folder | undefined = allFolders.find((f) => f.id === folderId);

    if (!current && folderName) {
      setBreadcrumbs([
        { id: null, name: 'My Files' },
        { id: folderId, name: folderName },
      ]);
      return;
    }

    while (current) {
      trail.unshift({ id: current.id, name: current.name });
      current = current.parent_id
        ? allFolders.find((f) => f.id === current?.parent_id)
        : undefined;
    }

    setBreadcrumbs([{ id: null, name: 'My Files' }, ...trail]);
  };

  // Folder CRUD operations
  const createFolder = async (name: string, parentId: string | null = currentFolderId): Promise<Folder> => {
    const newFolder: Folder = {
      id: uuidv4(),
      owner_id: user?.id || 'demo-user',
      name: name.trim(),
      parent_id: parentId,
      is_starred: false,
      is_deleted: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      setAllFolders((prev) => [...prev, newFolder]);
      return newFolder;
    }

    const { data, error } = await supabase
      .from('folders')
      .insert({
        owner_id: user?.id,
        name: name.trim(),
        parent_id: parentId,
      })
      .select()
      .single();

    if (error) throw error;
    setAllFolders((prev) => [...prev, data]);
    return data;
  };

  const renameFolder = async (id: string, newName: string) => {
    if (!isSupabaseConfigured) {
      setAllFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: newName.trim(), updated_at: new Date().toISOString() } : f))
      );
      return;
    }

    const { error } = await supabase
      .from('folders')
      .update({ name: newName.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    setAllFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName.trim() } : f))
    );
  };

  const renameFile = async (id: string, newName: string) => {
    if (!isSupabaseConfigured) {
      setAllFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: newName.trim(), updated_at: new Date().toISOString() } : f))
      );
      return;
    }

    const { error } = await supabase
      .from('files')
      .update({ name: newName.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    setAllFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName.trim() } : f))
    );
  };

  const toggleStarFolder = async (id: string) => {
    const target = allFolders.find((f) => f.id === id);
    if (!target) return;
    const newStatus = !target.is_starred;

    if (!isSupabaseConfigured) {
      setAllFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_starred: newStatus } : f))
      );
      return;
    }

    await supabase.from('folders').update({ is_starred: newStatus }).eq('id', id);
    setAllFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_starred: newStatus } : f))
    );
  };

  const toggleStarFile = async (id: string) => {
    const target = allFiles.find((f) => f.id === id);
    if (!target) return;
    const newStatus = !target.is_starred;

    if (!isSupabaseConfigured) {
      setAllFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_starred: newStatus } : f))
      );
      return;
    }

    await supabase.from('files').update({ is_starred: newStatus }).eq('id', id);
    setAllFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_starred: newStatus } : f))
    );
  };

  const moveToTrashFolder = async (id: string) => {
    const updatedFolders = allFolders.map((f) =>
      f.id === id ? { ...f, is_deleted: true, deleted_at: new Date().toISOString() } : f
    );
    setAllFolders(updatedFolders);
    updateUsageFromLocalState(allFiles, updatedFolders);

    if (isSupabaseConfigured) {
      await supabase
        .from('folders')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);
    }
  };

  const moveToTrashFile = async (id: string) => {
    const updatedFiles = allFiles.map((f) =>
      f.id === id ? { ...f, is_deleted: true, deleted_at: new Date().toISOString() } : f
    );
    setAllFiles(updatedFiles);
    updateUsageFromLocalState(updatedFiles, allFolders);

    if (isSupabaseConfigured) {
      await supabase
        .from('files')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);
    }

    try {
      await api.post('/api/quota/recalculate');
    } catch (e) {}
  };

  const restoreFolder = async (id: string) => {
    const updatedFolders = allFolders.map((f) =>
      f.id === id ? { ...f, is_deleted: false, deleted_at: null } : f
    );
    setAllFolders(updatedFolders);
    updateUsageFromLocalState(allFiles, updatedFolders);

    if (isSupabaseConfigured) {
      await supabase
        .from('folders')
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', id);
    }
  };

  const restoreFile = async (id: string) => {
    const updatedFiles = allFiles.map((f) =>
      f.id === id ? { ...f, is_deleted: false, deleted_at: null } : f
    );
    setAllFiles(updatedFiles);
    updateUsageFromLocalState(updatedFiles, allFolders);

    if (isSupabaseConfigured) {
      await supabase
        .from('files')
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', id);
    }

    try {
      await api.post('/api/quota/recalculate');
    } catch (e) {}
  };

  const permanentlyDeleteFile = async (id: string) => {
    const updatedFiles = allFiles.filter((f) => f.id !== id);
    setAllFiles(updatedFiles);
    updateUsageFromLocalState(updatedFiles, allFolders);

    try {
      await api.delete(`/api/files/permanent/${id}`);
    } catch (err) {
      console.warn('Backend permanent delete failed or in demo mode:', err);
    }

    if (isSupabaseConfigured) {
      await supabase.from('files').delete().eq('id', id);
    }

    try {
      await api.post('/api/quota/recalculate');
    } catch (e) {}
  };

  const permanentlyDeleteFolder = async (id: string) => {
    const updatedFolders = allFolders.filter((f) => f.id !== id);
    setAllFolders(updatedFolders);
    updateUsageFromLocalState(allFiles, updatedFolders);

    if (isSupabaseConfigured) {
      await supabase.from('folders').delete().eq('id', id);
    }
  };

  const emptyTrash = async () => {
    const trashFiles = allFiles.filter((f) => f.is_deleted);
    const trashFileIds = trashFiles.map((f) => f.id);
    const trashFolderIds = allFolders.filter((f) => f.is_deleted).map((f) => f.id);

    const updatedFiles = allFiles.filter((f) => !f.is_deleted);
    const updatedFolders = allFolders.filter((f) => !f.is_deleted);
    setAllFiles(updatedFiles);
    setAllFolders(updatedFolders);
    updateUsageFromLocalState(updatedFiles, updatedFolders);

    try {
      if (trashFileIds.length > 0) {
        await api.post('/api/files/permanent/batch', { fileIds: trashFileIds });
      }
    } catch (err) {
      console.warn('Batch permanent delete failed, removing locally:', err);
    }

    if (isSupabaseConfigured) {
      if (trashFileIds.length > 0) {
        await supabase.from('files').delete().in('id', trashFileIds);
      }
      if (trashFolderIds.length > 0) {
        await supabase.from('folders').delete().in('id', trashFolderIds);
      }
    }

    try {
      await api.post('/api/quota/recalculate');
    } catch (e) {}
  };

  const moveFile = async (fileId: string, targetFolderId: string | null) => {
    setAllFiles((prev) => {
      const next = prev.map((f) =>
        f.id === fileId ? { ...f, folder_id: targetFolderId, updated_at: new Date().toISOString() } : f
      );
      try {
        localStorage.setItem('mycloud_cached_files', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('files')
          .update({ folder_id: targetFolderId, updated_at: new Date().toISOString() })
          .eq('id', fileId);
      } catch (err) {
        console.warn('Supabase moveFile error:', err);
      }
    }
  };

  const moveFolder = async (folderId: string, targetFolderId: string | null) => {
    if (folderId === targetFolderId) return;

    setAllFolders((prev) => {
      const next = prev.map((f) =>
        f.id === folderId ? { ...f, parent_id: targetFolderId, updated_at: new Date().toISOString() } : f
      );
      try {
        localStorage.setItem('mycloud_cached_folders', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('folders')
          .update({ parent_id: targetFolderId, updated_at: new Date().toISOString() })
          .eq('id', folderId);
      } catch (err) {
        console.warn('Supabase moveFolder error:', err);
      }
    }
  };

  const shareFile = async (fileId: string, email: string, permission: 'viewer' | 'editor') => {
    if (!isSupabaseConfigured) {
      alert(`Demo Mode: Simulated file sharing with ${email} as ${permission}.`);
      return;
    }

    // Lookup user by email in profiles
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (userError || !targetUser) {
      throw new Error(`No registered user found with email "${email}"`);
    }

    const { error } = await supabase.from('file_shares').upsert({
      file_id: fileId,
      shared_by: user?.id,
      shared_with: targetUser.id,
      permission,
    });

    if (error) throw error;
  };

  const shareFolder = async (folderId: string, email: string, permission: 'viewer' | 'editor') => {
    if (!isSupabaseConfigured) {
      alert(`Demo Mode: Simulated folder sharing with ${email} as ${permission}.`);
      return;
    }

    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (userError || !targetUser) {
      throw new Error(`No registered user found with email "${email}"`);
    }

    const { error } = await supabase.from('folder_shares').upsert({
      folder_id: folderId,
      shared_by: user?.id,
      shared_with: targetUser.id,
      permission,
    });

    if (error) throw error;
  };

  const revokeFileShare = async (shareId: string) => {
    if (isSupabaseConfigured) {
      await supabase.from('file_shares').delete().eq('id', shareId);
    }
  };

  const revokeFolderShare = async (shareId: string) => {
    if (isSupabaseConfigured) {
      await supabase.from('folder_shares').delete().eq('id', shareId);
    }
  };

  // Filtered views
  const currentFolders = allFolders.filter(
    (f) => !f.is_deleted && f.parent_id === currentFolderId
  );

  const currentFiles = allFiles.filter(
    (f) => !f.is_deleted && f.folder_id === currentFolderId
  );

  const starredFiles = allFiles.filter((f) => !f.is_deleted && f.is_starred);
  const starredFolders = allFolders.filter((f) => !f.is_deleted && f.is_starred);

  const trashFiles = allFiles.filter((f) => f.is_deleted);
  const trashFolders = allFolders.filter((f) => f.is_deleted);

  const sharedWithMeFiles: FileItem[] = [];
  const sharedWithMeFolders: Folder[] = [];
  const sharedByMeFiles: FileItem[] = [];
  const sharedByMeFolders: Folder[] = [];

  return (
    <StorageContext.Provider
      value={{
        currentFolderId,
        breadcrumbs,
        folders: currentFolders,
        files: currentFiles,
        allFolders,
        allFiles,
        starredFiles,
        starredFolders,
        sharedWithMeFiles,
        sharedWithMeFolders,
        sharedByMeFiles,
        sharedByMeFolders,
        trashFiles,
        trashFolders,
        storageUsage,
        loading,
        viewMode,
        sortField,
        sortOrder,
        fileTypeFilter,
        searchQuery,
        setViewMode,
        setSortField,
        setSortOrder,
        setFileTypeFilter,
        setSearchQuery,
        navigateToFolder,
        refreshStorage,
        createFolder,
        renameFolder,
        renameFile,
        toggleStarFolder,
        toggleStarFile,
        moveToTrashFolder,
        moveToTrashFile,
        restoreFolder,
        restoreFile,
        permanentlyDeleteFile,
        permanentlyDeleteFolder,
        emptyTrash,
        moveFile,
        moveFolder,
        shareFile,
        shareFolder,
        revokeFileShare,
        revokeFolderShare,
        addUploadedFile,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};

