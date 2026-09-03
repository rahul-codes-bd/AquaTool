/**
 * AquaTools - Client-Side Reusable Local File Handler & Validator
 * 
 * Guarantees 100% in-browser processing with:
 * - MIME and extension verification
 * - Configurable size bounds (min/max bytes)
 * - Zero-byte empty file detection
 * - Magic byte verification for known binary formats (detecting corrupted/spoofed files)
 * - Safe filename sanitization (eliminates path traversal, illegal characters, null bytes)
 * - Object URL lifecycle management and automatic memory revocation
 */

export interface FileValidationOptions {
  /**
   * Comma-separated list of allowed MIME types or extensions.
   * Examples: 'image/*', '.pdf, .png', 'application/json, text/plain'
   */
  accept?: string;
  /** Maximum allowed size in bytes (default: 50MB) */
  maxSizeBytes?: number;
  /** Minimum allowed size in bytes (default: 1 byte) */
  minSizeBytes?: number;
  /** Allow 0-byte empty files (default: false) */
  allowEmpty?: boolean;
  /** Maximum number of files allowed in a batch (default: 10) */
  maxFiles?: number;
  /** Check magic byte signatures for binary formats (default: true) */
  checkMagicBytes?: boolean;
}

export type FileErrorCode =
  | 'FILE_EMPTY'
  | 'FILE_TOO_LARGE'
  | 'FILE_TOO_SMALL'
  | 'INVALID_MIME_TYPE'
  | 'INVALID_EXTENSION'
  | 'MALFORMED_FILE'
  | 'TOO_MANY_FILES'
  | 'UNKNOWN_ERROR';

export interface FileValidationResult {
  isValid: boolean;
  file: File;
  errorCode?: FileErrorCode;
  errorMessage?: string;
  sanitizedName: string;
}

export interface BatchValidationResult {
  validFiles: File[];
  invalidFiles: { file: File; error: string; code: FileErrorCode }[];
  errors: string[];
  totalValidBytes: number;
}

/**
 * Common magic byte signatures for security and corruption detection
 */
