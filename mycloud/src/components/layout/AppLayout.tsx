import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileFloatingNav from './MobileFloatingNav';
import UploadManager from '../upload/UploadManager';
import DropZone from '../upload/DropZone';
import CreateFolderModal from '../files/CreateFolderModal';
import RenameModal from '../files/RenameModal';
import MoveModal from '../files/MoveModal';
import ShareModal from '../files/ShareModal';
import DeleteConfirmModal from '../files/DeleteConfirmModal';
import FilePreviewModal from '../files/FilePreviewModal';
import PwaInstallModal from '../pwa/PwaInstallModal';
import PwaInstallBanner from '../pwa/PwaInstallBanner';
import { Folder, FileItem } from '../../types';
import { useStorage } from '../../context/StorageContext';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  // Global Modal Target States
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'file' | 'folder'; isPermanent?: boolean } | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const {
    moveToTrashFile,
    moveToTrashFolder,
    permanentlyDeleteFile,
    permanentlyDeleteFolder,
  } = useStorage();

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.isPermanent) {
      if (deleteTarget.type === 'file') {
        await permanentlyDeleteFile(deleteTarget.id);
      } else {
        await permanentlyDeleteFolder(deleteTarget.id);
      }
    } else {
      if (deleteTarget.type === 'file') {
        await moveToTrashFile(deleteTarget.id);
      } else {
        await moveToTrashFolder(deleteTarget.id);
      }
    }
  };

  return (
    <DropZone>
      <div className="min-h-screen bg-[#050806] text-[#f5f5f5] relative flex flex-col selection:bg-brand-500 selection:text-[#050806] w-full max-w-full overflow-x-hidden">
        {/* Ambient Emerald & Obsidian Glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/8 rounded-full blur-[128px]" />
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-brand-600/6 rounded-full blur-[140px]" />
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-900/15 rounded-full blur-[128px]" />
        </div>

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenCreateFolder={() => setCreateFolderOpen(true)}
        />

        {/* Main Content Area */}
        <div className="lg:pl-64 flex flex-col flex-1 min-w-0 relative z-10 w-full max-w-full overflow-x-hidden">
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-28 lg:pb-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
            <Outlet
              context={{
                onOpenCreateFolder: () => setCreateFolderOpen(true),
                onPreviewFile: (file: FileItem) => setPreviewFile(file),
                onRenameFolder: (folder: Folder) => setRenameTarget({ id: folder.id, name: folder.name, type: 'folder' }),
                onRenameFile: (file: FileItem) => setRenameTarget({ id: file.id, name: file.name, type: 'file' }),
                onMoveFolder: (folder: Folder) => setMoveTarget({ id: folder.id, name: folder.name, type: 'folder' }),
                onMoveFile: (file: FileItem) => setMoveTarget({ id: file.id, name: file.name, type: 'file' }),
                onShareFolder: (folder: Folder) => setShareTarget({ id: folder.id, name: folder.name, type: 'folder' }),
                onShareFile: (file: FileItem) => setShareTarget({ id: file.id, name: file.name, type: 'file' }),
                onDeleteFolder: (folder: Folder) => setDeleteTarget({ id: folder.id, name: folder.name, type: 'folder' }),
                onDeleteFile: (file: FileItem) => setDeleteTarget({ id: file.id, name: file.name, type: 'file' }),
                onPermanentDeleteFolder: (folder: Folder) => setDeleteTarget({ id: folder.id, name: folder.name, type: 'folder', isPermanent: true }),
                onPermanentDeleteFile: (file: FileItem) => setDeleteTarget({ id: file.id, name: file.name, type: 'file', isPermanent: true }),
              }}
            />
          </main>
        </div>

        {/* Mobile Floating Island Navigation */}
        <MobileFloatingNav onOpenCreateFolder={() => setCreateFolderOpen(true)} />

        {/* Global Floating Upload Drawer */}
        <UploadManager />

        {/* Modals */}
        <CreateFolderModal
          isOpen={createFolderOpen}
          onClose={() => setCreateFolderOpen(false)}
        />

        <RenameModal
          isOpen={Boolean(renameTarget)}
          onClose={() => setRenameTarget(null)}
          target={renameTarget}
        />

        <MoveModal
          isOpen={Boolean(moveTarget)}
          onClose={() => setMoveTarget(null)}
          target={moveTarget}
        />

        <ShareModal
          isOpen={Boolean(shareTarget)}
          onClose={() => setShareTarget(null)}
          target={shareTarget}
        />

        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title={deleteTarget?.isPermanent ? `Permanently delete "${deleteTarget?.name}"?` : `Move "${deleteTarget?.name}" to Trash?`}
          message={
            deleteTarget?.isPermanent
              ? 'This will remove the file permanently from Cloudflare R2 and delete its database metadata. This action cannot be reversed.'
              : 'You can restore this item from Trash at any time, or delete it permanently.'
          }
          isPermanent={deleteTarget?.isPermanent}
        />

        <FilePreviewModal
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
          file={previewFile}
          onShare={(f) => setShareTarget({ id: f.id, name: f.name, type: 'file' })}
          onRename={(f) => setRenameTarget({ id: f.id, name: f.name, type: 'file' })}
          onDelete={(f) => setDeleteTarget({ id: f.id, name: f.name, type: 'file' })}
        />

        {/* Progressive Web App Install Support */}
        <PwaInstallBanner />
        <PwaInstallModal />
      </div>
    </DropZone>
  );
};

export default AppLayout;

