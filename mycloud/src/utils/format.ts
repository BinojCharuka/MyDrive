// ==========================================
// Formatting Utilities
// ==========================================

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatRelativeTime = (dateString?: string | null): string => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

export const getFileTypeCategory = (mimeType: string, filename: string): string => {
  const ext = getFileExtension(filename);

  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif'].includes(ext)) {
    return 'image';
  }
  if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return 'video';
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
    return 'audio';
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (
    mimeType.includes('sheet') ||
    mimeType.includes('excel') ||
    ['xlsx', 'xls', 'csv'].includes(ext)
  ) {
    return 'spreadsheet';
  }
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    ['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext)
  ) {
    return 'document';
  }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('tar') ||
    mimeType.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return 'archive';
  }

  return 'other';
};

export const truncateText = (text: string, maxLength: number = 24): string => {
  if (text.length <= maxLength) return text;
  const ext = getFileExtension(text);
  if (ext) {
    const nameWithoutExt = text.slice(0, text.lastIndexOf('.'));
    const keepChars = maxLength - ext.length - 4;
    if (keepChars > 3) {
      return `${nameWithoutExt.slice(0, keepChars)}...${ext}`;
    }
  }
  return `${text.slice(0, maxLength - 3)}...`;
};

