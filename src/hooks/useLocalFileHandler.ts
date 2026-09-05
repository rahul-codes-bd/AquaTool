import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FileHandlerService,
  FileValidationOptions,
  ObjectUrlManager,
  FileErrorCode,
} from '../services/fileHandler';

export type FileHandlerStatus =
  | 'idle'
  | 'validating'
  | 'ready'
  | 'processing'
  | 'success'
  | 'error';

export interface FileHandlerError {
  title?: string;
  message: string;
  code?: FileErrorCode;
  details?: string;
}

export interface FileHandlerOutput {
  blob?: Blob;
  url?: string;
  fileName?: string;
  text?: string;
  stats?: Record<string, string | number>;
}

export interface UseLocalFileHandlerOptions extends FileValidationOptions {
  multiple?: boolean;
  onFilesAccepted?: (files: File[]) => void;
  onError?: (error: FileHandlerError) => void;
}

export const useLocalFileHandler = (options: UseLocalFileHandlerOptions = {}) => {
  const {
    multiple = false,
    onFilesAccepted,
    onError,
    ...validationOptions
  } = options;

  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<FileHandlerStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [error, setError] = useState<FileHandlerError | null>(null);
  const [output, setOutput] = useState<FileHandlerOutput | null>(null);

  // Dedicated Object URL manager instance
  const urlManagerRef = useRef<ObjectUrlManager>(new ObjectUrlManager());

  // Clean up all object URLs when hook unmounts
  useEffect(() => {
    const manager = urlManagerRef.current;
    return () => {
      manager.revokeAll();
    };
  }, []);

  /**
   * Reset flow - cleanly revokes all object URLs and resets all states
   */
  const reset = useCallback(() => {
    urlManagerRef.current.revokeAll();
    setFiles([]);
    setStatus('idle');
    setProgress(0);
    setStatusText('');
    setError(null);
    setOutput(null);
  }, []);

  /**
   * Safe Object URL creation helper
   */
  const createSafeUrl = useCallback((blobOrFile: Blob | File): string => {
    return urlManagerRef.current.createSafeUrl(blobOrFile);
  }, []);

  /**
   * Safe Object URL revocation helper
   */
  const revokeSafeUrl = useCallback((url?: string): void => {
    urlManagerRef.current.revokeSafeUrl(url);
  }, []);

  /**
   * Process selected or dropped files with validation
   */
  const handleFiles = useCallback(
    async (incoming: FileList | File[] | null) => {
      if (!incoming) return;
      const fileArray = Array.from(incoming);
      if (fileArray.length === 0) return;

      setStatus('validating');
      setProgress(15);
      setStatusText('Validating local file...');
      setError(null);

      try {
        const batchResult = await FileHandlerService.validateFiles(fileArray, {
          maxFiles: multiple ? (validationOptions.maxFiles || 20) : 1,
          ...validationOptions,
        });

        if (batchResult.errors.length > 0 && batchResult.validFiles.length === 0) {
          const firstErr = batchResult.invalidFiles[0];
          const errObj: FileHandlerError = {
            title: 'File Validation Failed',
            message: firstErr?.error || batchResult.errors[0],
            code: firstErr?.code || 'UNKNOWN_ERROR',
          };
          setError(errObj);
          setStatus('error');
          setProgress(0);
          setStatusText('');
          if (onError) onError(errObj);
          return;
        }

        const accepted = multiple ? batchResult.validFiles : [batchResult.validFiles[0]];
        setFiles(accepted);
        setStatus('ready');
        setProgress(100);
        setStatusText(
          `${accepted.length} file${accepted.length > 1 ? 's' : ''} verified and loaded locally`
        );

        if (onFilesAccepted) {
          onFilesAccepted(accepted);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to validate local file';
        const errObj: FileHandlerError = {
          title: 'Validation Error',
          message,
          code: 'UNKNOWN_ERROR',
        };
        setError(errObj);
        setStatus('error');
        setProgress(0);
        setStatusText('');
        if (onError) onError(errObj);
      }
    },
    [multiple, onError, onFilesAccepted, validationOptions]
  );

  /**
   * Remove a single file from the loaded files
   */
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setStatus('idle');
        setProgress(0);
        setStatusText('');
      }
      return next;
    });
  }, []);

  /**
   * Update progress smoothly
   */
  const updateProgress = useCallback((val: number, text?: string) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setProgress(clamped);
    if (text !== undefined) {
      setStatusText(text);
    }
  }, []);

  /**
   * Download the processed output file with sanitized name
   */
  const downloadOutput = useCallback(() => {
    if (!output) return;

    if (output.blob) {
      const fileName = output.fileName || 'processed_output';
      ObjectUrlManager.downloadBlob(output.blob, fileName);
    } else if (output.url) {
      const safeName = FileHandlerService.sanitizeFileName(
        output.fileName || 'download',
        'download'
      );
      const anchor = document.createElement('a');
      anchor.href = output.url;
      anchor.download = safeName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  }, [output]);

  return {
    files,
    primaryFile: files[0] || null,
    status,
    progress,
    statusText,
    error,
    output,
    handleFiles,
    removeFile,
    reset,
    setStatus,
    updateProgress,
    setError,
    setOutput,
    downloadOutput,
    createSafeUrl,
    revokeSafeUrl,
  };
};
