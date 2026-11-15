import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Upload,
  User,
  LogOut,
  Settings,
  HardDrive,
  Menu,
  X,
  ChevronDown,
  Cloud,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStorage } from '../../context/StorageContext';
import { useUpload } from '../../context/UploadContext';
import { formatBytes } from '../../utils/format';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, profile, signOut, isDemoMode } = useAuth();
  const { storageUsage, searchQuery, setSearchQuery } = useStorage();
  const { uploadFiles } = useUpload();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

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

  return (
    <header className="pt-[env(safe-area-inset-top,0px)] bg-[#0a0d0b]/90 backdrop-blur-xl border-b border-[#1c2820] px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-all w-full max-w-full text-[#f5f5f5] min-h-[4rem]">
      {/* Hidden file input for quick upload button */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-2xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-[#a0a6a3] hover:text-[#2fd697] hover:bg-[#13261e] rounded-xl lg:hidden active:scale-95 transition-all shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input - Liquid Capsule */}
        <div className="relative w-full max-w-md min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a0a6a3]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files and folders..."
            className="w-full pl-10 pr-9 py-2 bg-[#101210] hover:bg-[#151917] focus:bg-[#101210] text-xs sm:text-sm text-[#f5f5f5] placeholder-[#a0a6a3] rounded-full border border-[#1c2820] focus:border-[#2fd697] focus:outline-none focus:ring-4 focus:ring-[#2fd697]/15 shadow-xs transition-all duration-200 min-w-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#a0a6a3] hover:text-[#f5f5f5]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
        {/* Quick Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={percentUsed >= 100}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2fd697] to-[#1eb57c] hover:from-[#28c287] hover:to-[#188f63] text-[#050806] text-xs sm:text-sm font-bold rounded-full shadow-md shadow-[#2fd697]/20 hover:shadow-lg hover:shadow-[#2fd697]/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4 stroke-[2.5]" />
          <span>Upload</span>
        </button>

        {/* Dual Storage Quick Indicators: Cloudflare R2 (10 GB) & Cloudinary (25 GB) */}
        <Link
          to="/settings"
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-[#101210] hover:bg-[#13261e] border border-[#1c2820] hover:border-[#1b563f] rounded-full text-xs text-[#f5f5f5] shadow-2xs font-mono transition-all group"
          title="Click to manage storage in Settings"
        >
          {/* R2 Indicator */}
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[#2fd697]" />
            <span className="text-[11px] text-[#a0a6a3]">R2:</span>
            <span className="font-semibold text-[11px] text-[#2fd697]">
              {formatBytes(r2Used)}/10GB
            </span>
          </div>

          <span className="text-[#2b3a30] font-bold">•</span>

          {/* Cloudinary Indicator */}
          <div className="flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-[#2fd697]" />
            <span className="text-[11px] text-[#a0a6a3]">CL:</span>
            <span className="font-semibold text-[11px] text-[#2fd697]">
              {formatBytes(clUsed)}/25GB
            </span>
          </div>
        </Link>

        {/* Demo Mode Badge */}
        {isDemoMode && (
          <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#1e2220] text-[#a0a6a3] border border-[#2b2e2d]">
            Demo Mode
          </span>
        )}

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-[#13261e] transition-all focus:outline-none ring-2 ring-transparent hover:ring-[#2fd697]/20"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-[#1c2820] shadow-2xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center font-bold text-xs shadow-sm">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <ChevronDown className="w-4 h-4 text-[#a0a6a3] hidden sm:block" />
          </button>

          {/* Dropdown Menu with Liquid Glass Styling */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#101210]/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-[#1c2820] py-2 z-50 animate-slide-up ring-1 ring-white/5 text-[#f5f5f5]">
              <div className="px-4 py-3 border-b border-[#1c2820]">
                <p className="text-sm font-semibold text-[#f5f5f5] truncate">
                  {profile?.full_name || 'Account'}
                </p>
                <p className="text-xs text-[#a0a6a3] truncate">{user?.email}</p>
                <div className="mt-2 text-xs text-[#2fd697] font-semibold flex items-center gap-1.5 font-mono">
                  <div className="w-2 h-2 rounded-full bg-[#2fd697] animate-pulse" />
                  <span>{percentUsed}% of 10 GB used</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#a0a6a3] hover:bg-[#13261e] hover:text-[#2fd697] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Account & Storage</span>
                </Link>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    signOut();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

