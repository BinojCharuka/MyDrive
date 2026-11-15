// ==========================================
// File Validation Utilities
// ==========================================

export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB default max upload
export const MAX_FILES_PER_BATCH = 100;

export const sanitizeFileName = (name: string): string => {
  // Remove dangerous control characters and trim
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
};

export const validateFileName = (name: string): { valid: boolean; error?: string } => {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  if (name.length > 255) {
    return { valid: false, error: 'Name cannot exceed 255 characters' };
  }
  if (/[<>:"/\\|?*\x00-\x1F]/.test(name)) {
    return { valid: false, error: 'Name contains invalid characters (<>:"/\\|?*)' };
  }
  return { valid: true };
};

