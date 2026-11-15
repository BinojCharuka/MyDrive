import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStorage } from '../context/StorageContext';
import Toolbar from '../components/files/Toolbar';
import FileGrid from '../components/files/FileGrid';
import FileList from '../components/files/FileList';
import { Clock } from 'lucide-react';

export const RecentPage: React.FC = () => {
  const { allFiles, viewMode, searchQuery } = useStorage();
  const context = useOutletContext<any>();

  let recentFiles = allFiles
    .filter((f) => !f.is_deleted && f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <div className="space-y-4 animate-fade-in w-full max-w-full min-w-0">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#1c2820]">
        <div className="w-8 h-8 rounded-xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xl font-serif font-normal text-[#f5f5f5]">Recent Files</h2>
          <p className="text-xs text-[#a0a6a3]">Files you have opened or uploaded recently</p>
        </div>
      </div>

      <Toolbar totalItems={recentFiles.length} />

      {viewMode === 'grid' ? (
        <FileGrid
          folders={[]}
          files={recentFiles}
          onPreviewFile={context?.onPreviewFile}
          onRenameFolder={context?.onRenameFolder}
          onRenameFile={context?.onRenameFile}
          onMoveFolder={context?.onMoveFolder}
          onMoveFile={context?.onMoveFile}
          onShareFolder={context?.onShareFolder}
          onShareFile={context?.onShareFile}
          onDeleteFolder={context?.onDeleteFolder}
          onDeleteFile={context?.onDeleteFile}
          emptyTitle="No recent files"
          emptySubtitle="Files you upload or modify will appear here."
        />
      ) : (
        <FileList
          folders={[]}
          files={recentFiles}
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

export default RecentPage;
