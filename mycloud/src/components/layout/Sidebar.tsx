import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Cloud,
  FolderPlus,
  Upload,
  FolderUp,
  LayoutDashboard,
  Folder,
  Clock,
  Star,
  Users,
  Share2,
  Trash2,
  Settings,
  Plus,
  HardDrive,
  ChevronRight,
  Lock,
  Smartphone,
} from 'lucide-react';
import { useStorage } from '../../context/StorageContext';
import { useUpload } from '../../context/UploadContext';
import { usePwa } from '../../context/PwaContext';
import { formatBytes } from '../../utils/format';

interface SidebarProps {
  onOpenCreateFolder: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenCreateFolder,
  isOpen = false,
  onClose,
}) => {
  const { storageUsage } = useStorage();
  const { uploadFiles, uploadFolderStructure } = useUpload();
  const { promptInstall, isStandalone } = usePwa();
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Close "+ New" dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setNewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = '';
      setNewMenuOpen(false);
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
      setNewMenuOpen(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Files', path: '/files', icon: Folder },
    { name: 'Recent', path: '/recent', icon: Clock },
    { name: 'Starred', path: '/starred', icon: Star },
    { name: 'Shared with Me', path: '/shared-with-me', icon: Users },
    { name: 'Shared by Me', path: '/shared-by-me', icon: Share2 },
    { name: 'Trash', path: '/trash', icon: Trash2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const percentUsed = Math.min(
    100,
    Math.round((storageUsage.usedBytes / storageUsage.quotaBytes) * 100)
  );

  const r2Used = storageUsage.r2?.usedBytes ?? 0;
  const r2Quota = storageUsage.r2?.quotaBytes ?? 10737418240; // 10 GB
  const r2Percent = storageUsage.r2?.percent ?? Math.min(100, Math.round((r2Used / r2Quota) * 100));

  const clUsed = storageUsage.cloudinary?.usedBytes ?? 0;
  const clQuota = storageUsage.cloudinary?.quotaBytes ?? 26843545600; // 25 GB
  const clPercent = storageUsage.cloudinary?.percent ?? Math.min(100, Math.round((clUsed / clQuota) * 100));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-[#050806]/80 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container with Obsidian & Emerald Aesthetic */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0a0d0b]/95 backdrop-blur-2xl border-r border-[#1c2820] flex flex-col z-40 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 text-[#f5f5f5] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo & Name */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#1c2820]">
          <div className="w-9 h-9 rounded-2xl bg-[#13261e] border border-[#1b563f] flex items-center justify-center text-[#2fd697] shadow-sm">
            <Cloud className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-[#f5f5f5] tracking-tight">
              MyCloud
            </h1>
            <p className="text-[10px] text-[#a0a6a3] font-medium font-mono">Your Files. Anywhere.</p>
          </div>
        </div>

        {/* Hidden Upload Inputs */}
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

        {/* "+ New" Action Button & Dropdown */}
        <div className="p-4" ref={newMenuRef}>
          <div className="relative">
            <button
              onClick={() => setNewMenuOpen(!newMenuOpen)}
              disabled={percentUsed >= 100}
              className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 font-semibold rounded-2xl shadow-md transition-all active:scale-[0.98] ${
                percentUsed >= 100
                  ? 'bg-[#1a201c] text-[#707774] cursor-not-allowed border border-[#1c2820]'
                  : 'bg-gradient-to-r from-[#2fd697] to-[#1eb57c] hover:from-[#28c287] hover:to-[#188f63] text-[#050806] shadow-lg shadow-[#2fd697]/20 hover:shadow-[#2fd697]/30'
              }`}
            >
              {percentUsed >= 100 ? (
                <>
                  <Lock className="w-4 h-4 text-[#707774]" />
                  <span className="text-sm tracking-wide">10 GB Full</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span className="text-sm tracking-wide">New</span>
                </>
              )}
            </button>

            {/* Dropdown Options */}
            {newMenuOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#101210] rounded-2xl shadow-2xl border border-[#1c2820] py-2 z-50 animate-slide-up text-[#f5f5f5]">
                <button
                  onClick={() => {
                    setNewMenuOpen(false);
                    onOpenCreateFolder();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#f5f5f5] hover:bg-[#13261e] hover:text-[#2fd697] transition-colors text-left"
                >
                  <FolderPlus className="w-4 h-4 text-[#2fd697]" />
                  <span>New folder</span>
                </button>
                <div className="my-1 border-t border-[#1c2820]" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#f5f5f5] hover:bg-[#13261e] hover:text-[#2fd697] transition-colors text-left"
                >
                  <Upload className="w-4 h-4 text-[#2fd697]" />
                  <span>File upload</span>
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#f5f5f5] hover:bg-[#13261e] hover:text-[#2fd697] transition-colors text-left"
                >
                  <FolderUp className="w-4 h-4 text-[#2fd697]" />
                  <span>Folder upload</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#13261e] text-[#2fd697] font-semibold shadow-2xs border border-[#1b563f]/80'
                      : 'text-[#a0a6a3] hover:bg-[#101210] hover:text-[#f5f5f5]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {/* Install App Action */}
          {!isStandalone && (
            <button
              onClick={() => {
                onClose?.();
                promptInstall();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-[#2fd697] bg-[#13261e]/70 hover:bg-[#13261e] border border-[#1b563f]/60 transition-all duration-200 active:scale-[0.98] mt-2 text-left"
            >
              <Smartphone className="w-4 h-4 text-[#2fd697] shrink-0" />
              <span>Install Web App</span>
            </button>
          )}
        </nav>

        {/* Bottom Storage Meter: Cloudflare R2 (10 GB) & Cloudinary Media (25 GB) */}
        <div className="p-3.5 border-t border-[#1c2820] space-y-2.5">
          {/* Cloudflare R2 Widget */}
          <div className="p-3 rounded-2xl bg-[#101210] border border-[#1c2820]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#f5f5f5] mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <HardDrive className="w-3.5 h-3.5 text-[#2fd697] shrink-0" />
                <span className="truncate text-[11px]">Cloudflare R2</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-medium text-[#2fd697] bg-[#13261e] border border-[#1b563f] px-1.5 py-0.5 rounded-md shrink-0">
                <Lock className="w-2.5 h-2.5 text-[#2fd697]" />
                <span>10 GB Lock</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-[#050806] rounded-full overflow-hidden mb-1.5 border border-[#1c2820]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  r2Percent >= 95 ? 'bg-rose-500' : r2Percent > 80 ? 'bg-amber-400' : 'bg-[#2fd697]'
                }`}
                style={{ width: `${r2Percent}%` }}
              />
            </div>

            <p className="text-[10px] text-[#a0a6a3] flex items-center justify-between font-mono">
              <span>{formatBytes(r2Used)} / 10 GB</span>
              <span className="font-semibold text-[#2fd697]">{r2Percent}%</span>
            </p>
          </div>

          {/* Cloudinary Media Widget */}
          <div className="p-3 rounded-2xl bg-[#101210] border border-[#1c2820]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#f5f5f5] mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Cloud className="w-3.5 h-3.5 text-[#2fd697] shrink-0" />
                <span className="truncate text-[11px]">Cloudinary</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-medium text-[#2fd697] bg-[#13261e] border border-[#1b563f] px-1.5 py-0.5 rounded-md shrink-0">
                <Lock className="w-2.5 h-2.5 text-[#2fd697]" />
                <span>25 GB Lock</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-[#050806] rounded-full overflow-hidden mb-1.5 border border-[#1c2820]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  clPercent >= 95 ? 'bg-rose-500' : clPercent > 80 ? 'bg-amber-400' : 'bg-[#2fd697]'
                }`}
                style={{ width: `${clPercent}%` }}
              />
            </div>

            <p className="text-[10px] text-[#a0a6a3] flex items-center justify-between font-mono">
              <span>{formatBytes(clUsed)} / 25 GB</span>
              <span className="font-semibold text-[#2fd697]">{clPercent}%</span>
            </p>
          </div>

          <NavLink
            to="/settings"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-1 text-[11px] font-medium text-[#2fd697] hover:text-[#28c287] py-1 rounded-lg hover:bg-[#13261e] transition-colors"
          >
            <span>Manage storage</span>
            <ChevronRight className="w-3 h-3" />
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

