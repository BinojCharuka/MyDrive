import React, { useState, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  Share2,
  Star,
  Plus,
  Upload,
  FolderPlus,
  FolderUp,
  X,
  HardDrive,
  Cloud,
  Lock,
} from 'lucide-react';
import { useUpload } from '../../context/UploadContext';
import { useStorage } from '../../context/StorageContext';
import { formatBytes } from '../../utils/format';

interface MobileFloatingNavProps {
  onOpenCreateFolder: () => void;
}

export const MobileFloatingNav: React.FC<MobileFloatingNavProps> = ({ onOpenCreateFolder }) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { uploadFiles, uploadFolderStructure } = useUpload();
  const { storageUsage } = useStorage();
  const location = useLocation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const r2Used = storageUsage.r2?.usedBytes ?? storageUsage.usedBytes;
  const r2Quota = storageUsage.r2?.quotaBytes ?? 10737418240;
  const r2Percent = storageUsage.r2?.percent ?? Math.min(100, Math.round((r2Used / r2Quota) * 100));

  const clUsed = storageUsage.cloudinary?.usedBytes ?? 0;
  const clQuota = storageUsage.cloudinary?.quotaBytes ?? 26843545600;
  const clPercent = storageUsage.cloudinary?.percent ?? Math.min(100, Math.round((clUsed / clQuota) * 100));

  const percentUsed = Math.min(
    100,
    Math.round((storageUsage.usedBytes / storageUsage.quotaBytes) * 100)
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = '';
      setSheetOpen(false);
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesWithPaths = Array.from(e.target.files).map((file) => ({
        file,
        relativePath: (file as any).webkitRelativePath || file.name,
      }));
      uploadFolderStructure(filesWithPaths);
      e.target.value = '';
      setSheetOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Files', path: '/files', icon: Folder },
    // Center button slot will be rendered between Files and Shared
    { name: 'Shared', path: '/shared-with-me', icon: Share2 },
    { name: 'Starred', path: '/starred', icon: Star },
  ];

  return (
    <>
      {/* Hidden File and Folder Pickers */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        type="file"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        ref={folderInputRef}
        onChange={handleFolderSelect}
        className="hidden"
      />

      {/* Liquid Action Sheet Backdrop */}
      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          className="fixed inset-0 bg-[#050806]/85 backdrop-blur-md z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* Liquid Quick-Action Sheet Drawer */}
      <div
        className={`fixed left-4 right-4 bottom-24 max-w-md mx-auto z-50 lg:hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          sheetOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="bg-[#101210]/95 backdrop-blur-2xl border border-[#1c2820] rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-[#f5f5f5]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c2820] mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#13261e] text-[#2fd697] border border-[#1b563f] flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#f5f5f5]">Quick Actions</h4>
                <div className="text-[10px] text-[#a0a6a3] flex items-center gap-2 font-mono">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-2.5 h-2.5 text-[#2fd697]" />
                    <span>R2: {formatBytes(r2Used)}/10GB</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Cloud className="w-2.5 h-2.5 text-[#2fd697]" />
                    <span>CL: {formatBytes(clUsed)}/25GB</span>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              className="p-1.5 text-[#a0a6a3] hover:text-[#f5f5f5] rounded-full hover:bg-[#13261e] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Upload Files */}
            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              disabled={percentUsed >= 100}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#050806] hover:bg-[#13261e] active:scale-95 border border-[#1c2820] transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-xl bg-[#13261e] border border-[#1b563f] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform text-[#2fd697]">
                <Upload className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-medium text-[#f5f5f5]">Upload Files</span>
            </button>

            {/* Upload Folder */}
            <button
              onClick={() => {
                folderInputRef.current?.click();
              }}
              disabled={percentUsed >= 100}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#050806] hover:bg-[#13261e] active:scale-95 border border-[#1c2820] transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-xl bg-[#13261e] border border-[#1b563f] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform text-[#2fd697]">
                <FolderUp className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-medium text-[#f5f5f5]">Upload Folder</span>
            </button>

            {/* Create New Folder */}
            <button
              onClick={() => {
                setSheetOpen(false);
                onOpenCreateFolder();
              }}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#050806] hover:bg-[#13261e] active:scale-95 border border-[#1c2820] transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#13261e] border border-[#1b563f] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform text-[#2fd697]">
                <FolderPlus className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-medium text-[#f5f5f5]">New Folder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Liquid Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-4 inset-x-3 sm:inset-x-6 max-w-md mx-auto z-40 lg:hidden"
      >
        <div className="bg-[#101210]/90 backdrop-blur-2xl border border-[#1c2820] shadow-[0_16px_40px_rgba(0,0,0,0.8)] rounded-full p-1.5 flex items-center justify-between relative ring-1 ring-white/5">
          {/* 1. Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-90 min-w-[54px] min-h-[48px] ${
                isActive
                  ? 'text-[#2fd697] bg-[#13261e] border border-[#1b563f] shadow-inner font-semibold'
                  : 'text-[#a0a6a3] hover:text-[#f5f5f5]'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
          </NavLink>

          {/* 2. Files */}
          <NavLink
            to="/files"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-90 min-w-[54px] min-h-[48px] ${
                isActive
                  ? 'text-[#2fd697] bg-[#13261e] border border-[#1b563f] shadow-inner font-semibold'
                  : 'text-[#a0a6a3] hover:text-[#f5f5f5]'
              }`
            }
          >
            <Folder className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Files</span>
          </NavLink>

          {/* 3. Center Liquid Action Button (+) */}
          <div className="relative -my-3 px-1">
            <button
              onClick={() => setSheetOpen(!sheetOpen)}
              aria-label="Add or upload"
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg transition-all duration-300 active:scale-90 ${
                sheetOpen
                  ? 'bg-rose-500 text-white shadow-rose-500/40 rotate-45'
                  : 'bg-gradient-to-tr from-[#2fd697] to-[#1eb57c] text-[#050806] shadow-[#2fd697]/30 hover:shadow-[#2fd697]/50 hover:scale-105'
              }`}
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          {/* 4. Shared */}
          <NavLink
            to="/shared-with-me"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-90 min-w-[54px] min-h-[48px] ${
                isActive
                  ? 'text-[#2fd697] bg-[#13261e] border border-[#1b563f] shadow-inner font-semibold'
                  : 'text-[#a0a6a3] hover:text-[#f5f5f5]'
              }`
            }
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Shared</span>
          </NavLink>

          {/* 5. Starred */}
          <NavLink
            to="/starred"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-90 min-w-[54px] min-h-[48px] ${
                isActive
                  ? 'text-[#2fd697] bg-[#13261e] border border-[#1b563f] shadow-inner font-semibold'
                  : 'text-[#a0a6a3] hover:text-[#f5f5f5]'
              }`
            }
          >
            <Star className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Starred</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
};

export default MobileFloatingNav;

