import React from 'react';
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useStorage } from '../../context/StorageContext';
import { SortField, SortOrder, ViewMode, FileTypeFilter } from '../../types';

interface ToolbarProps {
  totalItems: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({ totalItems }) => {
  const {
    viewMode,
    setViewMode,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    fileTypeFilter,
    setFileTypeFilter,
  } = useStorage();

  const [sortOpen, setSortOpen] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);

  const sortOptions: { label: string; field: SortField }[] = [
    { label: 'Last Modified', field: 'updated_at' },
    { label: 'Name', field: 'name' },
    { label: 'File Size', field: 'size' },
    { label: 'Date Created', field: 'created_at' },
  ];

  const filterOptions: { label: string; value: FileTypeFilter }[] = [
    { label: 'All Files', value: 'all' },
    { label: 'Images', value: 'image' },
    { label: 'Videos', value: 'video' },
    { label: 'Audio', value: 'audio' },
    { label: 'Documents', value: 'document' },
    { label: 'Spreadsheets', value: 'spreadsheet' },
    { label: 'Archives', value: 'archive' },
  ];

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-[#1c2820] mb-4 w-full max-w-full text-[#f5f5f5]">
      <div className="text-xs font-medium text-[#a0a6a3] shrink-0 font-mono">
        {totalItems} item{totalItems === 1 ? '' : 's'}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setFilterOpen(!filterOpen);
              setSortOpen(false);
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-[#101210] hover:bg-[#13261e] border border-[#1c2820] hover:border-[#1b563f] rounded-full text-xs font-semibold text-[#f5f5f5] hover:text-[#2fd697] shadow-2xs transition-all active:scale-95"
          >
            <Filter className="w-3.5 h-3.5 text-[#2fd697] shrink-0" />
            <span className="capitalize">{fileTypeFilter === 'all' ? 'Filter' : fileTypeFilter}</span>
            <ChevronDown className="w-3 h-3 text-[#a0a6a3] shrink-0" />
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#101210]/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-[#1c2820] py-1.5 z-30 animate-slide-up ring-1 ring-white/5 text-[#f5f5f5]">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFileTypeFilter(opt.value);
                    setFilterOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-[#a0a6a3] hover:text-[#2fd697] hover:bg-[#13261e] transition-colors text-left"
                >
                  <span className={fileTypeFilter === opt.value ? 'font-semibold text-[#2fd697]' : ''}>{opt.label}</span>
                  {fileTypeFilter === opt.value && <Check className="w-3.5 h-3.5 text-[#2fd697]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setSortOpen(!sortOpen);
              setFilterOpen(false);
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-[#101210] hover:bg-[#13261e] border border-[#1c2820] hover:border-[#1b563f] rounded-full text-xs font-semibold text-[#f5f5f5] hover:text-[#2fd697] shadow-2xs transition-all active:scale-95"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#2fd697] shrink-0" />
            <span>Sort</span>
            <ChevronDown className="w-3 h-3 text-[#a0a6a3] shrink-0" />
          </button>

          {sortOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#101210]/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-[#1c2820] py-1.5 z-30 animate-slide-up ring-1 ring-white/5 text-[#f5f5f5]">
              <div className="px-4 py-1 text-[10px] font-bold text-[#a0a6a3] uppercase tracking-wider font-mono">
                Sort By
              </div>
              {sortOptions.map((opt) => (
                <button
                  key={opt.field}
                  onClick={() => {
                    setSortField(opt.field);
                    setSortOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs text-[#a0a6a3] hover:text-[#2fd697] hover:bg-[#13261e] transition-colors text-left"
                >
                  <span className={sortField === opt.field ? 'font-semibold text-[#2fd697]' : ''}>{opt.label}</span>
                  {sortField === opt.field && <Check className="w-3.5 h-3.5 text-[#2fd697]" />}
                </button>
              ))}
              <div className="my-1.5 border-t border-[#1c2820]" />
              <div className="px-4 py-1 text-[10px] font-bold text-[#a0a6a3] uppercase tracking-wider font-mono">
                Direction
              </div>
              <button
                onClick={() => {
                  setSortOrder('asc');
                  setSortOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-[#a0a6a3] hover:text-[#2fd697] hover:bg-[#13261e] transition-colors text-left"
              >
                <span className={sortOrder === 'asc' ? 'font-semibold text-[#2fd697]' : ''}>Ascending (A-Z)</span>
                {sortOrder === 'asc' && <Check className="w-3.5 h-3.5 text-[#2fd697]" />}
              </button>
              <button
                onClick={() => {
                  setSortOrder('desc');
                  setSortOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-[#a0a6a3] hover:text-[#2fd697] hover:bg-[#13261e] transition-colors text-left"
              >
                <span className={sortOrder === 'desc' ? 'font-semibold text-[#2fd697]' : ''}>Descending (Recent)</span>
                {sortOrder === 'desc' && <Check className="w-3.5 h-3.5 text-[#2fd697]" />}
              </button>
            </div>
          )}
        </div>

        {/* View Mode Toggle (Grid vs List) */}
        <div className="flex items-center bg-[#101210] p-0.5 rounded-full border border-[#1c2820] shadow-2xs">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-full text-xs transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#13261e] border border-[#1b563f] text-[#2fd697] shadow-2xs'
                : 'text-[#a0a6a3] hover:text-[#f5f5f5]'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-full text-xs transition-colors ${
              viewMode === 'list'
                ? 'bg-[#13261e] border border-[#1b563f] text-[#2fd697] shadow-2xs'
                : 'text-[#a0a6a3] hover:text-[#f5f5f5]'
            }`}
            title="List view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;

