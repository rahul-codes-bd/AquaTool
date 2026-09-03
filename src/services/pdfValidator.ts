import { PdfValidationOptions, PdfValidationResult } from '../types/pdf';
import { PdfEngine } from './pdfEngine';

export class PdfValidator {
  /**
   * Formats bytes into human-readable string (KB, MB, GB)
   */
  static formatFileSize(bytes: number): string {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
  }

  /**
   * Validates a candidate PDF file before ingestion
   */
  static async validatePdf(
    file: File | Blob,
    options: PdfValidationOptions = {}
  ): Promise<PdfValidationResult> {
    const fileName = file instanceof File ? file.name : 'document.pdf';
    const fileSizeBytes = file.size;
    const fileSizeFormatted = this.formatFileSize(fileSizeBytes);
    const maxFileSizeMB = options.maxFileSizeMB ?? 50;
    const maxBytes = maxFileSizeMB * 1024 * 1024;

    // 1. Check for empty files
    if (fileSizeBytes === 0 && !options.allowEmpty) {
      return {
        isValid: false,
        errorCode: 'EMPTY_FILE',
        errorMessage: 'The selected PDF file is empty (0 bytes). Please select a valid document.',
        fileSizeBytes,
        fileSizeFormatted,
        fileName,
      };
    }

    // 2. Extension validation if filename is available
    if (file instanceof File && options.allowedExtensions && options.allowedExtensions.length > 0) {
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const allowed = options.allowedExtensions.map((e) => e.toLowerCase().replace(/^\./, ''));
      if (!allowed.includes(ext)) {
        return {
          isValid: false,
          errorCode: 'INVALID_EXTENSION',
          errorMessage: `Invalid file extension ".${ext}". Allowed: ${allowed.map((e) => `.${e}`).join(', ')}`,
          fileSizeBytes,
          fileSizeFormatted,
          fileName,
        };
      }
    }

    // 3. File size check
    if (fileSizeBytes > maxBytes) {
      return {
        isValid: false,
        errorCode: 'FILE_TOO_LARGE',
        errorMessage: `File size (${fileSizeFormatted}) exceeds the recommended client-side limit of ${maxFileSizeMB} MB. Processing very large PDFs in-browser may exceed memory constraints.`,
        fileSizeBytes,
        fileSizeFormatted,
        fileName,
      };
    }

    // 4. PDF Magic Header Signature Check
    const requireSignature = options.requireValidSignature ?? true;
    if (requireSignature) {
      const signatureResult = await PdfEngine.validatePdfSignature(file);
      if (!signatureResult.isValid) {
        return {
          isValid: false,
          errorCode: 'INVALID_SIGNATURE',
          errorMessage: 'The selected file does not have a valid PDF header (%PDF-). It may be corrupted or a non-PDF file renamed with a .pdf extension.',
          fileSizeBytes,
          fileSizeFormatted,
          fileName,
        };
      }

      // 5. Warning for large files approaching memory limits
      let warningMessage: string | undefined;
      if (fileSizeBytes > 25 * 1024 * 1024) {
        warningMessage = 'This file is large (>25 MB). In-browser processing may take a few seconds depending on your device RAM.';
      }

      return {
        isValid: true,
        detectedVersion: signatureResult.version,
        warningMessage,
        fileSizeBytes,
        fileSizeFormatted,
        fileName,
      };
    }

    return {
      isValid: true,
      fileSizeBytes,
      fileSizeFormatted,
      fileName,
    };
  }

  /**
   * Validates non-PDF files for converters (e.g. image files for Image-to-PDF)
   */
  static validateImageForPdf(file: File, maxMb = 30): { isValid: boolean; errorMessage?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/bmp'];
    const validExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'heic'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (file.size === 0) {
      return { isValid: false, errorMessage: 'The selected image is empty (0 bytes).' };
    }

    if (file.size > maxMb * 1024 * 1024) {
      return {
        isValid: false,
        errorMessage: `Image size (${this.formatFileSize(file.size)}) exceeds ${maxMb} MB limit.`,
      };
    }

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      return {
        isValid: false,
        errorMessage: `Unsupported image format (${file.type || ext}). Please provide JPEG, PNG, WebP, or SVG.`,
      };
    }

    return { isValid: true };
  }
}
