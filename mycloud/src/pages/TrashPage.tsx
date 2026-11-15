import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStorage } from '../context/StorageContext';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Folder,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File,
} from 'lucide-react';
import { formatBytes, formatDate, getFileTypeCategory } from '../utils/format';
import toast from 'react-hot-toast';

export const TrashPage: React.FC = () => {
  const { trashFiles, trashFolders, restoreFile, restoreFolder, emptyTrash } = useStorage();
  const context = useOutletContext<any>();
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const total = trashFiles.length + trashFolders.length;

  const handleEmptyTrash = async () => {
    setClearing(true);
    try {
      await emptyTrash();
      toast.success('Trash emptied permanently');
      setEmptyTrashConfirm(false);
    } catch (err: any) {
      toast.error('Failed to empty trash');
    } finally {
      setClearing(false);
    }
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    const category = getFileTypeCategory(mimeType, filename);
    switch (category) {
      case 'image':
        return <FileImage className="w-4 h-4 text-[#2fd697]" />;
      case 'video':
        return <FileVideo className="w-4 h-4 text-[#2fd697]" />;
      case 'audio':
        return <FileAudio className="w-4 h-4 text-[#2fd697]" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-[#2fd697]" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-4 h-4 text-[#2fd697]" />;
      case 'archive':
        return <FileArchive className="w-4 h-4 text-[#2fd697]" />;
      default:
        return <File className="w-4 h-4 text-[#2fd697]" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1c2820]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-normal text-[#f5f5f5]">Trash</h2>
            <p className="text-xs text-[#a0a6a3]">Deleted files and folders</p>
          </div>
        </div>

        {total > 0 && (
          <button
            onClick={() => setEmptyTrashConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-xl border border-rose-800/60 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash ({total})</span>
          </button>
        )}
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-2xl bg-[#13261e]/40 border border-[#1b563f] flex items-start gap-3 text-xs text-[#a0a6a3]">
        <AlertTriangle className="w-4 h-4 text-[#2fd697] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#f5f5f5]">Recycle Bin:</span> You can restore items at any time to regain access, or click "Empty Trash" to permanently purge them from Cloudflare R2 / Cloudinary storage.
        </div>
      </div>

      {/* Table list */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-[#1c2820] bg-[#101210]/60 my-6">
          <div className="w-16 h-16 rounded-2xl bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-medium font-serif text-[#f5f5f5] mb-1">Trash is empty</h3>
          <p className="text-xs text-[#a0a6a3] max-w-sm">
            Deleted files and folders will appear here before being permanently removed.
          </p>
        </div>
      ) : (
        <div className="bg-[#101210] rounded-2xl border border-[#1c2820] overflow-hidden shadow-lg overflow-x-auto w-full max-w-full">
          <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-full">
            <thead>
              <tr className="border-b border-[#1c2820] bg-[#050806] text-[11px] font-semibold text-[#a0a6a3] uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4 hidden md:table-cell">Deleted At</th>
                <th className="py-3 px-4 hidden sm:table-cell">File Size</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c2820] text-sm">
              {/* Folders in Trash */}
              {trashFolders.map((folder) => (
                <tr key={folder.id} className="hover:bg-[#13261e]/30 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-[#f5f5f5] truncate">{folder.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#a0a6a3] hidden md:table-cell">
                    {formatDate(folder.deleted_at)}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#a0a6a3] hidden sm:table-cell">—</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={async () => {
                          await restoreFolder(folder.id);
                          toast.success(`Restored "${folder.name}"`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13261e] hover:bg-[#1b563f] border border-[#1b563f] text-[#2fd697] text-xs font-semibold rounded-lg transition-colors"
                        title="Restore folder"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => context?.onPermanentDeleteFolder(folder)}
                        className="p-1.5 text-[#a0a6a3] hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                        title="Delete forever"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Files in Trash */}
              {trashFiles.map((file) => (
                <tr key={file.id} className="hover:bg-[#13261e]/30 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#13261e] border border-[#1b563f] flex items-center justify-center shrink-0">
                        {getFileIcon(file.mime_type, file.name)}
                      </div>
                      <span className="font-medium text-[#f5f5f5] truncate">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#a0a6a3] hidden md:table-cell">
                    {formatDate(file.deleted_at)}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-[#a0a6a3] hidden sm:table-cell">
                    {formatBytes(file.size)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={async () => {
                          await restoreFile(file.id);
                          toast.success(`Restored "${file.name}"`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13261e] hover:bg-[#1b563f] border border-[#1b563f] text-[#2fd697] text-xs font-semibold rounded-lg transition-colors"
                        title="Restore file"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => context?.onPermanentDeleteFile(file)}
                        className="p-1.5 text-[#a0a6a3] hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                        title="Delete forever"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty Trash Confirmation Dialog */}
      {emptyTrashConfirm && (
        <div className="fixed inset-0 bg-[#050806]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#101210] rounded-2xl shadow-2xl border border-[#1c2820] p-6 animate-slide-up text-[#f5f5f5]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-normal text-[#f5f5f5]">Empty Trash Permanently?</h3>
                <p className="text-xs text-[#a0a6a3]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-[#a0a6a3] mb-6 leading-relaxed">
              All {total} items in your trash will be permanently purged from Cloudflare R2 / Cloudinary storage and cannot be recovered.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEmptyTrashConfirm(false)}
                disabled={clearing}
                className="px-4 py-2 text-sm font-medium text-[#a0a6a3] hover:text-[#f5f5f5] hover:bg-[#13261e] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={clearing}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg transition-colors disabled:opacity-50"
              >
                {clearing ? 'Emptying...' : 'Empty Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashPage;
