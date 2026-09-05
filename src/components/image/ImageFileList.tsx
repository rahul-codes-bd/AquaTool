import React from 'react';
import { Trash2, FileText, CheckCircle2, AlertTriangle, Loader2, Sparkles, X } from 'lucide-react';
import { ImageFileItem } from '../../types/image';

interface ImageFileListProps {
  items: ImageFileItem[];
  selectedIndex: number;
  onSelectItem: (index: number) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export const ImageFileList: React.FC<ImageFileListProps> = ({
  items,
  selectedIndex,
  onSelectItem,
  onRemoveItem,
  onClearAll,
}) => {
  if (items.length === 0) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-semibold">
        <div className="flex items-center gap-2 text-slate-300">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Image Queue ({items.length})</span>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 text-[11px]"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear all</span>
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {items.map((item, idx) => {
          const isSelected = selectedIndex === idx;

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(idx)}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/8 hover:border-white/20'
              }`}
            >
              {/* Thumbnail */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-xs font-medium text-white truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{formatBytes(item.size)}</span>
                    {item.dimensions && (
                      <>
                        <span>•</span>
                        <span>
                          {item.dimensions.width}×{item.dimensions.height}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 shrink-0">
                {item.status === 'processing' && (
                  <span className="flex items-center gap-1 text-[11px] text-cyan-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{item.progress}%</span>
                  </span>
                )}
                {item.status === 'completed' && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </span>
                )}
                {item.status === 'error' && (
                  <span className="flex items-center gap-1 text-[11px] text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Error</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="w-7 h-7 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-300 flex items-center justify-center transition-colors"
                  aria-label={`Remove ${item.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
