import React, { useState, useRef, useEffect } from 'react';
import {
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileSpreadsheet,
  FileArchive,
  MoreVertical,
  Star,
  Download,
  Share2,
  Edit2,
  FolderInput,
  Trash2,
  Eye,
  Edit3,
  Play,
} from 'lucide-react';
import { FileItem } from '../../types';
import { useStorage } from '../../context/StorageContext';
import { formatBytes, formatDate, formatRelativeTime, getFileTypeCategory } from '../../utils/format';
import { useFileThumbnail } from '../../utils/thumbnail';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface FileCardProps {
  file: FileItem;
  onPreview: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onMove: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onPreview,
  onRename,
  onMove,
  onShare,
  onDelete,
}) => {
  const { toggleStarFile } = useStorage();
  const { thumbnailUrl, isVideo, setError } = useFileThumbnail(file);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryIcon = () => {
    const category = getFileTypeCategory(file.mime_type, file.name);
    switch (category) {
      case 'image':
        return <FileImage className="w-5 h-5 text-[#2fd697]" />;
      case 'video':
        return <FileVideo className="w-5 h-5 text-[#2fd697]" />;
      case 'audio':
        return <FileAudio className="w-5 h-5 text-[#2fd697]" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-[#2fd697]" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-[#2fd697]" />;
      case 'archive':
        return <FileArchive className="w-5 h-5 text-[#2fd697]" />;
      default:
        return <File className="w-5 h-5 text-[#2fd697]" />;
    }
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const res = await api.get<{ downloadUrl: string }>(`/api/files/download/${file.id}`);
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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: file.id, type: 'file' }));
  };

  const isEditableText =
    file.mime_type.startsWith('text/') ||
    /\.(md|txt|json|js|jsx|ts|tsx|html|css|py|sh|csv|xml|log|yaml|yml)$/i.test(file.name);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={() => onPreview(file)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(true);
      }}
      className={`group relative bg-[#101210] border border-[#1c2820] hover:border-[#2fd697]/50 hover:bg-[#121613] rounded-2xl p-3.5 sm:p-4 transition-all duration-200 select-none cursor-pointer flex flex-col justify-between w-full min-w-0 max-w-full text-[#f5f5f5] ${
        menuOpen ? 'z-50 shadow-2xl ring-1 ring-[#2fd697]/30' : 'z-10 hover:z-20'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#13261e] border border-[#1b563f] flex items-center justify-center text-[#2fd697] shrink-0">
            {getCategoryIcon()}
          </div>
          <span className="text-[10px] font-mono uppercase text-[#8a948e] bg-[#141815] px-1.5 py-0.5 rounded border border-[#202722] truncate max-w-[65px]">
            {file.name.split('.').pop() || 'file'}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStarFile(file.id);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              file.is_starred
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-[#8a948e] hover:text-amber-400 hover:bg-[#13261e]'
            }`}
            title={file.is_starred ? 'Unstar' : 'Star'}
            aria-label="Star file"
          >
            <Star className={`w-3.5 h-3.5 ${file.is_starred ? 'fill-amber-400' : ''}`} />
          </button>

          {/* 3-dots Action Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a948e] hover:text-[#2fd697] hover:bg-[#13261e] transition-colors"
              title="File Options"
              aria-label="File actions menu"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-52 bg-[#101210] rounded-xl shadow-2xl border border-[#1c2820] py-1.5 z-50 animate-slide-up text-xs font-medium text-[#f5f5f5]"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onPreview(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#13261e] hover:text-[#2fd697] transition-colors text-left"
                >
                  <Eye className="w-3.5 h-3.5 text-[#2fd697]" />
                  <span>Preview</span>
                </button>
                {isEditableText && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onPreview(file);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#13261e] text-[#2fd697] transition-colors text-left font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#2fd697]" />
                    <span>Edit content</span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    setMenuOpen(false);
                    handleDownload(e);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#13261e] hover:text-[#2fd697] transition-colors text-left"
                >
                  <Download className="w-3.5 h-3.5 text-[#a0a6a3]" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onShare(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#13261e] hover:text-[#2fd697] transition-colors text-left"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#a0a6a3]" />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#13261e] hover:text-[#2fd697] transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#a0a6a3]" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onMove(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#13261e] hover:text-[#2fd697] transition-colors text-left"
                >
                  <FolderInput className="w-3.5 h-3.5 text-[#a0a6a3]" />
                  <span>Move to...</span>
                </button>
                <div className="my-1 border-t border-[#1c2820]" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-500/10 text-rose-400 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Move to Trash</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail Preview Area */}
      {thumbnailUrl ? (
        <div className="relative w-full h-28 sm:h-32 mb-3 rounded-xl overflow-hidden bg-[#070a08] border border-[#1c2820] group-hover:border-[#2fd697]/40 transition-colors flex items-center justify-center">
          <img
            src={thumbnailUrl}
            alt={file.name}
            loading="lazy"
            onError={() => setError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isVideo && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs">
                <Play className="w-4 h-4 fill-white translate-x-0.5" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-20 sm:h-24 mb-3 rounded-xl bg-[#0a0d0b] border border-[#1c2820]/70 flex flex-col items-center justify-center gap-1.5 group-hover:border-[#2fd697]/30 transition-colors">
          <div className="text-[#2fd697]/70 group-hover:text-[#2fd697] transition-colors">
            {getCategoryIcon()}
          </div>
          <span className="text-[10px] text-[#8a948e] font-mono tracking-wide uppercase">
            .{file.name.split('.').pop() || 'file'}
          </span>
        </div>
      )}

      {/* File Details */}
      <div className="min-w-0 mt-auto">
        <div className="flex items-center gap-1.5 mb-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#f5f5f5] truncate flex-1 min-w-0" title={file.name}>
            {file.name}
          </h4>
          {file.is_starred && (
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#a0a6a3] gap-1.5 min-w-0 font-mono">
          <span className="shrink-0">{formatBytes(file.size)}</span>
          <span className="truncate text-right" title={formatDate(file.updated_at)}>
            {formatRelativeTime(file.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
