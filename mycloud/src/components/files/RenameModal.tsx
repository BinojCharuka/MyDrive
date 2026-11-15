import React, { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';
import { validateFileName } from '../../utils/validation';
import toast from 'react-hot-toast';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    id: string;
    name: string;
    type: 'file' | 'folder';
  } | null;
}

export const RenameModal: React.FC<RenameModalProps> = ({ isOpen, onClose, target }) => {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { renameFile, renameFolder } = useStorage();

  useEffect(() => {
    if (target) {
      setName(target.name);
    }
  }, [target]);

  if (!isOpen || !target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateFileName(name);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid name');
      return;
    }

    setSubmitting(true);
    try {
      if (target.type === 'folder') {
        await renameFolder(target.id, name);
      } else {
        await renameFile(target.id, name);
      }
      toast.success(`Renamed to "${name}"`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to rename');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050806]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#101210] rounded-2xl shadow-2xl border border-[#1c2820] overflow-hidden animate-slide-up text-[#f5f5f5]">
        <div className="px-6 py-4 border-b border-[#1c2820] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg font-normal text-[#f5f5f5]">
              Rename {target.type === 'folder' ? 'Folder' : 'File'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#a0a6a3] hover:text-[#f5f5f5] rounded-lg hover:bg-[#13261e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-xs font-semibold text-[#a0a6a3] mb-2 font-mono">NEW NAME</label>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#050806] border border-[#1c2820] rounded-xl text-sm text-[#f5f5f5] focus:outline-none focus:border-[#2fd697] focus:ring-1 focus:ring-[#2fd697]/30 transition-all mb-6"
          />

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#a0a6a3] hover:text-[#f5f5f5] hover:bg-[#13261e] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || name === target.name}
              className="px-5 py-2 text-sm font-semibold text-[#050806] bg-[#2fd697] hover:bg-[#28c287] rounded-xl shadow-lg shadow-[#2fd697]/15 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;
