import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  MoreVertical,
  Star,
  Edit2,
  FolderInput,
  Share2,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { Folder as FolderType } from '../../types';
import { useStorage } from '../../context/StorageContext';
import { formatDate, formatRelativeTime } from '../../utils/format';
import toast from 'react-hot-toast';

interface FolderCardProps {
  folder: FolderType;
  onRename: (folder: FolderType) => void;
  onMove: (folder: FolderType) => void;
  onShare: (folder: FolderType) => void;
  onDelete: (folder: FolderType) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onRename,
  onMove,
  onShare,
  onDelete,
}) => {
  const { navigateToFolder, toggleStarFolder, moveFile, moveFolder } = useStorage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  // Drag and drop target to move items inside this folder
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const item = JSON.parse(dataStr);
        if (item.type === 'file') {
          await moveFile(item.id, folder.id);
          toast.success(`Moved "${item.name || 'file'}" into "${folder.name}"`);
        } else if (item.type === 'folder' && item.id !== folder.id) {
          await moveFolder(item.id, folder.id);
          toast.success(`Moved "${item.name || 'folder'}" into "${folder.name}"`);
        }
      }
    } catch (err) {
      console.warn('Drag move error:', err);
      toast.error('Failed to move item');
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    (window as any).__mycloud_internal_drag = true;
    e.dataTransfer.setData('application/x-mycloud-item', 'true');
    e.dataTransfer.setData('application/json', JSON.stringify({ id: folder.id, type: 'folder', name: folder.name }));
    e.dataTransfer.setData('text/plain', folder.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    (window as any).__mycloud_internal_drag = false;
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDoubleClick={() => navigateToFolder(folder.id, folder.name)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(true);
      }}
      className={`group relative bg-[#101210] border rounded-2xl p-3.5 sm:p-4 transition-all duration-200 select-none cursor-pointer flex flex-col justify-between w-full min-w-0 max-w-full text-[#f5f5f5] ${
        menuOpen ? 'z-50 shadow-2xl ring-1 ring-[#2fd697]/30' : 'z-10 hover:z-20'
      } ${
        isDragOver
          ? 'border-[#2fd697] bg-[#14231b] ring-4 ring-[#2fd697]/30 scale-[1.03] shadow-xl'
          : 'border-[#1c2820] hover:border-[#2fd697]/50 hover:bg-[#121613]'
      } ${isDragging ? 'opacity-40 scale-95 border-dashed border-[#2fd697]' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
          isDragOver
            ? 'bg-[#2fd697] text-[#050806] scale-110 shadow-lg shadow-[#2fd697]/30'
            : 'bg-[#13261e] border border-[#1b563f] text-[#2fd697]'
        }`}>
          {isDragOver ? (
            <FolderOpen className="w-5 h-5 fill-current" />
          ) : (
            <Folder className="w-4.5 h-4.5 fill-[#2fd697]/20 text-[#2fd697]" />
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStarFolder(folder.id);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              folder.is_starred
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-[#8a948e] hover:text-amber-400 hover:bg-[#13261e]'
            }`}
            title={folder.is_starred ? 'Unstar' : 'Star'}
            aria-label="Star folder"
          >
            <Star className={`w-3.5 h-3.5 ${folder.is_starred ? 'fill-amber-400' : ''}`} />
          </button>

          {/* 3-dots Action Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a948e] hover:text-[#2fd697] hover:bg-[#13261e] transition-colors"
              title="Folder Options"
              aria-label="Folder actions menu"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-48 bg-[#101210] rounded-xl shadow-2xl border border-[#1c2820] py-1.5 z-50 animate-slide-up text-xs font-medium text-[#f5f5f5]"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigateToFolder(folder.id, folder.name);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#13261e] hover:text-[#2fd697] transition-colors text-left"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#2fd697]" />
                  <span>Open folder</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onShare(folder);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#13261e] hover:text-[#2fd697] transition-colors text-left"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#a0a6a3]" />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(folder);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#13261e] hover:text-[#2fd697] transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#a0a6a3]" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onMove(folder);
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
                    onDelete(folder);
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

      <div className="min-w-0">
        <div className="flex items-center gap-1.5 mb-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#f5f5f5] truncate flex-1 min-w-0" title={folder.name}>
            {folder.name}
          </h4>
          {folder.is_starred && (
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
          )}
        </div>
        <div className="text-[11px] text-[#a0a6a3] truncate font-mono" title={formatDate(folder.updated_at)}>
          {isDragOver ? (
            <span className="text-[#2fd697] font-semibold animate-pulse flex items-center gap-1">
              <FolderInput className="w-3 h-3" />
              <span>Drop to move inside</span>
            </span>
          ) : (
            formatRelativeTime(folder.updated_at)
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderCard;
