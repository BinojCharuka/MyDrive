import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  Star,
  FileText,
  FileQuestion,
  File,
  Copy,
  Check,
  Edit2,
  Edit3,
  Trash2,
  Save,
  RotateCcw,
  Code,
} from 'lucide-react';
import { FileItem } from '../../types';
import { formatBytes, formatDate, getFileTypeCategory } from '../../utils/format';
import { useStorage } from '../../context/StorageContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
  onShare?: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  onShare,
  onRename,
  onDelete,
}) => {
  const { toggleStarFile, refreshStorage } = useStorage();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const isTextFile = Boolean(
    file &&
      (file.mime_type.startsWith('text/') ||
        /\.(md|markdown|txt|json|js|jsx|ts|tsx|html|css|py|sh|csv|xml|log|yaml|yml|sql|env)$/i.test(
          file.name
        ))
  );

  useEffect(() => {
    if (!isOpen || !file) {
      setPreviewUrl(null);
      setTextContent(null);
      setIsEditing(false);
      setEditDraft('');
      return;
    }

    const loadPreview = async () => {
      setLoading(true);
      setTextContent(null);
      setIsEditing(false);
      setEditDraft('');

      const queryParams = new URLSearchParams({
        storageKey: file.storage_key || '',
        fileName: file.name,
        mimeType: file.mime_type || 'application/octet-stream',
        fileSize: String(file.size || 0),
      }).toString();

      // If text/markdown file, attempt to load raw content directly first
      if (isTextFile) {
        try {
          const rawText = await api.get<string>(`/api/files/raw/${file.id}?${queryParams}`);
          if (typeof rawText === 'string') {
            setTextContent(rawText);
            setEditDraft(rawText);
            setLoading(false);
            return;
          }
        } catch (rawErr) {
          console.warn('Direct raw fetch warning, falling back to presigned preview URL:', rawErr);
        }
      }

      // Fetch signed preview URL from backend
      try {
        const res = await api.get<{ previewUrl: string }>(`/api/files/preview/${file.id}?${queryParams}`);
        setPreviewUrl(res.previewUrl);

        if (isTextFile && res.previewUrl) {
          try {
            const textRes = await fetch(res.previewUrl);
            if (textRes.ok) {
              const text = await textRes.text();
              setTextContent(text);
              setEditDraft(text);
            }
          } catch (tErr) {
            console.warn('Could not fetch text content from preview URL:', tErr);
          }
        }
      } catch (err) {
        console.warn('Could not load signed preview URL:', err);
        setPreviewUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [isOpen, file, isTextFile]);

  if (!isOpen || !file) return null;

  const category = getFileTypeCategory(file.mime_type, file.name);

  const handleDownload = async () => {
    try {
      const queryParams = new URLSearchParams({
        storageKey: file.storage_key || '',
        fileName: file.name,
        mimeType: file.mime_type || 'application/octet-stream',
        fileSize: String(file.size || 0),
      }).toString();

      const res = await api.get<{ downloadUrl: string }>(`/api/files/download/${file.id}?${queryParams}`);
      if (res.downloadUrl) {
        const link = document.createElement('a');
        link.href = res.downloadUrl;
        link.download = file.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading "${file.name}"`);
      }
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error(err.response?.data?.error || 'Failed to start download');
    }
  };

  const handleCopyText = () => {
    const textToCopy = isEditing ? editDraft : textContent;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Content copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveContent = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      await api.put(`/api/files/content/${file.id}`, {
        content: editDraft,
        storageKey: file.storage_key,
        fileName: file.name,
        mimeType: file.mime_type,
      });

      setTextContent(editDraft);
      setIsEditing(false);
      toast.success(`Saved "${file.name}" successfully!`);
      await refreshStorage();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col justify-between animate-fade-in">
      {/* Top Bar */}
      <div className="h-16 px-4 sm:px-6 bg-slate-900/80 border-b border-white/10 flex items-center justify-between text-white gap-2">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-brand-400">
            {isTextFile ? <Code className="w-5 h-5" /> : <File className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md" title={file.name}>
              {file.name}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span>{formatBytes(file.size)} • {formatDate(file.updated_at)}</span>
              {file.storage_provider === 'cloudinary' || file.storage_key?.startsWith('cloudinary:') ? (
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Cloudinary CDN
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-brand-300 bg-brand-500/20 px-2 py-0.5 rounded-full border border-brand-400/30">
                  Cloudflare R2
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Star Button */}
          <button
            onClick={() => toggleStarFile(file.id)}
            className={`p-2 rounded-xl transition-colors ${
              file.is_starred ? 'text-amber-400 bg-amber-400/10' : 'text-slate-300 hover:bg-white/10'
            }`}
            title={file.is_starred ? 'Unstar' : 'Star'}
          >
            <Star className={`w-4 h-4 ${file.is_starred ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Edit File Toggle Button (for Text/Markdown) */}
          {isTextFile && (
            <button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  setEditDraft(textContent || '');
                } else {
                  setIsEditing(true);
                  setEditDraft(textContent || '');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isEditing
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }`}
              title={isEditing ? 'Cancel Edit' : 'Edit File'}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEditing ? 'Cancel Edit' : 'Edit File'}</span>
            </button>
          )}

          {/* Save Changes Button (Visible when in Edit Mode) */}
          {isEditing && (
            <button
              onClick={handleSaveContent}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
              title="Save Changes"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          )}

          {/* Rename Button */}
          {onRename && (
            <button
              onClick={() => {
                onRename(file);
              }}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              title="Rename file"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {/* Share Button */}
          {onShare && (
            <button
              onClick={() => onShare(file)}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              title="Share file"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Download</span>
          </button>

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={() => {
                onDelete(file);
                onClose();
              }}
              className="p-2 text-rose-400 hover:text-rose-200 rounded-xl hover:bg-rose-500/20 transition-colors"
              title="Move to Trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors ml-1"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading preview...</p>
          </div>
        ) : isEditing ? (
          /* In-Browser Code / Markdown Editor */
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-5xl w-full h-[78vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            <div className="h-11 px-4 bg-slate-800/90 border-b border-white/10 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-semibold text-white">Editing: {file.name}</span>
                <span className="text-slate-400 hidden sm:inline">• UTF-8</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 hidden sm:inline">
                  {editDraft.split('\n').length} lines • {editDraft.length} chars
                </span>
                <button
                  onClick={() => setEditDraft(textContent || '')}
                  className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors"
                  title="Reset to original content"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleSaveContent}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-sans text-xs font-semibold shadow disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              spellCheck={false}
              autoFocus
              className="flex-1 p-5 overflow-auto font-mono text-xs sm:text-sm text-slate-100 leading-relaxed bg-slate-950/70 border-0 outline-none resize-none select-text focus:ring-0"
              placeholder="Type your markdown or text here..."
            />
          </div>
        ) : category === 'image' && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
          />
        ) : category === 'video' && previewUrl ? (
          <video controls autoPlay className="max-h-full max-w-full rounded-2xl shadow-2xl">
            <source src={previewUrl} type={file.mime_type} />
            Your browser does not support video playback.
          </video>
        ) : category === 'audio' && previewUrl ? (
          <div className="bg-[#101210]/95 backdrop-blur-xl border border-[#1c2820] p-8 rounded-2xl max-w-md w-full flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h4 className="text-[#f5f5f5] font-semibold text-base mb-4 truncate w-full">{file.name}</h4>
            <audio controls className="w-full">
              <source src={previewUrl} type={file.mime_type} />
            </audio>
          </div>
        ) : category === 'pdf' && previewUrl ? (
          <iframe
            src={previewUrl}
            title={file.name}
            className="w-full h-full max-w-5xl rounded-2xl bg-white shadow-2xl border-0"
          />
        ) : textContent !== null ? (
          /* Text / Markdown Rendered Viewer */
          <div className="bg-[#101210] border border-[#1c2820] rounded-2xl max-w-4xl w-full h-[75vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="h-11 px-4 bg-[#0a0d0b] border-b border-[#1c2820] flex items-center justify-between text-xs text-[#a0a6a3]">
              <div className="flex items-center gap-2 font-mono">
                <FileText className="w-4 h-4 text-[#2fd697]" />
                <span className="truncate max-w-xs sm:max-w-md font-medium text-[#f5f5f5]">{file.name}</span>
                <span className="text-[10px] text-[#a0a6a3] hidden sm:inline">
                  ({textContent.split('\n').length} lines)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditDraft(textContent || '');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#13261e] hover:bg-[#1b563f] text-[#2fd697] border border-[#1b563f] rounded-lg transition-colors font-sans text-xs font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit File</span>
                </button>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#13261e] hover:bg-[#1c2820] text-[#f5f5f5] border border-[#1c2820] rounded-lg transition-colors font-sans text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#2fd697]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="flex-1 p-5 overflow-auto font-mono text-xs sm:text-sm text-[#f5f5f5] leading-relaxed whitespace-pre-wrap select-text bg-[#050806]">
              {textContent}
            </div>
          </div>
        ) : (
          /* Fallback view when direct preview isn't rendered or supported */
          <div className="bg-[#101210]/95 border border-[#1c2820] backdrop-blur-md p-8 rounded-2xl max-w-md w-full flex flex-col items-center text-center text-[#f5f5f5]">
            <div className="w-16 h-16 rounded-2xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center mb-4">
              <FileQuestion className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-serif mb-1 truncate w-full">{file.name}</h4>
            <p className="text-xs text-[#a0a6a3] mb-6">
              No direct browser preview available for this file type ({file.mime_type}).
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#13261e] hover:bg-[#1b563f] text-[#2fd697] border border-[#1b563f] font-semibold text-sm rounded-xl shadow-lg transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download File ({formatBytes(file.size)})</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="h-10 px-6 bg-slate-900/60 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <span>Stored securely in Cloudflare R2</span>
        <span>ID: {file.id.slice(0, 8)}...</span>
      </div>
    </div>
  );
};

export default FilePreviewModal;
