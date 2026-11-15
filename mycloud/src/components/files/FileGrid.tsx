import React from 'react';
import { Folder as FolderType, FileItem } from '../../types';
import FolderCard from './FolderCard';
import FileCard from './FileCard';
import { FolderOpen } from 'lucide-react';

interface FileGridProps {
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
  emptyTitle?: string;
  emptySubtitle?: string;
}

export const FileGrid: React.FC<FileGridProps> = ({
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
  emptyTitle = 'No files or folders found',
  emptySubtitle = 'Drag and drop files here or click New to upload.',
}) => {
  const hasItems = folders.length > 0 || files.length > 0;

  if (!hasItems) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-[#1c2820] bg-[#101210]/60 my-6">
        <div className="w-16 h-16 rounded-2xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base font-medium font-serif text-[#f5f5f5] mb-1">{emptyTitle}</h3>
        <p className="text-xs text-[#a0a6a3] max-w-sm">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="w-full max-w-full min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-semibold text-[#909893] uppercase tracking-wider">
              Folders
            </h3>
            <span className="text-[11px] font-medium text-[#657069] bg-[#111613] border border-[#1f2923] px-2 py-0.5 rounded-full font-mono">
              {folders.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-3.5 w-full max-w-full">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onRename={onRenameFolder}
                onMove={onMoveFolder}
                onShare={onShareFolder}
                onDelete={onDeleteFolder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div className="w-full max-w-full min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-semibold text-[#909893] uppercase tracking-wider">
              Files
            </h3>
            <span className="text-[11px] font-medium text-[#657069] bg-[#111613] border border-[#1f2923] px-2 py-0.5 rounded-full font-mono">
              {files.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-3.5 w-full max-w-full">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onPreview={onPreviewFile}
                onRename={onRenameFile}
                onMove={onMoveFile}
                onShare={onShareFile}
                onDelete={onDeleteFile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileGrid;
