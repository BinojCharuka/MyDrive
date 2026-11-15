import React, { useState } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useStorage } from '../context/StorageContext';
import Toolbar from '../components/files/Toolbar';
import FileGrid from '../components/files/FileGrid';
import FileList from '../components/files/FileList';
import { Users, Share2 } from 'lucide-react';

interface SharedPageProps {
  initialTab?: 'with-me' | 'by-me';
}

export const SharedPage: React.FC<SharedPageProps> = ({ initialTab }) => {
  const location = useLocation();
  const defaultTab = initialTab || (location.pathname.includes('shared-by-me') ? 'by-me' : 'with-me');
  const [activeTab, setActiveTab] = useState<'with-me' | 'by-me'>(defaultTab);

  const {
    sharedWithMeFiles,
    sharedWithMeFolders,
    sharedByMeFiles,
    sharedByMeFolders,
    viewMode,
  } = useStorage();

  const context = useOutletContext<any>();

  const isWithMe = activeTab === 'with-me';
  const folders = isWithMe ? sharedWithMeFolders : sharedByMeFolders;
  const files = isWithMe ? sharedWithMeFiles : sharedByMeFiles;
  const total = folders.length + files.length;

  return (
    <div className="space-y-4 animate-fade-in w-full max-w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1c2820]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
            {isWithMe ? <Users className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-xl font-serif font-normal text-[#f5f5f5]">Shared Files & Folders</h2>
            <p className="text-xs text-[#a0a6a3]">Collaborative items with other registered users</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#101210] p-1 rounded-2xl border border-[#1c2820] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('with-me')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'with-me'
                ? 'bg-[#13261e] border border-[#1b563f] text-[#2fd697] shadow-xs'
                : 'text-[#a0a6a3] hover:text-[#f5f5f5]'
            }`}
          >
            Shared with me
          </button>
          <button
            onClick={() => setActiveTab('by-me')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'by-me'
                ? 'bg-[#13261e] border border-[#1b563f] text-[#2fd697] shadow-xs'
                : 'text-[#a0a6a3] hover:text-[#f5f5f5]'
            }`}
          >
            Shared by me
          </button>
        </div>
      </div>

      <Toolbar totalItems={total} />

      {viewMode === 'grid' ? (
        <FileGrid
          folders={folders}
          files={files}
          onPreviewFile={context?.onPreviewFile}
          onRenameFolder={context?.onRenameFolder}
          onRenameFile={context?.onRenameFile}
          onMoveFolder={context?.onMoveFolder}
          onMoveFile={context?.onMoveFile}
          onShareFolder={context?.onShareFolder}
          onShareFile={context?.onShareFile}
          onDeleteFolder={context?.onDeleteFolder}
          onDeleteFile={context?.onDeleteFile}
          emptyTitle={isWithMe ? 'No files shared with you yet' : 'You haven’t shared any files yet'}
          emptySubtitle={
            isWithMe
              ? 'When another user shares files or folders with your registered email, they will appear here.'
              : 'Select any file or folder and click "Share" to collaborate with colleagues.'
          }
        />
      ) : (
        <FileList
          folders={folders}
          files={files}
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

export default SharedPage;
