import React, { useRef, useState, useCallback, useEffect } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { t } from '../../i18n';
import { FileHandlerService } from '../../services/fileHandler';

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  minSizeBytes?: number;
  allowEmpty?: boolean;
  onFilesSelected: (files: File[]) => void;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
  title?: string;
  subtitle?: string;
  allowPaste?: boolean;
  className?: string;
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept,
  multiple = false,
  maxSizeMB = 50,
  minSizeBytes = 1,
  allowEmpty = false,
  onFilesSelected,
  selectedFiles = [],
  onRemoveFile,
  title,
  subtitle,
  allowPaste = true,
  className = '',
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dragCounter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndPassFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (disabled) return;
      setErrorMessage(null);
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const batchResult = await FileHandlerService.validateFiles(incoming, {
        accept,
        maxSizeBytes,
        minSizeBytes,
        allowEmpty,
        maxFiles: multiple ? 20 : 1,
      });

      if (batchResult.errors.length > 0) {
        setErrorMessage(batchResult.errors[0]);
      }

      if (batchResult.validFiles.length > 0) {
        const filesToPass = multiple ? batchResult.validFiles : [batchResult.validFiles[0]];
        onFilesSelected(filesToPass);
      }
    },
    [accept, allowEmpty, disabled, maxSizeMB, minSizeBytes, multiple, onFilesSelected]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFiles(e.target.files);
    }
    // Reset file input value so re-selecting the same file triggers change
    e.target.value = '';
  };

  // Paste file support
  useEffect(() => {
    if (!allowPaste || disabled) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        validateAndPassFiles(e.clipboardData.files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [allowPaste, disabled, validateAndPassFiles]);

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Interactive Dropzone Box */}
      <div
        id="file-dropzone-container"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative group rounded-3xl border-2 border-dashed p-7 sm:p-9 transition-all duration-200 flex flex-col items-center justify-center text-center select-none ${
          disabled
            ? 'border-slate-800 bg-slate-900/20 opacity-60 cursor-not-allowed'
            : isDragOver
            ? 'border-cyan-400 bg-cyan-950/50 shadow-[0_0_35px_rgba(6,182,212,0.35)] scale-[1.01] cursor-copy ring-4 ring-cyan-500/20'
            : 'border-cyan-500/30 bg-slate-900/40 hover:border-cyan-400/60 hover:bg-slate-900/60 cursor-pointer shadow-lg shadow-black/20'
        }`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="File upload dropzone. Drag files here or press Enter to open file dialog."
        aria-describedby="dropzone-description-meta"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
          id="file-dropzone-input"
          tabIndex={-1}
        />

        <div className="w-14 h-14 rounded-2xl bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3.5 group-hover:scale-105 group-hover:border-cyan-400/60 transition-transform shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-sm sm:text-base font-semibold text-white mb-1">
          {title || t('common.dragAndDrop')}
        </h3>

        <p id="dropzone-description-meta" className="text-xs text-slate-400 max-w-md leading-relaxed">
          {subtitle ||
            `${maxSizeMB}MB maximum limit • ${accept ? `Allowed: ${accept}` : 'All file formats supported'}`}
        </p>

        {/* Action button inside dropzone */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) inputRef.current?.click();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 transition-all active:scale-95 shadow-sm"
          >
            Browse Files Locally
          </button>

          {allowPaste && (
            <span className="text-[11px] font-mono px-2.5 py-1.5 rounded-xl bg-white/5 text-slate-400 border border-white/10 hidden sm:inline-block">
              Paste files with ⌘V / Ctrl+V
            </span>
          )}
        </div>

        {/* Offline client-side badge */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-teal-400/90">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Kept 100% in your browser memory — never sent to a server</span>
        </div>
      </div>

      {/* Accessible Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 shadow-lg shadow-black/20 animate-in fade-in duration-150"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-300">File Notice</p>
            <p className="text-rose-200/90 mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-900/30 transition-colors"
            aria-label="Dismiss error notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 pt-1" role="region" aria-label="Loaded files">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>
                Selected Files ({selectedFiles.length}
                {multiple ? '' : ' active'})
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Total: {FileHandlerService.formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 border border-cyan-500/20 text-xs backdrop-blur-md shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <FileIcon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-slate-200 truncate" title={file.name}>
                      {FileHandlerService.sanitizeFileName(file.name, 'unnamed_file')}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">
                      {FileHandlerService.formatBytes(file.size)} • {file.type || 'binary'}
                    </p>
                  </div>
                </div>

                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(idx);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors ml-2 shrink-0"
                    aria-label={`Remove file ${file.name}`}
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
