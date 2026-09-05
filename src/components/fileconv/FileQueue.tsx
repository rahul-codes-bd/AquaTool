import React from 'react';
import { ConversionQueueItem } from '../../types/fileConv';
import { FileText, Trash2, CheckCircle2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { FileTypeDetector } from './FileTypeDetector';
import { ConversionProgress } from './ConversionProgress';
import { CancelConversionButton } from './CancelConversionButton';

interface FileQueueProps {
  items: ConversionQueueItem[];
  onRemoveItem: (id: string) => void;
  onCancelItem?: (id: string) => void;
  isProcessing?: boolean;
}

export const FileQueue: React.FC<FileQueueProps> = ({
  items,
  onRemoveItem,
  onCancelItem,
  isProcessing = false,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-400">
        <span>Conversion Queue ({items.length} files)</span>
        <span>Local Processing Queue</span>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2 transition-all hover:border-slate-700"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{item.file.name}</p>
                  <FileTypeDetector filename={item.file.name} mimeType={item.file.type} sizeBytes={item.file.size} />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.status === 'pending' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                    Pending
                  </span>
                )}
                {item.status === 'processing' && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                    {onCancelItem && <CancelConversionButton onCancel={() => onCancelItem(item.id)} />}
                  </div>
                )}
                {item.status === 'success' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                )}
                {item.status === 'error' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-300 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Error
                  </span>
                )}

                {item.status === 'success' && item.resultUrl && (
                  <a
                    href={item.resultUrl}
                    download={item.resultFilename || `converted.${item.targetFormat}`}
                    className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                    title="Download Converted File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}

                <button
                  type="button"
                  disabled={isProcessing && item.status === 'processing'}
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                  title="Remove from queue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {item.status === 'processing' && <ConversionProgress progress={item.progress} statusText="Transcoding locally..." />}

            {item.status === 'error' && item.error && (
              <p className="text-[11px] text-red-400 font-mono bg-red-950/30 p-2 rounded border border-red-900/50">
                {item.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
