import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { useUpload } from '../../context/UploadContext';

export const DropZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { uploadFiles, uploadFolderStructure } = useUpload();
  const dragCounterRef = useRef(0);

  const handleDismiss = () => {
    dragCounterRef.current = 0;
    setIsDragOver(false);
  };

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragOver(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      if (!e.dataTransfer) return;

      const items = e.dataTransfer.items;
      if (!items) return;

      const fileEntries: { file: File; relativePath: string }[] = [];
      const standardFiles: File[] = [];

      // Recursive folder traversal using webkitGetAsEntry
      const scanEntry = async (entry: any, currentPath: string = '') => {
        if (entry.isFile) {
          const file: File = await new Promise((resolve) => entry.file(resolve));
          const relPath = currentPath ? `${currentPath}/${file.name}` : file.name;
          fileEntries.push({ file, relativePath: relPath });
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const readEntries = async () => {
            const entries: any[] = await new Promise((resolve) =>
              dirReader.readEntries(resolve)
            );
            if (entries.length > 0) {
              const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
              for (const child of entries) {
                await scanEntry(child, newPath);
              }
              await readEntries();
            }
          };
          await readEntries();
        }
      };

      let hasDirectory = false;
      const scanPromises = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
          if (entry && entry.isDirectory) {
            hasDirectory = true;
            scanPromises.push(scanEntry(entry));
          } else {
            const file = item.getAsFile();
            if (file) standardFiles.push(file);
          }
        }
      }

      if (hasDirectory) {
        await Promise.all(scanPromises);
        if (standardFiles.length > 0) {
          standardFiles.forEach((f) => fileEntries.push({ file: f, relativePath: f.name }));
        }
        uploadFolderStructure(fileEntries);
      } else {
        if (standardFiles.length > 0) {
          uploadFiles(standardFiles);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [uploadFiles, uploadFolderStructure]);

  return (
    <div className="relative min-h-screen">
      {children}

      {/* Drag Over Overlay in Deep Obsidian & Mint Accent */}
      {isDragOver && (
        <div
          onClick={handleDismiss}
          className="fixed inset-0 bg-[#050806]/85 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-[#f5f5f5] animate-fade-in cursor-pointer"
        >
          {/* Top Right Close Floating Pill Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="absolute top-5 right-5 sm:top-8 sm:right-8 p-3 rounded-full bg-[#13261e] hover:bg-[#1b563f] active:scale-95 text-[#2fd697] shadow-xl transition-all border border-[#1b563f] flex items-center gap-2 group z-10"
            title="Close / Cancel (Esc)"
            aria-label="Close drop zone"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            <span className="text-xs font-semibold hidden sm:inline pr-1">Close (Esc)</span>
          </button>

          {/* Central Modal Card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full p-8 rounded-2xl border-2 border-dashed border-[#1b563f] bg-[#101210]/95 backdrop-blur-xl flex flex-col items-center text-center shadow-2xl cursor-default"
          >
            {/* Card inner top-right close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full text-[#a0a6a3] hover:text-[#f5f5f5] hover:bg-[#13261e] active:scale-90 transition-all"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-20 h-20 rounded-2xl bg-[#13261e] border border-[#1b563f] flex items-center justify-center mb-4 text-[#2fd697] animate-bounce shadow-inner">
              <UploadCloud className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-serif font-normal text-[#f5f5f5] mb-2">Drop files or folders here</h2>
            <p className="text-sm text-[#a0a6a3] max-w-sm mb-6 leading-relaxed">
              Photos & videos route to Cloudinary; documents and files route to Cloudflare R2 automatically.
            </p>

            {/* Prominent dismiss / cancel button */}
            <button
              onClick={handleDismiss}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#13261e] hover:bg-[#1b563f] active:scale-95 text-[#2fd697] font-semibold text-xs border border-[#1b563f] shadow-lg transition-all"
            >
              <X className="w-4 h-4" />
              <span>Cancel / Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropZone;
