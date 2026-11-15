import React, { useState } from 'react';
import { X, FolderInput, Folder, Check } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';
import toast from 'react-hot-toast';

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    id: string;
    name: string;
    type: 'file' | 'folder';
  } | null;
}

export const MoveModal: React.FC<MoveModalProps> = ({ isOpen, onClose, target }) => {
  const { allFolders, moveFile, moveFolder } = useStorage();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !target) return null;

  // Filter out the folder itself and its descendants when moving a folder to prevent circular loops
  const availableFolders = allFolders.filter((f) => {
    if (f.is_deleted) return false;
    if (target.type === 'folder' && f.id === target.id) return false;
    return true;
  });

  const handleMove = async () => {
    setSubmitting(true);
    try {
      if (target.type === 'folder') {
        await moveFolder(target.id, selectedFolderId);
      } else {
        await moveFile(target.id, selectedFolderId);
      }
      toast.success(`Moved "${target.name}"`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to move');
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
              <FolderInput className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg font-normal text-[#f5f5f5]">Move "{target.name}"</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#a0a6a3] hover:text-[#f5f5f5] rounded-lg hover:bg-[#13261e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs font-semibold text-[#a0a6a3] mb-3 font-mono">SELECT DESTINATION FOLDER:</p>

          <div className="max-h-60 overflow-y-auto border border-[#1c2820] rounded-xl divide-y divide-[#1c2820] mb-6 bg-[#050806]">
            {/* Root Option */}
            <div
              onClick={() => setSelectedFolderId(null)}
              className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                selectedFolderId === null ? 'bg-[#13261e] text-[#2fd697] font-semibold' : 'hover:bg-[#101210] text-[#a0a6a3]'
              }`}
            >
              <div className="flex items-center gap-2.5 text-sm">
                <Folder className="w-4 h-4 text-[#2fd697]" />
                <span className="text-[#f5f5f5]">My Files (Root)</span>
              </div>
              {selectedFolderId === null && <Check className="w-4 h-4 text-[#2fd697]" />}
            </div>

            {/* Folder list */}
            {availableFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                  selectedFolderId === folder.id ? 'bg-[#13261e] text-[#2fd697] font-semibold' : 'hover:bg-[#101210] text-[#a0a6a3]'
                }`}
              >
                <div className="flex items-center gap-2.5 text-sm truncate pr-2">
                  <Folder className="w-4 h-4 text-[#a0a6a3]" />
                  <span className="truncate text-[#f5f5f5]">{folder.name}</span>
                </div>
                {selectedFolderId === folder.id && <Check className="w-4 h-4 text-[#2fd697]" />}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#a0a6a3] hover:text-[#f5f5f5] hover:bg-[#13261e] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-[#050806] bg-[#2fd697] hover:bg-[#28c287] rounded-xl shadow-lg shadow-[#2fd697]/15 transition-all disabled:opacity-50"
            >
              {submitting ? 'Moving...' : 'Move here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveModal;
