import React, { useState } from 'react';
import {
  Folder,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Star,
  Download,
  Share2,
  Edit2,
  FolderInput,
  FolderOpen,
  Trash2,
  Eye,
} from 'lucide-react';
import { Folder as FolderType, FileItem } from '../../types';
import { useStorage } from '../../context/StorageContext';
import { formatBytes, formatDate, getFileTypeCategory } from '../../utils/format';
import { useFileThumbnail } from '../../utils/thumbnail';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const FileRowThumbnail: React.FC<{ file: FileItem; defaultIcon: React.ReactNode }> = ({ file, defaultIcon }) => {
  const { thumbnailUrl, setError } = useFileThumbnail(file);

  if (thumbnailUrl) {
    return (
      <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#1b563f] shrink-0 bg-[#070a08]">
        <img
          src={thumbnailUrl}
          alt={file.name}
          loading="lazy"
          onError={() => setError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-[#13261e] border border-[#1b563f] flex items-center justify-center shrink-0 text-[#2fd697]">
      {defaultIcon}
    </div>
  );
};

interface FileListProps {
  folders: FolderType[];
  files: FileItem[];
  onPreviewFile: (file: FileItem) => void;
  onRenameFolder: (folder: FolderType) => void;
  onRenameFile: (file: FileItem) => void;
  onMoveFolder: (folder: FolderType) => void;
  onMoveFile: (file: FileItem) => void;
  onShareFolder: (folder: FolderType) => void;
  onShareFile: (file: FileItem) => void;
  onDeleteFolder: (folder: FolderType) => void;
  onDeleteFile: (file: FileItem) => void;
}

export const FileList: React.FC<FileListProps> = ({
  folders,
  files,
  onPreviewFile,
  onRenameFolder,
  onRenameFile,
  onMoveFolder,
  onMoveFile,
  onShareFolder,
  onShareFile,
  onDeleteFolder,
  onDeleteFile,
}) => {
  const { navigateToFolder, toggleStarFolder, toggleStarFile, moveFile, moveFolder } = useStorage();
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolderId !== folderId) setDragOverFolderId(folderId);
  };

  const handleFolderDragLeave = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverFolderId === folderId) setDragOverFolderId(null);
  };

  const handleFolderDrop = async (e: React.DragEvent, targetFolder: FolderType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const item = JSON.parse(dataStr);
        if (item.type === 'file') {
          await moveFile(item.id, targetFolder.id);
          toast.success(`Moved "${item.name || 'file'}" into "${targetFolder.name}"`);
        } else if (item.type === 'folder' && item.id !== targetFolder.id) {
          await moveFolder(item.id, targetFolder.id);
          toast.success(`Moved "${item.name || 'folder'}" into "${targetFolder.name}"`);
        }
      }
    } catch (err) {
      console.warn('Folder drop error in list view:', err);
      toast.error('Failed to move item');
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string, type: 'file' | 'folder', name: string) => {
    setDraggingItemId(id);
    (window as any).__mycloud_internal_drag = true;
    e.dataTransfer.setData('application/x-mycloud-item', 'true');
    e.dataTransfer.setData('application/json', JSON.stringify({ id, type, name }));
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
    (window as any).__mycloud_internal_drag = false;
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    const category = getFileTypeCategory(mimeType, filename);
    switch (category) {
      case 'image':
        return <FileImage className="w-4 h-4 text-[#2fd697]" />;
      case 'video':
        return <FileVideo className="w-4 h-4 text-[#2fd697]" />;
      case 'audio':
        return <FileAudio className="w-4 h-4 text-[#2fd697]" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-[#2fd697]" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-4 h-4 text-[#2fd697]" />;
      case 'archive':
        return <FileArchive className="w-4 h-4 text-[#2fd697]" />;
      default:
        return <File className="w-4 h-4 text-[#2fd697]" />;
    }
  };

  const handleDownload = async (file: FileItem) => {
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

  return (
    <div className="bg-[#101210]/90 backdrop-blur-xl rounded-2xl border border-[#1c2820] overflow-hidden shadow-sm overflow-x-auto w-full max-w-full text-[#f5f5f5]">
      <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
        <thead>
          <tr className="border-b border-[#1c2820] bg-[#0a0d0b] text-[11px] font-semibold text-[#a0a6a3] uppercase tracking-wider font-mono">
            <th className="py-3 px-4 w-10"></th>
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4 hidden md:table-cell">Last Modified</th>
            <th className="py-3 px-4 hidden sm:table-cell">File Size</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c2820] text-sm">
          {/* Folders */}
          {folders.map((folder) => {
            const isHovered = dragOverFolderId === folder.id;
            const isDragging = draggingItemId === folder.id;
            return (
              <tr
                key={folder.id}
                draggable
                onDragStart={(e) => handleDragStart(e, folder.id, 'folder', folder.name)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                onDragLeave={(e) => handleFolderDragLeave(e, folder.id)}
                onDrop={(e) => handleFolderDrop(e, folder)}
                onDoubleClick={() => navigateToFolder(folder.id, folder.name)}
                className={`transition-all group cursor-pointer ${
                  isHovered
                    ? 'bg-[#14231b] ring-2 ring-[#2fd697] text-[#2fd697]'
                    : isDragging
                    ? 'opacity-40 bg-[#13261e]/20'
                    : 'hover:bg-[#13261e]/40'
                }`}
              >
                <td className="py-2.5 px-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStarFolder(folder.id);
                    }}
                    className="text-[#a0a6a3] hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        folder.is_starred ? 'text-amber-400 fill-amber-400' : ''
                      }`}
                    />
                  </button>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isHovered
                        ? 'bg-[#2fd697] text-[#050806]'
                        : 'bg-[#13261e] border border-[#1b563f] text-[#2fd697]'
                    }`}>
                      {isHovered ? (
                        <FolderOpen className="w-4 h-4 fill-current" />
                      ) : (
                        <Folder className="w-4 h-4 fill-[#2fd697]/20" />
                      )}
                    </div>
                    <span className="font-semibold text-[#f5f5f5] truncate" title={folder.name}>
                      {folder.name}
                    </span>
                    {isHovered && (
                      <span className="text-xs text-[#2fd697] font-medium animate-pulse ml-2">
                        (Drop to move inside)
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-4 text-xs text-[#a0a6a3] hidden md:table-cell font-mono">
                  {formatDate(folder.updated_at)}
                </td>
                <td className="py-2.5 px-4 text-xs text-[#a0a6a3] hidden sm:table-cell font-mono">—</td>
                <td className="py-2.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareFolder(folder);
                      }}
                      className="p-1.5 text-[#a0a6a3] hover:text-[#2fd697] rounded-lg hover:bg-[#13261e]"
                      title="Share"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRenameFolder(folder);
                      }}
                      className="p-1.5 text-[#a0a6a3] hover:text-[#2fd697] rounded-lg hover:bg-[#13261e]"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveFolder(folder);
                      }}
                      className="p-1.5 text-[#a0a6a3] hover:text-[#2fd697] rounded-lg hover:bg-[#13261e]"
                      title="Move to..."
                    >
                      <FolderInput className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder);
                      }}
                      className="p-1.5 text-[#a0a6a3] hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                      title="Move to trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {/* Files */}
          {files.map((file) => {
            const isDragging = draggingItemId === file.id;
            return (
              <tr
                key={file.id}
                draggable
                onDragStart={(e) => handleDragStart(e, file.id, 'file', file.name)}
                onDragEnd={handleDragEnd}
                onDoubleClick={() => onPreviewFile(file)}
                className={`transition-colors group cursor-pointer ${
                  isDragging ? 'opacity-40 bg-[#13261e]/20' : 'hover:bg-[#13261e]/40'
                }`}
              >
              <td className="py-2.5 px-4 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStarFile(file.id);
                  }}
                  className="text-[#a0a6a3] hover:text-amber-400 transition-colors"
                >
                  <Star
                    className={`w-4 h-4 ${
                      file.is_starred ? 'text-amber-400 fill-amber-400' : ''
                    }`}
                  />
                </button>
              </td>
              <td className="py-2.5 px-4">
                <div className="flex items-center gap-3">
                  <FileRowThumbnail file={file} defaultIcon={getFileIcon(file.mime_type, file.name)} />
                  <span className="font-medium text-[#f5f5f5] truncate" title={file.name}>
                    {file.name}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-4 text-xs text-[#a0a6a3] hidden md:table-cell font-mono">
                {formatDate(file.updated_at)}
              </td>
              <td className="py-2.5 px-4 text-xs text-[#a0a6a3] font-medium hidden sm:table-cell font-mono">
                {formatBytes(file.size)}
              </td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewFile(file);
                    }}
                    className="p-1.5 text-[#a0a6a3] hover:text-[#2fd697] rounded-lg hover:bg-[#13261e]"
                    title="Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file);
                    }}
                    className="p-1.5 text-[#a0a6a3] hover:text-[#2fd697] rounded-lg hover:bg-[#13261e]"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareFile(file);
                    }}
                    className="p-1.5 text-[#a0a6a3] hover:text-[#2fd697] rounded-lg hover:bg-[#13261e]"
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameFile(file);
                    }}
                    className="p-1.5 text-[#a0a6a3] hover:text-[#2fd697] rounded-lg hover:bg-[#13261e]"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveFile(file);
                    }}
                    className="p-1.5 text-[#a0a6a3] hover:text-[#2fd697] rounded-lg hover:bg-[#13261e]"
                    title="Move to..."
                  >
                    <FolderInput className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file);
                    }}
                    className="p-1.5 text-[#a0a6a3] hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                    title="Move to trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FileList;
