import React, { useState } from 'react';
import { X, Share2, Shield, Copy, Check, Mail } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    id: string;
    name: string;
    type: 'file' | 'folder';
  } | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, target }) => {
  const { shareFile, shareFolder } = useStorage();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !target) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid user email address');
      return;
    }

    setSubmitting(true);
    try {
      if (target.type === 'folder') {
        await shareFolder(target.id, email, permission);
      } else {
        await shareFile(target.id, email, permission);
      }
      toast.success(`Shared with ${email} as ${permission}`);
      setEmail('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to share');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#050806]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#101210] rounded-2xl shadow-2xl border border-[#1c2820] overflow-hidden animate-slide-up text-[#f5f5f5]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1c2820] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-normal text-[#f5f5f5] leading-tight">Share "{target.name}"</h3>
              <p className="text-xs text-[#a0a6a3]">Collaborate with other registered users</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#a0a6a3] hover:text-[#f5f5f5] rounded-lg hover:bg-[#13261e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleShare} className="mb-6">
            <label className="block text-xs font-semibold text-[#a0a6a3] mb-2 font-mono">
              ADD PEOPLE BY EMAIL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#a0a6a3]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#050806] border border-[#1c2820] rounded-xl text-sm text-[#f5f5f5] placeholder-[#a0a6a3]/40 focus:outline-none focus:border-[#2fd697] focus:ring-1 focus:ring-[#2fd697]/30 transition-all"
                />
              </div>

              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'viewer' | 'editor')}
                className="px-3 py-2 bg-[#050806] border border-[#1c2820] rounded-xl text-xs font-medium text-[#f5f5f5] focus:outline-none focus:border-[#2fd697] cursor-pointer"
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="editor">Editor (Can edit & upload)</option>
              </select>

              <button
                type="submit"
                disabled={submitting || !email}
                className="px-4 py-2 bg-[#2fd697] hover:bg-[#28c287] text-[#050806] text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </form>

          {/* General Access / Link section */}
          <div className="border border-[#1c2820] rounded-2xl p-3.5 bg-[#050806] mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#13261e] border border-[#1b563f] flex items-center justify-center text-[#2fd697]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#f5f5f5]">Restricted Access</p>
                <p className="text-[11px] text-[#a0a6a3]">Only invited users can access this link</p>
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#13261e] border border-[#1b563f] hover:bg-[#1b563f] text-[#2fd697] text-xs font-medium rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#2fd697]" /> : <Copy className="w-3.5 h-3.5 text-[#2fd697]" />}
              <span>{copied ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-[#a0a6a3] hover:text-[#f5f5f5] hover:bg-[#13261e] rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
