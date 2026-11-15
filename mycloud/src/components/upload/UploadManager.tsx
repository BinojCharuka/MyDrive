import React, { useState } from 'react';
import {
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  File,
} from 'lucide-react';
import { useUpload } from '../../context/UploadContext';
import { formatBytes } from '../../utils/format';

export const UploadManager: React.FC = () => {
  const {
    uploads,
    isManagerOpen,
    setIsManagerOpen,
    cancelUpload,
    retryUpload,
    clearCompletedUploads,
  } = useUpload();

  const [isMinimized, setIsMinimized] = useState(false);

  if (!isManagerOpen || uploads.length === 0) {
    return null;
  }

  const activeCount = uploads.filter(
    (u) => u.status === 'uploading' || u.status === 'pending'
  ).length;

  const completedCount = uploads.filter((u) => u.status === 'completed').length;
  const failedCount = uploads.filter((u) => u.status === 'failed').length;

  return (
    <div className="fixed bottom-24 lg:bottom-5 left-3 right-3 sm:left-auto sm:right-6 sm:w-[420px] bg-[#101210]/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-[#1c2820] overflow-hidden z-50 transition-all duration-300 animate-slide-up text-[#f5f5f5]">
      {/* Header */}
      <div className="bg-[#050806] px-4 py-3 flex items-center justify-between border-b border-[#1c2820]">
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#2fd697]" />
          ) : failedCount > 0 ? (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#2fd697]" />
          )}
          <span className="text-sm font-semibold text-[#f5f5f5]">
            {activeCount > 0
              ? `Uploading ${activeCount} item${activeCount > 1 ? 's' : ''}`
              : `${completedCount} upload${completedCount > 1 ? 's' : ''} completed`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {completedCount > 0 && activeCount === 0 && (
            <button
              onClick={clearCompletedUploads}
              className="text-xs text-[#a0a6a3] hover:text-[#2fd697] px-2 py-1 rounded hover:bg-[#13261e] transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-[#a0a6a3] hover:text-[#f5f5f5] rounded hover:bg-[#13261e] transition-colors"
            aria-label={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsManagerOpen(false)}
            className="p-1 text-[#a0a6a3] hover:text-[#f5f5f5] rounded hover:bg-[#13261e] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body List (collapsible) */}
      {!isMinimized && (
        <div className="max-h-72 overflow-y-auto divide-y divide-[#1c2820] p-2">
          {uploads.map((item) => {
            const isUploading = item.status === 'uploading';
            const isCompleted = item.status === 'completed';
            const isFailed = item.status === 'failed';
            const isCancelled = item.status === 'cancelled';

            return (
              <div key={item.id} className="p-2.5 rounded-xl hover:bg-[#13261e]/40 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#13261e] border border-[#1b563f] text-[#2fd697] flex items-center justify-center shrink-0">
                      <File className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#f5f5f5] truncate" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-[10px] text-[#a0a6a3] flex items-center gap-1.5 flex-wrap">
                        <span>{formatBytes(item.size)}</span>
                        {item.storageProvider === 'cloudinary' ? (
                          <span className="text-[9px] font-semibold text-[#2fd697] bg-[#13261e] px-1.5 py-0.5 rounded border border-[#1b563f]">
                            Cloudinary
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-[#a0a6a3] bg-[#2b2e2d] px-1.5 py-0.5 rounded border border-white/10">
                            Cloudflare R2
                          </span>
                        )}
                        {isUploading && item.speed > 0 && (
                          <span className="font-mono text-[#2fd697]">
                            • {formatBytes(item.speed)}/s
                            {item.remainingSeconds > 0 && ` • ${item.remainingSeconds}s left`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions / Status Icon */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isUploading && (
                      <button
                        onClick={() => cancelUpload(item.id)}
                        className="p-1 text-[#a0a6a3] hover:text-rose-400 rounded hover:bg-rose-950/30 transition-colors"
                        title="Cancel upload"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(isFailed || isCancelled) && (
                      <button
                        onClick={() => retryUpload(item.id)}
                        className="p-1 text-[#2fd697] hover:text-white rounded hover:bg-[#13261e] transition-colors"
                        title="Retry upload"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-[#2fd697]" />
                    )}
                    {isFailed && (
                      <span title={item.error}>
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {(isUploading || item.status === 'pending') && (
                  <div className="w-full h-1.5 bg-[#050806] border border-[#1c2820] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2fd697] rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {isFailed && (
                  <p className="text-[10px] text-rose-400 mt-1 truncate">{item.error || 'Failed'}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UploadManager;
