import React from 'react';
import {
  HardDrive,
  Cloud,
  Files,
  Folder,
  Star,
  Upload,
  FolderPlus,
  ArrowRight,
  FileImage,
  FileVideo,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileAudio,
  Lock,
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { useUpload } from '../context/UploadContext';
import { formatBytes, getFileTypeCategory } from '../utils/format';
import { Link, useOutletContext } from 'react-router-dom';
import FileCard from '../components/files/FileCard';

export const DashboardPage: React.FC = () => {
  const { storageUsage, allFiles, allFolders } = useStorage();
  const { uploadFiles } = useUpload();
  const context = useOutletContext<any>();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const activeFiles = allFiles.filter((f) => !f.is_deleted);
  const activeFolders = allFolders.filter((f) => !f.is_deleted);
  const starredCount = activeFiles.filter((f) => f.is_starred).length;

  // Breakdown by category
  const categorySizes: Record<string, number> = {
    image: 0,
    video: 0,
    document: 0,
    spreadsheet: 0,
    archive: 0,
    audio: 0,
    other: 0,
  };

  activeFiles.forEach((file) => {
    const cat = getFileTypeCategory(file.mime_type, file.name);
    categorySizes[cat] = (categorySizes[cat] || 0) + file.size;
  });

  const categories = [
    { label: 'Images (Cloudinary)', key: 'image', icon: FileImage, color: 'bg-[#2fd697]' },
    { label: 'Videos (Cloudinary)', key: 'video', icon: FileVideo, color: 'bg-[#28c287]' },
    { label: 'Documents (R2)', key: 'document', icon: FileText, color: 'bg-[#1eb57c]' },
    { label: 'Spreadsheets (R2)', key: 'spreadsheet', icon: FileSpreadsheet, color: 'bg-[#188f63]' },
    { label: 'Audio (R2)', key: 'audio', icon: FileAudio, color: 'bg-[#187150]' },
    { label: 'Archives (R2)', key: 'archive', icon: FileArchive, color: 'bg-[#165d43]' },
  ];

  // Recent files (last 5 uploaded/updated)
  const recentFiles = [...activeFiles]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full max-w-full min-w-0">
      {/* Hidden file input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Dashboard Overview Header */}
      <div className="bg-[#101210] rounded-2xl p-5 sm:p-6 text-[#f5f5f5] border border-[#1c2820] flex flex-col md:flex-row md:items-center justify-between gap-5 w-full max-w-full">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#13261e] border border-[#1b563f] text-[#2fd697]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2fd697] animate-pulse" />
              <span>Dual Cloud Active</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium text-[#8a948e] bg-[#141815] border border-[#202722]">
              <Lock className="w-2.5 h-2.5 text-[#2fd697]" />
              <span>R2 10 GB</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium text-[#8a948e] bg-[#141815] border border-[#202722]">
              <Lock className="w-2.5 h-2.5 text-[#2fd697]" />
              <span>Cloudinary 25 GB</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-[#f5f5f5] tracking-tight mb-1">
            MyCloud Overview
          </h1>
          <p className="text-[#8a948e] text-xs sm:text-sm max-w-lg leading-relaxed">
            Photos and videos are routed to Cloudinary CDN; documents and other files are stored on Cloudflare R2.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={percentUsed >= 100}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-[#2fd697] hover:bg-[#28c287] active:scale-95 text-[#050806] font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-[#050806]" />
            <span>Upload</span>
          </button>
          <button
            onClick={context?.onOpenCreateFolder}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-[#13261e] hover:bg-[#1b563f] text-[#2fd697] font-semibold text-xs sm:text-sm rounded-xl border border-[#1b563f] transition-all active:scale-95 whitespace-nowrap"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New folder</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full max-w-full">
        {/* 1. Cloudflare R2 Quota Card */}
        <div className="bg-[#101210] border border-[#1c2820] hover:border-[#1b563f] rounded-2xl p-4 sm:p-4.5 transition-colors min-w-0">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#8a948e]">Cloudflare R2</span>
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#2fd697] bg-[#13261e] border border-[#1b563f] px-1.5 py-0.5 rounded-md">
              <Lock className="w-2.5 h-2.5" />
              <span>10 GB Lock</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-[#f5f5f5] mb-1">
            {formatBytes(r2Used)}
          </div>
          <div className="flex items-center justify-between text-xs text-[#8a948e] mb-2 gap-2 min-w-0">
            <span className="truncate font-mono">of 10 GB limit</span>
            <span className="font-semibold font-mono text-[#2fd697] shrink-0">{r2Percent}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#050806] border border-[#1c2820] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                r2Percent >= 95 ? 'bg-rose-500' : r2Percent > 80 ? 'bg-amber-400' : 'bg-[#2fd697]'
              }`}
              style={{ width: `${r2Percent}%` }}
            />
          </div>
        </div>

        {/* 2. Cloudinary Media Quota Card */}
        <div className="bg-[#101210] border border-[#1c2820] hover:border-[#1b563f] rounded-2xl p-4 sm:p-4.5 transition-colors min-w-0">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#8a948e]">Cloudinary Media</span>
            <div className="flex items-center gap-1 text-[10px] font-medium text-[#2fd697] bg-[#13261e] border border-[#1b563f] px-1.5 py-0.5 rounded-md">
              <Lock className="w-2.5 h-2.5" />
              <span>25 GB Lock</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-[#f5f5f5] mb-1">
            {formatBytes(clUsed)}
          </div>
          <div className="flex items-center justify-between text-xs text-[#8a948e] mb-2 gap-2 min-w-0">
            <span className="truncate font-mono">of 25 GB limit</span>
            <span className="font-semibold font-mono text-[#2fd697] shrink-0">{clPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#050806] border border-[#1c2820] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                clPercent >= 95 ? 'bg-rose-500' : clPercent > 80 ? 'bg-amber-400' : 'bg-[#2fd697]'
              }`}
              style={{ width: `${clPercent}%` }}
            />
          </div>
        </div>

        {/* 3. Total Files Card */}
        <div className="bg-[#101210] border border-[#1c2820] hover:border-[#1b563f] rounded-2xl p-4 sm:p-4.5 transition-colors min-w-0">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#8a948e]">Total Files</span>
            <div className="w-7 h-7 rounded-lg bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
              <Files className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-[#f5f5f5] mb-1">{activeFiles.length}</div>
          <p className="text-xs text-[#8a948e]">Active files stored</p>
        </div>

        {/* 4. Total Folders Card */}
        <div className="bg-[#101210] border border-[#1c2820] hover:border-[#1b563f] rounded-2xl p-4 sm:p-4.5 transition-colors min-w-0">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-[#8a948e]">Total Folders</span>
            <div className="w-7 h-7 rounded-lg bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
              <Folder className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-serif text-[#f5f5f5] mb-1">{activeFolders.length}</div>
          <p className="text-xs text-[#8a948e]">Organized directories</p>
        </div>
      </div>

      {/* Storage Category Breakdown */}
      <div className="bg-[#101210] border border-[#1c2820] rounded-2xl p-4 sm:p-6 w-full max-w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#f5f5f5]">Storage Breakdown</h3>
            <p className="text-xs text-[#8a948e]">Media on Cloudinary CDN • Documents on Cloudflare R2</p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#2fd697] bg-[#13261e] border border-[#1b563f] px-2.5 py-1 rounded-full shrink-0">
            {formatBytes(storageUsage.usedBytes)} / {formatBytes(storageUsage.quotaBytes)}
          </span>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="w-full h-2.5 bg-[#050806] border border-[#1c2820] rounded-full overflow-hidden flex mb-4 p-0.5">
          {categories.map((cat) => {
            const size = categorySizes[cat.key] || 0;
            const pct = storageUsage.usedBytes > 0 ? (size / storageUsage.usedBytes) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={cat.key}
                style={{ width: `${pct}%` }}
                className={`${cat.color} h-full rounded-full transition-all duration-500`}
                title={`${cat.label}: ${formatBytes(size)}`}
              />
            );
          })}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 w-full max-w-full">
          {categories.map((cat) => {
            const size = categorySizes[cat.key] || 0;
            const Icon = cat.icon;
            return (
              <div
                key={cat.key}
                className="p-3 rounded-xl bg-[#090d0a] border border-[#1c2820] hover:border-[#1b563f] transition-all flex items-center gap-2.5 min-w-0"
              >
                <div className="w-7 h-7 rounded-lg bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[#8a948e] truncate">{cat.label}</p>
                  <p className="text-xs font-mono font-bold text-[#f5f5f5] truncate">{formatBytes(size)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Files Section */}
      <div className="w-full max-w-full min-w-0">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#f5f5f5]">Recent Files</h3>
            <span className="text-[11px] font-medium text-[#657069] bg-[#111613] border border-[#1f2923] px-2 py-0.5 rounded-full font-mono">
              {recentFiles.length}
            </span>
          </div>
          <Link
            to="/files"
            className="flex items-center gap-1 text-xs font-semibold text-[#2fd697] hover:underline transition-colors shrink-0"
          >
            <span>View all files</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentFiles.length === 0 ? (
          <div className="p-8 text-center bg-[#101210] border border-[#1c2820] rounded-2xl">
            <p className="text-sm text-[#a0a6a3]">No files uploaded yet. Start by uploading files above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 w-full max-w-full">
            {recentFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onPreview={context?.onPreviewFile}
                onRename={context?.onRenameFile}
                onMove={context?.onMoveFile}
                onShare={context?.onShareFile}
                onDelete={context?.onDeleteFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
