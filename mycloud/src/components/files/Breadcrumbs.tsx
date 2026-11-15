import React from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';

export const Breadcrumbs: React.FC = () => {
  const { breadcrumbs, navigateToFolder } = useStorage();

  return (
    <nav className="flex items-center gap-1.5 text-sm text-[#a0a6a3] overflow-x-auto py-1.5 scrollbar-none w-full max-w-full">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        const isRoot = idx === 0;

        return (
          <React.Fragment key={crumb.id || 'root'}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#55635b] shrink-0" />}
            <button
              onClick={() => navigateToFolder(crumb.id, crumb.name)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors whitespace-nowrap ${
                isLast
                  ? 'text-[#2fd697] bg-[#13261e] border border-[#1b563f] font-semibold cursor-default'
                  : 'text-[#909893] hover:text-[#f5f5f5] hover:bg-[#111613] font-medium'
              }`}
            >
              {isRoot ? (
                <Home className="w-3.5 h-3.5 text-[#2fd697]" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-[#2fd697]/70" />
              )}
              <span>{crumb.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;

