import React, { useState } from 'react';
import { ChevronRight, Home, Folder, FolderInput } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';
import toast from 'react-hot-toast';

export const Breadcrumbs: React.FC = () => {
  const { breadcrumbs, navigateToFolder, moveFile, moveFolder } = useStorage();
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, crumbId: string | null, isLast: boolean) => {
    if (isLast) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== (crumbId ?? 'root')) {
      setDragOverId(crumbId ?? 'root');
    }
  };

  const handleDragLeave = (e: React.DragEvent, crumbId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverId === (crumbId ?? 'root')) {
      setDragOverId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null, targetName: string, isLast: boolean) => {
    if (isLast) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const item = JSON.parse(dataStr);
        if (item.type === 'file') {
          await moveFile(item.id, targetFolderId);
          toast.success(`Moved "${item.name || 'file'}" to "${targetName}"`);
        } else if (item.type === 'folder' && item.id !== targetFolderId) {
          await moveFolder(item.id, targetFolderId);
          toast.success(`Moved "${item.name || 'folder'}" to "${targetName}"`);
        }
      }
    } catch (err) {
      console.warn('Breadcrumb drop error:', err);
      toast.error('Failed to move item');
    }
  };

  return (
    <nav className="flex items-center gap-1.5 text-sm text-[#a0a6a3] overflow-x-auto py-1.5 scrollbar-none w-full max-w-full">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        const isRoot = idx === 0;
        const crumbKey = crumb.id ?? 'root';
        const isHovered = dragOverId === crumbKey;

        return (
          <React.Fragment key={crumbKey}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#55635b] shrink-0" />}
            <button
              onClick={() => navigateToFolder(crumb.id, crumb.name)}
              onDragOver={(e) => handleDragOver(e, crumb.id, isLast)}
              onDragLeave={(e) => handleDragLeave(e, crumb.id)}
              onDrop={(e) => handleDrop(e, crumb.id, crumb.name, isLast)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all whitespace-nowrap ${
                isLast
                  ? 'text-[#2fd697] bg-[#13261e] border border-[#1b563f] font-semibold cursor-default'
                  : isHovered
                  ? 'text-[#2fd697] bg-[#14231b] ring-2 ring-[#2fd697]/50 border border-[#2fd697] scale-105 shadow-md shadow-[#2fd697]/20 font-semibold'
                  : 'text-[#909893] hover:text-[#f5f5f5] hover:bg-[#111613] font-medium'
              }`}
            >
              {isHovered ? (
                <FolderInput className="w-3.5 h-3.5 text-[#2fd697] animate-bounce" />
              ) : isRoot ? (
                <Home className="w-3.5 h-3.5 text-[#2fd697]" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-[#2fd697]/70" />
              )}
              <span>{crumb.name}</span>
              {isHovered && <span className="text-[10px] text-[#2fd697] opacity-80 pl-0.5">(Drop here)</span>}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;

