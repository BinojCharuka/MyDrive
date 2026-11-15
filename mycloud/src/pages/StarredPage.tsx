import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStorage } from '../context/StorageContext';
import Toolbar from '../components/files/Toolbar';
import FileGrid from '../components/files/FileGrid';
import FileList from '../components/files/FileList';
import { Star } from 'lucide-react';

export const StarredPage: React.FC = () => {
  const { starredFiles, starredFolders, viewMode, searchQuery } = useStorage();
  const context = useOutletContext<any>();

  const filteredFolders = starredFolders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = starredFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = filteredFolders.length + filteredFiles.length;

  return (
    <div className="space-y-4 animate-fade-in w-full max-w-full min-w-0">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#1c2820]">
        <div className="w-8 h-8 rounded-xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
          <Star className="w-4 h-4 fill-[#2fd697]/20" />
        </div>
        <div>
          <h2 className="text-xl font-serif font-normal text-[#f5f5f5]">Starred</h2>
          <p className="text-xs text-[#a0a6a3]">Important files and folders for quick access</p>
        </div>
      </div>

      <Toolbar totalItems={total} />

      {viewMode === 'grid' ? (
        <FileGrid
          folders={filteredFolders}
          files={filteredFiles}
          onPreviewFile={context?.onPreviewFile}
          onRenameFolder={context?.onRenameFolder}
          onRenameFile={context?.onRenameFile}
          onMoveFolder={context?.onMoveFolder}
          onMoveFile={context?.onMoveFile}
          onShareFolder={context?.onShareFolder}
          onShareFile={context?.onShareFile}
          onDeleteFolder={context?.onDeleteFolder}
          onDeleteFile={context?.onDeleteFile}
          emptyTitle="No starred items"
          emptySubtitle="Star important files and folders to easily find them later."
        />
      ) : (
        <FileList
          folders={filteredFolders}
          files={filteredFiles}
          onPreviewFile={context?.onPreviewFile}
          onRenameFolder={context?.onRenameFolder}
          onRenameFile={context?.onRenameFile}
          onMoveFolder={context?.onMoveFolder}
          onMoveFile={context?.onMoveFile}
          onShareFolder={context?.onShareFolder}
          onShareFile={context?.onShareFile}
          onDeleteFolder={context?.onDeleteFolder}
          onDeleteFile={context?.onDeleteFile}
        />
      )}
    </div>
  );
};

export default StarredPage;