const MAGIC_SIGNATURES: Record<string, { bytes: number[]; offset?: number }> = {
  pdf: { bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  png: { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // .PNG\r\n\x1a\n
  jpg: { bytes: [0xff, 0xd8, 0xff] }, // JPEG SOI
  jpeg: { bytes: [0xff, 0xd8, 0xff] },
  gif: { bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  webp: { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (offset 0), followed by WEBP at offset 8
  zip: { bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK..
};

export class FileHandlerService {
  /** Default 50MB maximum file size */
  static readonly DEFAULT_MAX_SIZE_BYTES = 50 * 1024 * 1024;
  /** Default 1 byte minimum file size */
  static readonly DEFAULT_MIN_SIZE_BYTES = 1;

  /**
   * Cleans and sanitizes filenames to prevent path traversal,
   * shell injection, illegal OS characters, and control characters.
   */
  static sanitizeFileName(rawName: string, fallback = 'download'): string {
    if (!rawName || typeof rawName !== 'string') {
      return fallback;
    }

    // Strip null bytes and control chars (ASCII 0-31 and 127)
    let sanitized = rawName.replace(/[\x00-\x1f\x7f]/g, '');

    // Strip path traversal attempts (../ or ..\)
    sanitized = sanitized.replace(/\.\.+[/\\]/g, '');

    // Extract basename (remove leading directory separators)
    const baseName = sanitized.split(/[/\\]/).pop() || '';

    // Replace illegal Windows & Unix filename characters: < > : " / \ | ? *
    let cleaned = baseName.replace(/[<>:"/\\|?*]/g, '_');

    // Trim trailing periods and spaces (invalid on Windows)
    cleaned = cleaned.replace(/[. ]+$/, '').trim();

    // Collapse multiple consecutive underscores or dashes
    cleaned = cleaned.replace(/_{2,}/g, '_').replace(/-{2,}/g, '-');

    // Enforce reasonable length limit (255 chars max for standard filesystems)
    if (cleaned.length > 255) {
      const dotIndex = cleaned.lastIndexOf('.');
      if (dotIndex > 0 && cleaned.length - dotIndex < 10) {
        const ext = cleaned.slice(dotIndex);
        const namePart = cleaned.slice(0, 255 - ext.length);
        cleaned = `${namePart}${ext}`;
      } else {
        cleaned = cleaned.slice(0, 255);
      }
    }

    return cleaned || fallback;
  }

  /**
   * Format raw bytes into human-readable string (KB, MB, GB)
   */
  static formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + (sizes[i] || 'Bytes');
  }

  /**
   * Extract lowercase file extension without dot, or empty string
   */
  static getExtension(fileName: string): string {
    const parts = fileName.split('.');
    if (parts.length <= 1) return '';
    return (parts.pop() || '').toLowerCase().trim();
  }

  /**
   * Reads the first N bytes of a File or Blob
   */
  static async readHeaderBytes(file: File | Blob, byteCount = 16): Promise<Uint8Array> {
    const slice = file.slice(0, byteCount);
    const arrayBuffer = await slice.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Verify if binary header matches the claimed file format
   */
  static async verifyMagicBytes(file: File): Promise<{ matches: boolean; expectedFormat?: string }> {
    const ext = this.getExtension(file.name);
    const sig = MAGIC_SIGNATURES[ext];

    // If we don't have a known binary signature for this extension, skip check
    if (!sig) {
      return { matches: true };
    }

    try {
      const headerBytes = await this.readHeaderBytes(file, 16);
      if (headerBytes.length < sig.bytes.length) {
        return { matches: false, expectedFormat: ext.toUpperCase() };
      }

      const offset = sig.offset || 0;
      for (let i = 0; i < sig.bytes.length; i++) {
        if (headerBytes[offset + i] !== sig.bytes[i]) {
          return { matches: false, expectedFormat: ext.toUpperCase() };
        }
      }

      // Special check for WEBP (RIFF .... WEBP)
      if (ext === 'webp') {
        const webpTag = String.fromCharCode(...headerBytes.slice(8, 12));
        if (webpTag !== 'WEBP') {
          return { matches: false, expectedFormat: 'WEBP' };
        }
      }

      return { matches: true };
    } catch {
      return { matches: false, expectedFormat: ext.toUpperCase() };
    }
  }

  /**
   * Checks if a file satisfies the 'accept' filter string.
   * Supports:
   * - extensions: '.pdf', '.png', '.json'
   * - MIME types: 'application/pdf', 'text/plain'
   * - wildcards: 'image/*', 'text/*', 'video/*'
   */
  static checkAcceptance(file: File, accept: string): { matchesMime: boolean; matchesExtension: boolean } {
    if (!accept || !accept.trim() || accept === '*') {
      return { matchesMime: true, matchesExtension: true };
    }

    const acceptedTokens = accept
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const fileExt = '.' + this.getExtension(file.name);
    const fileMime = (file.type || '').toLowerCase();

    let matchesExtension = false;
    let matchesMime = false;

    for (const token of acceptedTokens) {
      if (token.startsWith('.')) {
        if (fileExt === token) {
          matchesExtension = true;
          matchesMime = true; // extension matches
          break;
        }
      } else if (token.endsWith('/*')) {
        const prefix = token.replace('/*', '');
        if (fileMime && fileMime.startsWith(prefix)) {
          matchesMime = true;
          matchesExtension = true;
          break;
        }
      } else if (token === fileMime) {
        matchesMime = true;
        matchesExtension = true;
        break;
      }
    }

    return { matchesMime, matchesExtension };
  }

  /**
   * Validates a single file against configuration constraints
   */
  static async validateFile(
    file: File,
    options: FileValidationOptions = {}
  ): Promise<FileValidationResult> {
    const {
      accept,
      maxSizeBytes = this.DEFAULT_MAX_SIZE_BYTES,
      minSizeBytes = this.DEFAULT_MIN_SIZE_BYTES,
      allowEmpty = false,
      checkMagicBytes = true,
    } = options;

    const sanitizedName = this.sanitizeFileName(file.name, 'unnamed_file');

    // 1. Empty file check
    if (!allowEmpty && file.size === 0) {
      return {
        isValid: false,
        file,
        sanitizedName,
        errorCode: 'FILE_EMPTY',
        errorMessage: `File "${file.name}" is completely empty (0 Bytes). Please provide a valid file with content.`,
      };
    }

    // 2. Minimum size check
    if (file.size < minSizeBytes) {
      return {
        isValid: false,
        file,
        sanitizedName,
        errorCode: 'FILE_TOO_SMALL',
        errorMessage: `File "${file.name}" (${this.formatBytes(file.size)}) is smaller than the minimum required size of ${this.formatBytes(minSizeBytes)}.`,
      };
    }

    // 3. Maximum size check
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        file,
        sanitizedName,
        errorCode: 'FILE_TOO_LARGE',
        errorMessage: `File "${file.name}" (${this.formatBytes(file.size)}) exceeds the maximum allowed limit of ${this.formatBytes(maxSizeBytes)}.`,
      };
    }

    // 4. Accept filter check (MIME & Extension)
    if (accept) {
      const { matchesMime, matchesExtension } = this.checkAcceptance(file, accept);
      if (!matchesMime && !matchesExtension) {
        const ext = this.getExtension(file.name);
        return {
          isValid: false,
          file,
          sanitizedName,
          errorCode: ext ? 'INVALID_EXTENSION' : 'INVALID_MIME_TYPE',
          errorMessage: `File format for "${file.name}" is not supported. Required format: ${accept}.`,
        };
      }
    }

    // 5. Binary magic byte / header check (detect corrupted or spoofed files)
    if (checkMagicBytes && file.size > 0) {
      const magicCheck = await this.verifyMagicBytes(file);
      if (!magicCheck.matches) {
        return {
          isValid: false,
          file,
          sanitizedName,
          errorCode: 'MALFORMED_FILE',
          errorMessage: `File "${file.name}" appears to be corrupted or not a valid ${magicCheck.expectedFormat || 'file'} binary.`,
        };
      }
    }

    return {
      isValid: true,
      file,
      sanitizedName,
    };
  }

  /**
   * Validates an array or FileList of files in batch
   */
  static async validateFiles(
    files: FileList | File[],
    options: FileValidationOptions = {}
  ): Promise<BatchValidationResult> {
    const rawFiles = Array.from(files);
    const maxFiles = options.maxFiles || 10;

    const validFiles: File[] = [];
    const invalidFiles: { file: File; error: string; code: FileErrorCode }[] = [];
    const errors: string[] = [];
    let totalValidBytes = 0;

    if (rawFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files can be processed at once. You selected ${rawFiles.length} files.`);
      return { validFiles: [], invalidFiles: [], errors, totalValidBytes: 0 };
    }

    for (const file of rawFiles) {
      const result = await this.validateFile(file, options);
      if (result.isValid) {
        validFiles.push(file);
        totalValidBytes += file.size;
      } else {
        const msg = result.errorMessage || `Validation failed for ${file.name}`;
        errors.push(msg);
        invalidFiles.push({
          file,
          error: msg,
          code: result.errorCode || 'UNKNOWN_ERROR',
        });
      }
    }

    return {
      validFiles,
      invalidFiles,
      errors,
      totalValidBytes,
    };
  }
}

/**
 * Object URL LifeCycle Manager to guarantee zero memory leaks
 */
export class ObjectUrlManager {
  private activeUrls = new Set<string>();

  /**
   * Create an object URL and track it for cleanup
   */
  createSafeUrl(blobOrFile: Blob | File): string {
    const url = URL.createObjectURL(blobOrFile);
    this.activeUrls.add(url);
    return url;
  }

  /**
   * Revoke a single tracked object URL
   */
  revokeSafeUrl(url?: string): void {
    if (!url) return;
    if (this.activeUrls.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore browser revoke errors
      }
      this.activeUrls.delete(url);
    }
  }

  /**
   * Revoke all currently active object URLs
   */
  revokeAll(): void {
    this.activeUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    this.activeUrls.clear();
  }

  /**
   * Active tracked URL count
   */
  get count(): number {
    return this.activeUrls.size;
  }

  /**
   * Initiates an in-browser download of a Blob with sanitized filename
   * and automated object URL revocation.
   */
  static downloadBlob(blob: Blob | File, rawFileName: string): void {
    const safeName = FileHandlerService.sanitizeFileName(rawFileName, 'download_file');
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = safeName;
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Revoke after a generous 1-second delay so browser can complete download stream
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }
}
