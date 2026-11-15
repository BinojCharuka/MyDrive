import React, { useState, useEffect } from 'react';
import {
  User,
  HardDrive,
  Cloud,
  Lock,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Smartphone,
  Download,
  Apple,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../context/StorageContext';
import { usePwa } from '../context/PwaContext';
import { formatBytes } from '../utils/format';
import api from '../lib/api';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { storageUsage } = useStorage();
  const { promptInstall, isStandalone, isIOS, isAndroid } = usePwa();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const checkBackendHealth = async () => {
    setCheckingHealth(true);
    try {
      const data = await api.get<any>('/api/health');
      setHealthStatus(data);
    } catch (err: any) {
      setHealthStatus({
        status: 'error',
        message: 'Backend server not responding or offline.',
      });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await updateProfile(fullName);
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const r2Used = storageUsage.r2?.usedBytes ?? storageUsage.usedBytes;
  const r2Quota = storageUsage.r2?.quotaBytes ?? 10737418240;
  const r2Percent = storageUsage.r2?.percent ?? Math.min(100, Math.round((r2Used / r2Quota) * 100));
  const r2Remaining = Math.max(0, r2Quota - r2Used);

  const clUsed = storageUsage.cloudinary?.usedBytes ?? 0;
  const clQuota = storageUsage.cloudinary?.quotaBytes ?? 26843545600;
  const clPercent = storageUsage.cloudinary?.percent ?? Math.min(100, Math.round((clUsed / clQuota) * 100));
  const clRemaining = Math.max(0, clQuota - clUsed);

  const percentUsed = Math.min(
    100,
    Math.round((storageUsage.usedBytes / storageUsage.quotaBytes) * 100)
  );

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in w-full max-w-full min-w-0">
      <div>
        <h2 className="text-2xl font-serif font-normal text-[#f5f5f5]">Settings & Account</h2>
        <p className="text-xs text-[#a0a6a3]">Manage your profile, storage quota, and cloud integrations</p>
      </div>

      {/* Profile Section */}
      <div className="bg-[#101210] border border-[#1c2820] rounded-2xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1c2820]">
          <div className="w-10 h-10 rounded-2xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-normal text-[#f5f5f5]">Profile Information</h3>
            <p className="text-xs text-[#a0a6a3]">Update your account name and email details</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-[#a0a6a3] mb-1.5">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || 'demo@mycloud.io'}
              className="w-full px-3.5 py-2.5 bg-[#050806] border border-[#1c2820] rounded-xl text-sm text-[#a0a6a3] cursor-not-allowed font-mono"
            />
            <p className="text-[11px] text-[#a0a6a3]/70 mt-1">Managed via Supabase Authentication</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a0a6a3] mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#050806] border border-[#1c2820] rounded-xl text-sm text-[#f5f5f5] focus:outline-none focus:border-[#2fd697] focus:ring-1 focus:ring-[#2fd697]/30 transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2fd697] hover:bg-[#28c287] text-[#050806] font-bold text-xs rounded-xl shadow-lg shadow-[#2fd697]/15 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Storage Quota Section */}
      <div className="bg-[#101210] border border-[#1c2820] rounded-2xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1c2820]">
          <div className="w-10 h-10 rounded-2xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-normal text-[#f5f5f5]">Storage Quotas & Free Tiers</h3>
            <p className="text-xs text-[#a0a6a3]">Cloudflare R2 (10 GB) and Cloudinary (25 GB) dual hard locks</p>
          </div>
        </div>

        <div className="space-y-6 max-w-3xl">
          {/* Dual Provider Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Cloudflare R2 Card */}
            <div className="p-5 rounded-2xl bg-[#050806] border border-[#1c2820] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#f5f5f5]">Cloudflare R2</h4>
                    <p className="text-[10px] text-[#a0a6a3]">Documents, Code, PDFs, Archives</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#2fd697] bg-[#13261e] border border-[#1b563f] px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" />
                  <span>10 GB Lock</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-[#101210] border border-[#1c2820] rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    r2Percent >= 95 ? 'bg-rose-500' : r2Percent > 80 ? 'bg-amber-400' : 'bg-[#2fd697]'
                  }`}
                  style={{ width: `${r2Percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#a0a6a3]">{formatBytes(r2Used)} / 10 GB</span>
                <span className="text-[#2fd697] font-semibold">{r2Percent}%</span>
              </div>

              <div className="pt-2 border-t border-[#1c2820] flex items-center justify-between text-[11px] text-[#a0a6a3]">
                <span>Remaining: <strong className="text-[#f5f5f5] font-mono">{formatBytes(r2Remaining)}</strong></span>
                <span>{storageUsage.r2?.fileCount ?? 0} files</span>
              </div>
            </div>

            {/* 2. Cloudinary Media Card */}
            <div className="p-5 rounded-2xl bg-[#050806] border border-[#1c2820] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#f5f5f5]">Cloudinary Media</h4>
                    <p className="text-[10px] text-[#a0a6a3]">Photos, Images & Videos (CDN)</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#2fd697] bg-[#13261e] border border-[#1b563f] px-2 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" />
                  <span>25 GB Lock</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-[#101210] border border-[#1c2820] rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    clPercent >= 95 ? 'bg-rose-500' : clPercent > 80 ? 'bg-amber-400' : 'bg-[#2fd697]'
                  }`}
                  style={{ width: `${clPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#a0a6a3]">{formatBytes(clUsed)} / 25 GB</span>
                <span className="text-[#2fd697] font-semibold">{clPercent}%</span>
              </div>

              <div className="pt-2 border-t border-[#1c2820] flex items-center justify-between text-[11px] text-[#a0a6a3]">
                <span>Remaining: <strong className="text-[#f5f5f5] font-mono">{formatBytes(clRemaining)}</strong></span>
                <span>{storageUsage.cloudinary?.fileCount ?? 0} files</span>
              </div>
            </div>
          </div>

          {/* Combined Total Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#050806] border border-[#1c2820]">
              <span className="text-[11px] font-medium text-[#a0a6a3]">Total Free Tier Pool</span>
              <p className="text-lg font-bold font-serif text-[#f5f5f5] mt-1">35 GB</p>
              <span className="text-[10px] text-[#2fd697] font-semibold flex items-center gap-1 mt-1">
                <Shield className="w-3 h-3 inline" /> 10 GB R2 + 25 GB Cloudinary
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#050806] border border-[#1c2820]">
              <span className="text-[11px] font-medium text-[#a0a6a3]">Total Used</span>
              <p className="text-lg font-bold font-serif text-[#f5f5f5] mt-1 font-mono">
                {formatBytes(r2Used + clUsed)}
              </p>
              <span className="text-[10px] text-[#a0a6a3] mt-1 block">
                {storageUsage.fileCount} active files, {storageUsage.folderCount} folders
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#050806] border border-[#1c2820]">
              <span className="text-[11px] font-medium text-[#a0a6a3]">Recycle Bin Policy</span>
              <p className="text-lg font-bold font-serif text-[#2fd697] mt-1">Instant Free</p>
              <span className="text-[10px] text-[#a0a6a3] mt-1 block">Trash excludes from active quota</span>
            </div>
          </div>

          {/* Free Tier Notice */}
          <div className="p-4 rounded-2xl bg-[#13261e]/40 border border-[#1b563f] text-xs text-[#a0a6a3] leading-relaxed flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#2fd697] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#f5f5f5] mb-0.5">Strict Hard Locks Active (0% Billing Risk)</p>
              <p>
                Storage is locked at <strong>10 GB</strong> for Cloudflare R2 and <strong>25 GB</strong> for Cloudinary. Uploads reaching either limit are rejected automatically by frontend and backend validation, ensuring you will never incur any subscription or overage charges.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Integrations & System Status */}
      <div className="bg-[#101210] border border-[#1c2820] rounded-2xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1c2820]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-normal text-[#f5f5f5]">Cloud Services Status</h3>
              <p className="text-xs text-[#a0a6a3]">Real-time connectivity to backend services</p>
            </div>
          </div>

          <button
            onClick={checkBackendHealth}
            disabled={checkingHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2fd697] hover:text-white bg-[#13261e] hover:bg-[#1b563f] border border-[#1b563f] rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
            <span>Check Status</span>
          </button>
        </div>

        <div className="space-y-3">
          {/* Supabase Status */}
          <div className="p-4 rounded-2xl border border-[#1c2820] bg-[#050806] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center font-bold text-xs font-mono">
                SB
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f5f5f5]">Supabase PostgreSQL & Auth</p>
                <p className="text-xs text-[#a0a6a3]">Database with Row Level Security & User Auth</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#13261e] text-[#2fd697] border border-[#1b563f]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{healthStatus?.integrations?.supabase || 'Connected'}</span>
            </span>
          </div>

          {/* Cloudflare R2 Status */}
          <div className="p-4 rounded-2xl border border-[#1c2820] bg-[#050806] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center font-bold text-xs font-mono">
                R2
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f5f5f5]">Cloudflare R2 Object Storage</p>
                <p className="text-xs text-[#a0a6a3]">Documents, PDFs, Spreadsheets, Archives & Code</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#13261e] text-[#2fd697] border border-[#1b563f]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{healthStatus?.integrations?.cloudflareR2 || 'Connected'}</span>
            </span>
          </div>

          {/* Cloudinary Status */}
          <div className="p-4 rounded-2xl border border-[#1c2820] bg-[#050806] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center font-bold text-xs font-mono">
                CL
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f5f5f5]">Cloudinary Media Cloud</p>
                <p className="text-xs text-[#a0a6a3]">Photos, Images & Videos with Global CDN Delivery</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                healthStatus?.integrations?.cloudinary === 'connected'
                  ? 'bg-[#13261e] text-[#2fd697] border border-[#1b563f]'
                  : 'bg-amber-950/40 text-amber-400 border border-amber-800'
              }`}
            >
              {healthStatus?.integrations?.cloudinary === 'connected' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span className="capitalize">{healthStatus?.integrations?.cloudinary || 'Connected'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Progressive Web App (PWA) Mobile & Desktop Installation */}
      <div className="bg-[#101210] border border-[#1c2820] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-[#1c2820]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#13261e] border border-[#1b563f] flex items-center justify-center text-[#2fd697] shadow-sm">
              <Smartphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f5f5f5] flex items-center gap-2">
                <span>App Installation (PWA)</span>
                {isStandalone && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#13261e] text-[#2fd697] border border-[#1b563f] font-mono">
                    Installed
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#a0a6a3]">
                Install MyCloud on iOS, Android, macOS, or Windows for a standalone app experience
              </p>
            </div>
          </div>

          <button
            onClick={promptInstall}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-[#2fd697] to-[#1eb57c] hover:from-[#28c287] hover:to-[#188f63] text-[#050806] rounded-xl shadow-md shadow-[#2fd697]/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isStandalone ? 'View App Details' : 'Install App'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#050806] border border-[#1c2820] flex items-center justify-between">
            <div>
              <p className="text-[#a0a6a3] text-[11px]">Installation Status</p>
              <p className="text-sm font-semibold text-[#f5f5f5]">
                {isStandalone ? 'Standalone App Mode' : 'Running in Web Browser'}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                isStandalone
                  ? 'bg-[#13261e] text-[#2fd697] border border-[#1b563f]'
                  : 'bg-[#1c2820] text-[#a0a6a3]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isStandalone ? 'Installed' : 'Web Version'}</span>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#050806] border border-[#1c2820] flex items-center justify-between">
            <div>
              <p className="text-[#a0a6a3] text-[11px]">Device Platform</p>
              <p className="text-sm font-semibold text-[#f5f5f5]">
                {isIOS ? 'Apple iOS (Safari A2HS)' : isAndroid ? 'Android OS (Chromium PWA)' : 'Desktop / Laptop Browser'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#13261e] text-[#2fd697] border border-[#1b563f] font-mono">
              Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
