import React, { useRef, useState, useCallback, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Clipboard, AlertCircle, FilePlus, Sparkles } from 'lucide-react';
import { IMAGE_CONFIG } from '../../config/imageConfig';

interface ImageDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedMimeTypes?: string[];
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onFilesSelected,
  acceptedMimeTypes = IMAGE_CONFIG.SUPPORTED_INPUT_MIME_TYPES,
  maxFiles = 50,
  multiple = true,
  disabled = false,
  compact = false,
  title = 'Drop your images here, or click to browse',
  subtitle = 'Supports PNG, JPG, WebP, AVIF, SVG, GIF, BMP, TIFF & ICO • 100% Client-Side',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filterAndEmitFiles = useCallback(
    (rawFiles: FileList | File[]) => {
      setErrorMessage(null);
      const fileArray = Array.from(rawFiles);
      if (fileArray.length === 0) return;

      const validFiles: File[] = [];
      const rejectedFiles: string[] = [];

      for (const file of fileArray) {
        // Size validation
        if (file.size > IMAGE_CONFIG.MAX_SAFE_FILE_SIZE_MB * 1024 * 1024) {
          rejectedFiles.push(`${file.name} (exceeds ${IMAGE_CONFIG.MAX_SAFE_FILE_SIZE_MB}MB limit)`);
          continue;
        }

        // MIME / Extension validation
        const isMimeMatch = acceptedMimeTypes.some((type) => {
          if (type.endsWith('/*')) {
            const prefix = type.replace('/*', '');
            return file.type.startsWith(prefix);
          }
          return file.type === type;
        });

        const isExtMatch = IMAGE_CONFIG.SUPPORTED_INPUT_EXTENSIONS.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );

        if (isMimeMatch || isExtMatch || file.type.startsWith('image/')) {
          validFiles.push(file);
        } else {
          rejectedFiles.push(`${file.name} (unsupported format)`);
        }
      }

      if (rejectedFiles.length > 0) {
        setErrorMessage(
          `Skipped ${rejectedFiles.length} invalid file(s): ${rejectedFiles.slice(0, 2).join(', ')}${
            rejectedFiles.length > 2 ? '...' : ''
          }`
        );
      }

      if (validFiles.length > 0) {
        const capped = multiple ? validFiles.slice(0, maxFiles) : [validFiles[0]];
        onFilesSelected(capped);
      }
    },
    [acceptedMimeTypes, maxFiles, multiple, onFilesSelected]
  );

  // Paste handler (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const imageFiles: File[] = [];
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i];
          if (file.type.startsWith('image/')) {
            imageFiles.push(file);
          }
        }
        if (imageFiles.length > 0) {
          filterAndEmitFiles(imageFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, filterAndEmitFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      filterAndEmitFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      filterAndEmitFiles(e.target.files);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload images dropzone"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={`relative group cursor-pointer transition-all duration-200 select-none overflow-hidden rounded-3xl border-2 border-dashed ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_30px_rgba(6,182,212,0.3)] scale-[1.008]'
            : 'border-white/15 bg-white/5 hover:border-cyan-500/40 hover:bg-white/8 shadow-xl'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${
          compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12'
        }`}
      >
        {/* Subtle Water Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-teal-500/5 pointer-events-none" />

        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_CONFIG.SUPPORTED_INPUT_EXTENSIONS.join(',')}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          tabIndex={-1}
        />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
              isDragOver
                ? 'bg-cyan-500 text-slate-950 scale-110 shadow-cyan-500/40'
                : 'bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/30 text-cyan-300 group-hover:scale-105 group-hover:border-cyan-400/50'
            }`}
          >
            {isDragOver ? (
              <FilePlus className="w-8 h-8 animate-bounce" />
            ) : (
              <UploadCloud className="w-8 h-8 group-hover:text-cyan-200 transition-colors" />
            )}
          </div>

          <div className="space-y-1.5 max-w-lg">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-cyan-200 transition-colors">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-medium text-slate-400">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <ImageIcon className="w-3 h-3 text-cyan-400" />
              <span>All Major Formats</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <Clipboard className="w-3 h-3 text-teal-400" />
              <span>Paste Clipboard (Ctrl+V)</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <Sparkles className="w-3 h-3" />
              <span>0% Cloud Upload</span>
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
