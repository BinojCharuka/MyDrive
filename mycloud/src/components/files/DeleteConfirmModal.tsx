import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  isPermanent?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isPermanent = false,
}) => {
  const [submitting, setSubmitting] = React.useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050806]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#101210] rounded-2xl shadow-2xl border border-[#1c2820] overflow-hidden animate-slide-up text-[#f5f5f5]">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isPermanent ? 'bg-rose-950/50 border border-rose-800 text-rose-400' : 'bg-[#13261e] border border-[#1b563f] text-[#2fd697]'
              }`}
            >
              {isPermanent ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif text-lg font-normal text-[#f5f5f5]">{title}</h3>
              <p className="text-xs text-[#a0a6a3]">
                {isPermanent ? 'This action cannot be undone.' : 'Item will be moved to Trash.'}
              </p>
            </div>
          </div>

          <p className="text-sm text-[#a0a6a3] mb-6 leading-relaxed">{message}</p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-[#a0a6a3] hover:text-[#f5f5f5] hover:bg-[#13261e] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className={`px-5 py-2 text-sm font-semibold rounded-xl shadow-lg transition-all ${
                isPermanent
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-[#2fd697] hover:bg-[#28c287] text-[#050806]'
              } disabled:opacity-50`}
            >
              {submitting ? 'Processing...' : isPermanent ? 'Delete Forever' : 'Move to Trash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
