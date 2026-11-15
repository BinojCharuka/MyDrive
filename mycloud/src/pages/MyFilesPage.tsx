import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useStorage } from '../context/StorageContext';
import Breadcrumbs from '../components/files/Breadcrumbs';
import Toolbar from '../components/files/Toolbar';
import FileGrid from '../components/files/FileGrid';
import FileList from '../components/files/FileList';
import { getFileTypeCategory } from '../utils/format';

export const MyFilesPage: React.FC = () => {
  const {
    folders,
    files,
    viewMode,
    sortField,
    sortOrder,
    fileTypeFilter,
    searchQuery,
  } = useStorage();

  const context = useOutletContext<any>();

  // 1. Search Filter
  let filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  let filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. File Type Filter
  if (fileTypeFilter !== 'all') {
    filteredFiles = filteredFiles.filter((file) => {
      const cat = getFileTypeCategory(file.mime_type, file.name);
      return cat === fileTypeFilter;
    });
    // In category filtered mode, don't show folders unless 'all'
    filteredFolders = [];
  }

  // 3. Sorting
  filteredFolders.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortField === 'updated_at') cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    else if (sortField === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  filteredFiles.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortField === 'size') cmp = a.size - b.size;
    else if (sortField === 'updated_at') cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    else if (sortField === 'created_at') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const totalItems = filteredFolders.length + filteredFiles.length;

  return (
    <div className="space-y-4 animate-fade-in w-full max-w-full min-w-0">
      {/* Breadcrumb Path */}
      <Breadcrumbs />

      {/* Action Toolbar */}
      <Toolbar totalItems={totalItems} />

      {/* Content: Grid or List */}
      {viewMode === 'grid' ? (
        <FileGrid
          folders={filteredFolders}
          files={filteredFiles}
          onPreviewFile={context?.onPreviewFile}
          onRenameFolder={context?.onRenameFolder}
          onRenameFile={context?.onRenameFile}
          onMoveFolder={context?.onMoveFolder}
          onMoveFile={context?.onMoveFile}
          onShareFolder={context?.onShareFolder}
          onShareFile={context?.onShareFile}
          onDeleteFolder={context?.onDeleteFolder}
          onDeleteFile={context?.onDeleteFile}
        />
      ) : (
        <FileList
          folders={filteredFolders}
          files={filteredFiles}
          onPreviewFile={context?.onPreviewFile}
          onRenameFolder={context?.onRenameFolder}
          onRenameFile={context?.onRenameFile}
          onMoveFolder={context?.onMoveFolder}
          onMoveFile={context?.onMoveFile}
          onShareFolder={context?.onShareFolder}
          onShareFile={context?.onShareFile}
          onDeleteFolder={context?.onDeleteFolder}
          onDeleteFile={context?.onDeleteFile}
        />
      )}
    </div>
  );
};

export default MyFilesPage;

