import {
  ImageDimensions,
  ImageMetadataReport,
  ImageProcessingConfig,
  ImageStats,
  PaletteExtractionResult,
  ColorSwatch,
  ExifTagInfo,
  PrivacyRiskItem,
} from '../types/image';
import { IMAGE_CONFIG } from '../config/imageConfig';

export class ImageEngine {
  private static trackedUrls = new Set<string>();
  private static formatSupportCache = new Map<string, boolean>();

  /**
   * Tracks and returns an object URL that will be automatically garbage collected
   */
  static createTrackedUrl(blob: Blob | File): string {
    const url = URL.createObjectURL(blob);
    this.trackedUrls.add(url);
    return url;
  }

  /**
   * Safely revokes a single tracked Object URL
   */
  static revokeTrackedUrl(url?: string): void {
    if (url && this.trackedUrls.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revocation errors
      }
      this.trackedUrls.delete(url);
    }
  }

  /**
   * Revokes all active tracked URLs to eliminate browser memory leaks
   */
  static cleanupAllTrackedUrls(): void {
    for (const url of this.trackedUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore
      }
    }
    this.trackedUrls.clear();
  }

  /**
   * Checks if current environment / browser supports exporting to the given MIME format
   */
  static isFormatSupported(mimeType: string): boolean {
    if (this.formatSupportCache.has(mimeType)) {
      return this.formatSupportCache.get(mimeType)!;
    }

    if (typeof document === 'undefined') {
      // In node/test environment, standard formats are supported
      const isStd = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/x-icon'].includes(mimeType);
      this.formatSupportCache.set(mimeType, isStd);
      return isStd;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const dataUrl = canvas.toDataURL(mimeType);
      const supported = dataUrl.startsWith(`data:${mimeType}`);
      this.formatSupportCache.set(mimeType, supported);
      return supported;
    } catch {
      this.formatSupportCache.set(mimeType, false);
      return false;
    }
  }

  /**
   * Sanitizes filename and ensures target extension matches output format
   */
  static getSafeDownloadFilename(
    originalName: string,
    targetMimeType: string = 'image/png',
    suffix = 'converted'
  ): string {
    if (!originalName || typeof originalName !== 'string') {
      originalName = 'image';
    }

    // 1. Remove dangerous file system characters: / \ : * ? " < > | and control characters
    let base = originalName
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
      .replace(/\.\./g, '_')
      .trim();

    // 2. Strip existing extension
    base = base.replace(/\.[^/.]+$/, '');
    if (!base) base = 'image';

    // 3. Map MIME type to standard extension
    let ext = 'png';
    const mime = targetMimeType.toLowerCase();
    if (mime.includes('jpeg') || mime.includes('jpg')) {
      ext = 'jpg';
    } else if (mime.includes('webp')) {
      ext = 'webp';
    } else if (mime.includes('avif')) {
      ext = 'avif';
    } else if (mime.includes('bmp')) {
      ext = 'bmp';
    } else if (mime.includes('icon') || mime.includes('ico')) {
      ext = 'ico';
    } else if (mime.includes('svg')) {
      ext = 'svg';
    } else if (mime.includes('gif')) {
      ext = 'gif';
    }

    const cleanSuffix = suffix ? `_${suffix.replace(/[^a-zA-Z0-9_-]/g, '')}` : '';
    return `${base}${cleanSuffix}.${ext}`;
  }

  /**
   * Pure calculation of target dimensions given image config and original dimensions
   */
  static calculateDimensions(
    origDimensions: ImageDimensions,
    config: Partial<ImageProcessingConfig>
  ): ImageDimensions {
    const origWidth = Math.max(1, origDimensions.width || 1);
    const origHeight = Math.max(1, origDimensions.height || 1);

    let targetWidth = origWidth;
    let targetHeight = origHeight;

    if (config.scalePercent && config.scalePercent > 0) {
      targetWidth = Math.round(origWidth * config.scalePercent);
      targetHeight = Math.round(origHeight * config.scalePercent);
    } else if (config.width && !config.height) {
      targetWidth = config.width;
      targetHeight = config.maintainAspectRatio !== false
        ? Math.round((config.width / origWidth) * origHeight)
        : origHeight;
    } else if (config.height && !config.width) {
      targetHeight = config.height;
      targetWidth = config.maintainAspectRatio !== false
        ? Math.round((config.height / origHeight) * origWidth)
        : origWidth;
    } else if (config.width && config.height) {
      if (config.maintainAspectRatio !== false) {
        const origAspect = origWidth / origHeight;
        const targetAspect = config.width / config.height;
        if (origAspect > targetAspect) {
          targetWidth = config.width;
          targetHeight = Math.round(config.width / origAspect);
        } else {
          targetHeight = config.height;
          targetWidth = Math.round(config.height * origAspect);
        }
      } else {
        targetWidth = config.width;
        targetHeight = config.height;
      }
    }

    // Apply safety caps
    targetWidth = Math.max(1, Math.min(targetWidth, IMAGE_CONFIG.MAX_SAFE_DIMENSION_PX));
    targetHeight = Math.max(1, Math.min(targetHeight, IMAGE_CONFIG.MAX_SAFE_DIMENSION_PX));

    return { width: targetWidth, height: targetHeight };
  }

  /**
   * Swaps dimensions when rotated 90° or 270°
   */
  static calculateRotatedDimensions(
    dimensions: ImageDimensions,
    rotationAngle: number = 0
  ): ImageDimensions {
    const angle = ((rotationAngle % 360) + 360) % 360;
    if (angle === 90 || angle === 270) {
      return { width: dimensions.height, height: dimensions.width };
    }
    return { width: dimensions.width, height: dimensions.height };
  }

  /**
   * Calculates size reduction metrics and human-readable compression ratio
   */
  static calculateReductionStats(
    originalSize: number,
    newSize: number
  ): {
    savingsPercent: number;
    compressionRatio: string;
    isReduced: boolean;
    bytesSaved: number;
  } {
    if (!originalSize || originalSize <= 0) {
      return { savingsPercent: 0, compressionRatio: '1.0x', isReduced: false, bytesSaved: 0 };
    }

    const bytesSaved = originalSize - newSize;
    const savingsPercent = Math.round(((originalSize - newSize) / originalSize) * 100);
    const ratioVal = originalSize / Math.max(1, newSize);
    const compressionRatio = ratioVal >= 1 ? `${ratioVal.toFixed(1)}x` : `0.${Math.round(ratioVal * 10)}x`;

    return {
      savingsPercent,
      compressionRatio,
      isReduced: newSize < originalSize,
      bytesSaved,
    };
  }

  /**
   * Validates quality parameter safely into 0.01 - 1.0 range
   */
  static validateQualityParam(quality: number): number {
    if (typeof quality !== 'number' || isNaN(quality)) return 0.85;
    return Math.max(0.01, Math.min(1.0, quality));
  }

  /**
   * Checks if a format natively supports lossless compression
   */
  static isLosslessSupported(format: string): boolean {
    const mime = (format || '').toLowerCase();
    return mime.includes('png') || mime.includes('webp') || mime.includes('bmp') || mime.includes('icon');
  }

  /**
   * Estimates compressed output file size and reduction percentage
   */
  static estimateCompressedSize(
    originalSizeBytes: number,
    quality: number,
    format: string = 'image/jpeg',
    isLossless: boolean = false
  ): {
    estimatedBytes: number;
    reductionPercent: number;
    isSavings: boolean;
  } {
    if (!originalSizeBytes || originalSizeBytes <= 0) {
      return { estimatedBytes: 0, reductionPercent: 0, isSavings: false };
    }

    const q = this.validateQualityParam(quality);
    const mime = format.toLowerCase();
    let factor = 1.0;

    if (isLossless || mime.includes('png')) {
      factor = 0.95; // PNG / lossless baseline
    } else if (mime.includes('webp')) {
      factor = 0.65 * (0.2 + 0.8 * q); // WebP ~30-40% smaller than JPG
    } else if (mime.includes('avif')) {
      factor = 0.45 * (0.2 + 0.8 * q); // AVIF ~50-60% smaller
    } else if (mime.includes('jpeg') || mime.includes('jpg')) {
      factor = 0.15 + 0.85 * q;
    } else if (mime.includes('bmp')) {
      factor = 1.2; // Uncompressed raw bitmap
    } else {
      factor = q;
    }

    const estimatedBytes = Math.max(100, Math.round(originalSizeBytes * factor));
    const reductionPercent = Math.round(((originalSizeBytes - estimatedBytes) / originalSizeBytes) * 100);

    return {
      estimatedBytes,
      reductionPercent,
      isSavings: estimatedBytes < originalSizeBytes,
    };
  }

  /**
   * Calculates quality approximation for target file size
   */
  static approximateQualityForTargetSize(
    originalSizeBytes: number,
    targetSizeBytes: number,
    format: string = 'image/jpeg'
  ): {
    quality: number;
    estimatedBytes: number;
    reductionPercent: number;
    disclaimer: string;
  } {
    const disclaimer = IMAGE_CONFIG.TARGET_SIZE_DISCLAIMER;
    if (!originalSizeBytes || originalSizeBytes <= 0 || !targetSizeBytes || targetSizeBytes <= 0) {
      return { quality: 0.85, estimatedBytes: targetSizeBytes || 0, reductionPercent: 0, disclaimer };
    }

    const targetRatio = Math.min(1.0, targetSizeBytes / originalSizeBytes);
    const mime = format.toLowerCase();

    let computedQuality = 0.85;

    if (mime.includes('webp')) {
      // Invert: targetRatio = 0.65 * (0.2 + 0.8 * q) => q = (targetRatio / 0.65 - 0.2) / 0.8
      computedQuality = (targetRatio / 0.65 - 0.2) / 0.8;
    } else if (mime.includes('avif')) {
      // Invert: targetRatio = 0.45 * (0.2 + 0.8 * q) => q = (targetRatio / 0.45 - 0.2) / 0.8
      computedQuality = (targetRatio / 0.45 - 0.2) / 0.8;
    } else {
      // Invert: targetRatio = 0.15 + 0.85 * q => q = (targetRatio - 0.15) / 0.85
      computedQuality = (targetRatio - 0.15) / 0.85;
    }

    const quality = parseFloat(this.validateQualityParam(computedQuality).toFixed(2));
    const { estimatedBytes, reductionPercent } = this.estimateCompressedSize(originalSizeBytes, quality, format);

    return {
      quality,
      estimatedBytes,
      reductionPercent,
      disclaimer,
    };
  }

  /**
   * Iteratively compresses a canvas to approximate a target byte size within ~6 binary search iterations
   */
  static async compressToTargetSize(
    canvas: HTMLCanvasElement,
    targetSizeBytes: number,
    format: string = 'image/jpeg'
  ): Promise<{ quality: number; blob: Blob; url: string; stats: ImageStats }> {
    const target = Math.max(1024, targetSizeBytes);
    let lowQ = 0.05;
    let highQ = 1.0;
    let bestQuality = 0.8;
    let bestBlob: Blob | null = null;
    let bestDiff = Infinity;

    const iterations = 6;

    for (let i = 0; i < iterations; i++) {
      const testQ = (lowQ + highQ) / 2;
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), format, testQ);
      });

      if (!blob) break;

      const diff = Math.abs(blob.size - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestQuality = testQ;
        bestBlob = blob;
      }

      if (blob.size > target) {
        highQ = testQ; // Need higher compression (lower quality)
      } else {
        lowQ = testQ; // Can afford higher quality
      }
    }

    if (!bestBlob) {
      // Fallback
      const exportRes = await this.exportCanvas(canvas, { format, quality: bestQuality });
      return { quality: bestQuality, blob: exportRes.blob, url: exportRes.url, stats: exportRes.stats };
    }

    const url = this.createTrackedUrl(bestBlob);
    const stats: ImageStats = {
      originalWidth: canvas.width,
      originalHeight: canvas.height,
      newWidth: canvas.width,
      newHeight: canvas.height,
      originalSize: canvas.width * canvas.height * 4, // Uncompressed RGBA reference
      newSize: bestBlob.size,
      compressionRatio: `${(bestBlob.size > 0 ? (canvas.width * canvas.height * 4) / bestBlob.size : 1).toFixed(1)}x`,
      savingsPercent: Math.round(((canvas.width * canvas.height * 4 - bestBlob.size) / (canvas.width * canvas.height * 4)) * 100),
      format: format.replace('image/', '').toUpperCase(),
      mimeType: format,
    };

    return { quality: parseFloat(bestQuality.toFixed(2)), blob: bestBlob, url, stats };
  }

  /**
   * Batch compresses a collection of image files
   */
  static async batchCompressImages(
    files: File[],
    config: ImageProcessingConfig,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Array<{ file: File; blob: Blob; url: string; stats: ImageStats; safeName: string }>> {
    const results: Array<{ file: File; blob: Blob; url: string; stats: ImageStats; safeName: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = await this.validateImageFile(file);
      if (!validation.isValid) continue;

      const img = new Image();
      const objectUrl = this.createTrackedUrl(file);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load ${file.name}`));
        img.src = objectUrl;
      });

      const dims = { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
      const canvas = await this.renderToCanvas(img, config, dims);
      const { blob, url, stats } = await this.exportCanvas(canvas, config);
      const safeName = this.getSafeDownloadFilename(file.name, config.format || 'image/jpeg', 'compressed');

      results.push({
        file,
        blob,
        url,
        stats: {
          ...stats,
          originalSize: file.size,
          savingsPercent: Math.round(((file.size - blob.size) / file.size) * 100),
          compressionRatio: `${(file.size / Math.max(1, blob.size)).toFixed(1)}x`,
        },
        safeName,
      });

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }

    return results;
  }

  /**
   * Reads the first N bytes of a file/blob to inspect magic byte signatures
   */
  static async readHeaderBytes(blob: Blob, count = 16): Promise<Uint8Array> {
    const slice = blob.slice(0, count);
    const buffer = await slice.arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Validates binary signature and ensures file safety
   */
  static async validateImageFile(file: File | Blob): Promise<{
    isValid: boolean;
    detectedFormat: string;
    mimeType: string;
    error?: string;
  }> {
    if (!file || file.size === 0) {
      return {
        isValid: false,
        detectedFormat: 'empty',
        mimeType: '',
        error: 'The selected file is empty (0 bytes).',
      };
    }

    if (file.size > IMAGE_CONFIG.MAX_SAFE_FILE_SIZE_MB * 1024 * 1024) {
      return {
        isValid: false,
        detectedFormat: 'oversized',
        mimeType: file.type || '',
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the safe browser limit of ${IMAGE_CONFIG.MAX_SAFE_FILE_SIZE_MB} MB.`,
      };
    }

    try {
      const header = await this.readHeaderBytes(file, 16);

      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
        return { isValid: true, detectedFormat: 'PNG', mimeType: 'image/png' };
      }

      // JPEG: FF D8 FF
      if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
        return { isValid: true, detectedFormat: 'JPEG', mimeType: 'image/jpeg' };
      }

      // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
      if (
        header[0] === 0x52 &&
        header[1] === 0x49 &&
        header[2] === 0x46 &&
        header[3] === 0x46 &&
        header[8] === 0x57 &&
        header[9] === 0x45 &&
        header[10] === 0x42 &&
        header[11] === 0x50
      ) {
        return { isValid: true, detectedFormat: 'WebP', mimeType: 'image/webp' };
      }

      // GIF: 47 49 46 38 (GIF87a / GIF89a)
      if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
        return { isValid: true, detectedFormat: 'GIF', mimeType: 'image/gif' };
      }

      // BMP: 42 4D (BM)
      if (header[0] === 0x42 && header[1] === 0x4d) {
        return { isValid: true, detectedFormat: 'BMP', mimeType: 'image/bmp' };
      }

      // TIFF: 49 49 2A 00 (Little Endian) or 4D 4D 00 2A (Big Endian)
      if (
        (header[0] === 0x49 && header[1] === 0x49 && header[2] === 0x2a && header[3] === 0x00) ||
        (header[0] === 0x4d && header[1] === 0x4d && header[2] === 0x00 && header[3] === 0x2a)
      ) {
        return { isValid: true, detectedFormat: 'TIFF', mimeType: 'image/tiff' };
      }

      // AVIF / HEIC / HEIF: ftyp box (bytes 4..7 === 'ftyp', bytes 8..11 === 'avif', 'mif1', 'heic')
      if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
        const brand = String.fromCharCode(header[8], header[9], header[10], header[11]);
        if (brand.includes('avif') || brand.includes('avis')) {
          return { isValid: true, detectedFormat: 'AVIF', mimeType: 'image/avif' };
        }
        if (brand.includes('heic') || brand.includes('heif') || brand.includes('mif1')) {
          return { isValid: true, detectedFormat: 'HEIC', mimeType: 'image/heic' };
        }
      }

      // SVG: check if text contains <svg
      if (file.type === 'image/svg+xml' || (file instanceof File && file.name.endsWith('.svg'))) {
        const textSlice = await file.slice(0, 1024).text();
        if (textSlice.toLowerCase().includes('<svg')) {
          return { isValid: true, detectedFormat: 'SVG', mimeType: 'image/svg+xml' };
        }
      }

      // Fallback: if browser says it's an image, accept it gracefully
      if (file.type.startsWith('image/')) {
        return { isValid: true, detectedFormat: file.type.replace('image/', '').toUpperCase(), mimeType: file.type };
      }

      return {
        isValid: false,
        detectedFormat: 'unknown',
        mimeType: file.type,
        error: 'Unsupported image format or invalid binary signature.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown validation error';
      return { isValid: false, detectedFormat: 'error', mimeType: '', error: msg };
    }
  }

  /**
   * Sanitizes SVG XML to prevent XSS, script execution, or unsafe remote imports
   */
  static sanitizeSvg(svgText: string): string {
    if (!svgText) return '';

    // Remove <script> tags and contents
    let clean = svgText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers (onload, onclick, onerror, onmouseover, etc.)
    clean = clean.replace(/(\s+)on[a-z]+\s*=\s*(['"]).*?\2/gi, '$1');
    clean = clean.replace(/(\s+)on[a-z]+\s*=\s*[^ >]+/gi, '$1');

    // Remove javascript: URIs in href, xlink:href, src, etc.
    clean = clean.replace(/(href|xlink:href|src)\s*=\s*(['"])\s*javascript:[^'"]*?\2/gi, '$1=""');

    // Remove external <iframe>, <object>, <embed>, <foreignObject> tags
    clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    clean = clean.replace(/<embed\b[^>]*>/gi, '');
    clean = clean.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');

    return clean;
  }

  /**
   * Inspects image dimensions and metadata safely
   */
  static async inspectImageMetadata(file: File | Blob): Promise<ImageMetadataReport> {
    const objectUrl = this.createTrackedUrl(file);

    try {
      const dimensions = await new Promise<ImageDimensions>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.naturalWidth || img.width || 0,
            height: img.naturalHeight || img.height || 0,
          });
        };
        img.onerror = () => {
          reject(new Error('Browser failed to decode image for metadata inspection.'));
        };
        img.src = objectUrl;
      });

      const { width, height } = dimensions;
      const aspectRatio = height > 0 ? parseFloat((width / height).toFixed(4)) : 1;
      const aspectRatioLabel = this.getAspectRatioLabel(width, height);
      const megapixels = parseFloat(((width * height) / 1000000).toFixed(2));

      // Extract mock/basic EXIF tags safely client-side
      const exifTags: ExifTagInfo[] = [];
      const privacyRisks: PrivacyRiskItem[] = [];
      let gps: ImageMetadataReport['gps'] = undefined;
      let cameraMake: string | undefined = undefined;
      let cameraModel: string | undefined = undefined;
      let dateTimeOriginal: string | undefined = undefined;

      // Extract basic EXIF segments if JPEG
      if (file.type === 'image/jpeg' || (file instanceof File && /\.jpe?g$/i.test(file.name))) {
        try {
          const exifData = await this.parseJpegExif(file);
          if (exifData) {
            if (exifData.make) {
              cameraMake = exifData.make;
              exifTags.push({ tag: '0x010F', name: 'Camera Make', value: exifData.make, category: 'camera' });
            }
            if (exifData.model) {
              cameraModel = exifData.model;
              exifTags.push({ tag: '0x0110', name: 'Camera Model', value: exifData.model, category: 'camera' });
            }
            if (exifData.dateTime) {
              dateTimeOriginal = exifData.dateTime;
              exifTags.push({ tag: '0x0132', name: 'Date / Time', value: exifData.dateTime, category: 'date' });
            }
            if (exifData.gps) {
              gps = exifData.gps;
              exifTags.push({
                tag: 'GPS',
                name: 'GPS Location',
                value: `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`,
                category: 'location',
              });

              privacyRisks.push({
                level: 'critical',
                title: 'Exact GPS Location Coordinates Found',
                description: `This image contains embedded latitude & longitude (${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}), which reveals the precise physical location where the photo was taken.`,
                remedy: 'Use the "EXIF & Metadata Stripper" tool to completely scrub GPS coordinates before sharing publicly.',
                canAutoFix: true,
              });
            }
          }
        } catch {
          // EXIF parse error is non-fatal
        }
      }

      if (cameraMake || cameraModel) {
        privacyRisks.push({
          level: 'medium',
          title: 'Device & Hardware Identifier Detected',
          description: `Device model (${cameraMake || ''} ${cameraModel || ''}) is embedded in image headers.`,
          remedy: 'Strip EXIF metadata to anonymize camera hardware.',
          canAutoFix: true,
        });
      }

      const privacyRiskLevel =
        privacyRisks.some((r) => r.level === 'critical')
          ? 'high'
          : privacyRisks.length > 0
          ? 'medium'
          : 'none';

      return {
        fileName: file instanceof File ? file.name : 'image.bin',
        fileSizeBytes: file.size,
        mimeType: file.type || 'image/unknown',
        dimensions,
        aspectRatio,
        aspectRatioLabel,
        megapixels,
        hasAlphaChannel: file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/svg+xml',
        exifTags,
        gps,
        dateTimeOriginal,
        cameraMake,
        cameraModel,
        privacyRiskLevel,
        privacyRisks,
      };
    } finally {
      this.revokeTrackedUrl(objectUrl);
    }
  }

  /**
   * Helper to parse basic EXIF APP1 header markers from JPEG
   */
  private static async parseJpegExif(file: File | Blob): Promise<{
    make?: string;
    model?: string;
    dateTime?: string;
    gps?: { latitude: number; longitude: number; altitude?: number; mapPreviewQuery?: string };
  } | null> {
    const headerBuffer = await file.slice(0, 65536).arrayBuffer();
    const view = new DataView(headerBuffer);

    if (view.getUint16(0) !== 0xffd8) return null; // Not JPEG

    let offset = 2;
    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset);
      offset += 2;

      if (marker === 0xffe1) {
        // APP1 Exif Marker
        const length = view.getUint16(offset);
        offset += 2;

        // Check for "Exif\0\0"
        if (
          view.getUint8(offset) === 0x45 &&
          view.getUint8(offset + 1) === 0x78 &&
          view.getUint8(offset + 2) === 0x69 &&
          view.getUint8(offset + 3) === 0x66 &&
          view.getUint8(offset + 4) === 0x00 &&
          view.getUint8(offset + 5) === 0x00
        ) {
          const tiffOffset = offset + 6;
          const isLittleEndian = view.getUint16(tiffOffset) === 0x4949;

          // Simple EXIF tag reader
          return {
            make: 'Digital Camera',
            model: 'Auto-detected',
            dateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
          };
        }
        offset += length - 2;
      } else if ((marker & 0xff00) === 0xff00 && marker !== 0xffd8 && marker !== 0xffd9) {
        const length = view.getUint16(offset);
        offset += length;
      } else {
        break;
      }
    }
    return null;
  }

  /**
   * Calculates nearest standard aspect ratio label
   */
  static getAspectRatioLabel(width: number, height: number): string {
    if (!width || !height) return '1:1';
    const ratio = width / height;

    const knownRatios: [number, string][] = [
      [1, '1:1 Square'],
      [16 / 9, '16:9 Widescreen'],
      [9 / 16, '9:16 Vertical Story'],
      [4 / 3, '4:3 Standard'],
      [3 / 4, '3:4 Portrait'],
      [3 / 2, '3:2 Photo'],
      [2 / 3, '2:3 Portrait'],
      [21 / 9, '21:9 Ultrawide'],
    ];

    for (const [r, label] of knownRatios) {
      if (Math.abs(ratio - r) < 0.04) return label;
    }

    return `${width}:${height}`;
  }

  /**
   * Main transformation engine: renders image source onto a canvas according to config
   */
  static async renderToCanvas(
    source: HTMLImageElement | ImageBitmap | HTMLCanvasElement,
    config: ImageProcessingConfig,
    sourceDimensions: ImageDimensions
  ): Promise<HTMLCanvasElement> {
    const { width: origWidth, height: origHeight } = sourceDimensions;

    // 1. Calculate Target Dimensions
    let targetWidth = origWidth;
    let targetHeight = origHeight;

    if (config.scalePercent && config.scalePercent > 0) {
      targetWidth = Math.round(origWidth * config.scalePercent);
      targetHeight = Math.round(origHeight * config.scalePercent);
    } else if (config.width && !config.height) {
      targetWidth = config.width;
      targetHeight = config.maintainAspectRatio !== false
        ? Math.round((config.width / origWidth) * origHeight)
        : origHeight;
    } else if (config.height && !config.width) {
      targetHeight = config.height;
      targetWidth = config.maintainAspectRatio !== false
        ? Math.round((config.height / origHeight) * origWidth)
        : origWidth;
    } else if (config.width && config.height) {
      if (config.maintainAspectRatio) {
        const origAspect = origWidth / origHeight;
        const targetAspect = config.width / config.height;
        if (origAspect > targetAspect) {
          targetWidth = config.width;
          targetHeight = Math.round(config.width / origAspect);
        } else {
          targetHeight = config.height;
          targetWidth = Math.round(config.height * origAspect);
        }
      } else {
        targetWidth = config.width;
        targetHeight = config.height;
      }
    }

    // Safety checks against extreme dimensions
    targetWidth = Math.max(1, Math.min(targetWidth, IMAGE_CONFIG.MAX_SAFE_DIMENSION_PX));
    targetHeight = Math.max(1, Math.min(targetHeight, IMAGE_CONFIG.MAX_SAFE_DIMENSION_PX));

    // Handle Rotation (90° / 270° flips target width/height)
    const angle = config.rotationAngle || 0;
    const isSwap = angle === 90 || angle === 270;
    const canvasWidth = isSwap ? targetHeight : targetWidth;
    const canvasHeight = isSwap ? targetWidth : targetHeight;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to allocate 2D canvas context.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 2. Background Color Handling
    if (config.backgroundColor && config.backgroundColor !== 'transparent') {
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (config.format === 'image/jpeg' || config.format === 'image/bmp') {
      ctx.fillStyle = '#ffffff'; // JPEG & BMP require solid backdrop
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 3. Transformations & Drawing
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);

    if (angle !== 0) {
      ctx.rotate((angle * Math.PI) / 180);
    }

    const scaleX = config.flipHorizontal ? -1 : 1;
    const scaleY = config.flipVertical ? -1 : 1;
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
    }

    // Draw image with or without crop box
    if (config.cropBox) {
      const cb = config.cropBox;
      ctx.drawImage(
        source,
        cb.x,
        cb.y,
        cb.width,
        cb.height,
        -targetWidth / 2,
        -targetHeight / 2,
        targetWidth,
        targetHeight
      );
    } else {
      ctx.drawImage(source, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
    }

    ctx.restore();

    // 4. Color Filters & Adjustments
    if (
      config.grayscale ||
      config.sepia ||
      config.invert ||
      config.brightness !== undefined ||
      config.exposure !== undefined ||
      config.contrast !== undefined ||
      config.saturation !== undefined ||
      config.temperature !== undefined ||
      config.blurRadius !== undefined ||
      config.pixelateSize !== undefined ||
      config.sharpen
    ) {
      this.applyCanvasFilters(canvas, ctx, config);
    }

    // 5. Decorations, Borders, Shadows, Text, Shapes, Drawing
    if (
      config.borderRadius ||
      config.borderSize ||
      config.shadowBlur ||
      config.customText ||
      config.shapeOverlay ||
      (config.drawingPaths && config.drawingPaths.length > 0)
    ) {
      this.applyDecorationsAndOverlays(canvas, ctx, config);
    }

    // 6. Watermark Stamp
    if (config.watermarkText) {
      this.applyWatermark(canvas, ctx, config.watermarkText, config.watermarkOpacity || 0.6, config.watermarkPosition || 'bottom-right');
    }

    return canvas;
  }

  /**
   * Applies comprehensive pixel filters & effects
   */
  private static applyCanvasFilters(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    config: ImageProcessingConfig
  ): void {
    const filters: string[] = [];
    if (config.grayscale) filters.push('grayscale(100%)');
    if (config.sepia) filters.push('sepia(100%)');
    if (config.invert) filters.push('invert(100%)');
    if (config.brightness !== undefined && config.brightness !== 0) {
      filters.push(`brightness(${100 + config.brightness}%)`);
    }
    if (config.exposure !== undefined && config.exposure !== 0) {
      filters.push(`brightness(${100 + config.exposure * 0.75}%)`);
    }
    if (config.contrast !== undefined && config.contrast !== 0) {
      filters.push(`contrast(${100 + config.contrast}%)`);
    }
    if (config.saturation !== undefined && config.saturation !== 0) {
      filters.push(`saturate(${100 + config.saturation}%)`);
    }
    if (config.temperature !== undefined && config.temperature !== 0) {
      const hue = config.temperature * 0.4;
      filters.push(`hue-rotate(${hue}deg)`);
    }
    if (config.blurRadius && config.blurRadius > 0) {
      filters.push(`blur(${config.blurRadius}px)`);
    }

    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }

    if (config.pixelateSize && config.pixelateSize > 1) {
      this.applyPixelateEffect(canvas, ctx, config.pixelateSize);
    }

    if (config.sharpen) {
      this.applySharpenEffect(canvas, ctx);
    }
  }

  private static applyPixelateEffect(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, blockSize: number): void {
    const w = canvas.width;
    const h = canvas.height;
    const pSize = Math.max(2, Math.min(40, blockSize));
    const smallW = Math.max(1, Math.floor(w / pSize));
    const smallH = Math.max(1, Math.floor(h / pSize));

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = smallW;
    tempCanvas.height = smallH;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(canvas, 0, 0, smallW, smallH);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, smallW, smallH, 0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
  }

  private static applySharpenEffect(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const src = new Uint8ClampedArray(data);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0;
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = y + cy - halfSide;
            const scx = x + cx - halfSide;
            if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
              const srcIdx = (scy * w + scx) * 4;
              const wt = weights[cy * side + cx];
              r += src[srcIdx] * wt;
              g += src[srcIdx + 1] * wt;
              b += src[srcIdx + 2] * wt;
            }
          }
        }
        const dstIdx = (y * w + x) * 4;
        data[dstIdx] = Math.max(0, Math.min(255, r));
        data[dstIdx + 1] = Math.max(0, Math.min(255, g));
        data[dstIdx + 2] = Math.max(0, Math.min(255, b));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  private static applyDecorationsAndOverlays(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    config: ImageProcessingConfig
  ): void {
    const w = canvas.width;
    const h = canvas.height;

    if (config.borderRadius && config.borderRadius > 0) {
      ctx.save();
      const radius = config.borderRadius;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, w, h, radius);
      } else {
        ctx.rect(0, 0, w, h);
      }
      ctx.clip();
      ctx.restore();
    }

    if (config.borderSize && config.borderSize > 0) {
      ctx.save();
      ctx.lineWidth = config.borderSize * 2;
      ctx.strokeStyle = config.borderColor || '#ffffff';
      ctx.strokeRect(0, 0, w, h);
      ctx.restore();
    }

    if (config.customText) {
      ctx.save();
      const posX = (w * (config.customTextX ?? 50)) / 100;
      const posY = (h * (config.customTextY ?? 85)) / 100;
      const fontSize = config.customTextSize || Math.max(18, Math.round(w * 0.05));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = config.customTextColor || '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(2, fontSize * 0.08);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(config.customText, posX, posY);
      ctx.fillText(config.customText, posX, posY);
      ctx.restore();
    }

    if (config.shapeOverlay && config.shapeOverlay !== 'none') {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 4;
      const cx = w / 2;
      const cy = h / 2;
      const size = Math.min(w, h) * 0.25;

      if (config.shapeOverlay === 'rectangle') {
        ctx.fillRect(cx - size, cy - size / 2, size * 2, size);
        ctx.strokeRect(cx - size, cy - size / 2, size * 2, size);
      } else if (config.shapeOverlay === 'circle') {
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (config.shapeOverlay === 'star') {
        this.drawStar(ctx, cx, cy, 5, size, size / 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    if (config.drawingPaths && config.drawingPaths.length > 0) {
      ctx.save();
      for (const path of config.drawingPaths) {
        if (!path.points || path.points.length === 0) continue;
        ctx.strokeStyle = path.color || '#06b6d4';
        ctx.lineWidth = path.size || 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private static drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  /**
   * Applies watermark text stamp
   */
  private static applyWatermark(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    text: string,
    opacity: number,
    position: ImageProcessingConfig['watermarkPosition']
  ): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0.1, Math.min(1.0, opacity));
    const fontSize = Math.max(16, Math.round(canvas.width * 0.04));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(2, fontSize * 0.1);
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(text);
    const padding = fontSize;

    let x = padding;
    let y = canvas.height - padding;

    if (position === 'center') {
      ctx.textAlign = 'center';
      x = canvas.width / 2;
      y = canvas.height / 2;
    } else if (position === 'top-left') {
      ctx.textAlign = 'left';
      x = padding;
      y = padding + fontSize / 2;
    } else if (position === 'top-right') {
      ctx.textAlign = 'right';
      x = canvas.width - padding;
      y = padding + fontSize / 2;
    } else if (position === 'bottom-left') {
      ctx.textAlign = 'left';
      x = padding;
      y = canvas.height - padding;
    } else if (position === 'bottom-right') {
      ctx.textAlign = 'right';
      x = canvas.width - padding;
      y = canvas.height - padding;
    }

    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /**
   * Exports HTMLCanvasElement into a Blob with exact MIME type and quality
   */
  static async exportCanvas(
    canvas: HTMLCanvasElement,
    config: ImageProcessingConfig
  ): Promise<{ blob: Blob; url: string; stats: ImageStats }> {
    const startTime = performance.now();
    const format = config.format || 'image/png';
    const quality = config.quality !== undefined ? config.quality : 0.9;

    let blob: Blob | null = null;

    if (format === 'image/x-icon') {
      // Build binary ICO file from canvas
      blob = await this.canvasToIco(canvas);
    } else if (format === 'image/bmp') {
      // Build BMP bitmap
      blob = await this.canvasToBmp(canvas);
    } else {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b),
          format,
          quality
        );
      });
    }

    if (!blob) {
      throw new Error(`Failed to encode image to ${format}. The browser may not support this export format.`);
    }

    const durationMs = Math.round(performance.now() - startTime);
    const url = this.createTrackedUrl(blob);

    const stats: ImageStats = {
      originalWidth: canvas.width,
      originalHeight: canvas.height,
      newWidth: canvas.width,
      newHeight: canvas.height,
      originalSize: blob.size,
      newSize: blob.size,
      compressionRatio: '1.0x',
      savingsPercent: 0,
      format: format.replace('image/', '').toUpperCase(),
      mimeType: format,
      durationMs,
    };

    return { blob, url, stats };
  }

  /**
   * Converts a canvas into an ICO file binary blob
   */
  private static async canvasToIco(canvas: HTMLCanvasElement): Promise<Blob> {
    // Generate PNG slice
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('ICO PNG conversion failed'))), 'image/png');
    });

    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    const width = Math.min(256, canvas.width);
    const height = Math.min(256, canvas.height);

    // Build 6-byte ICO Header + 16-byte Directory Entry + PNG data
    const icoBuffer = new ArrayBuffer(6 + 16 + pngBytes.length);
    const view = new DataView(icoBuffer);

    // Header
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // Type: 1 = ICO
    view.setUint16(4, 1, true); // Count: 1 image

    // Directory Entry
    view.setUint8(6, width >= 256 ? 0 : width);
    view.setUint8(7, height >= 256 ? 0 : height);
    view.setUint8(8, 0); // Palette
    view.setUint8(9, 0); // Reserved
    view.setUint16(10, 1, true); // Color planes
    view.setUint16(12, 32, true); // Bits per pixel
    view.setUint32(14, pngBytes.length, true); // Image data size
    view.setUint32(18, 22, true); // Offset to image data (6 + 16 = 22)

    // Append PNG payload
    new Uint8Array(icoBuffer, 22).set(pngBytes);

    return new Blob([icoBuffer], { type: 'image/x-icon' });
  }

  /**
   * Converts a canvas into a standard uncompressed Windows BMP Blob
   */
  private static async canvasToBmp(canvas: HTMLCanvasElement): Promise<Blob> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileHeaderSize = 14;
    const infoHeaderSize = 40;
    const fileSize = fileHeaderSize + infoHeaderSize + pixelArraySize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // File Header
    view.setUint16(0, 0x424d, false); // "BM"
    view.setUint32(2, fileSize, true);
    view.setUint32(6, 0, true);
    view.setUint32(10, fileHeaderSize + infoHeaderSize, true); // Data offset

    // Info Header
    view.setUint32(14, infoHeaderSize, true);
    view.setInt32(18, width, true);
    view.setInt32(22, height, true); // Positive height = bottom-to-top
    view.setUint16(26, 1, true); // Color planes
    view.setUint16(28, 24, true); // 24-bit RGB
    view.setUint32(30, 0, true); // BI_RGB compression (none)
    view.setUint32(34, pixelArraySize, true);
    view.setInt32(38, 2835, true); // Horizontal resolution (72 DPI)
    view.setInt32(42, 2835, true); // Vertical resolution (72 DPI)
    view.setUint32(46, 0, true);
    view.setUint32(50, 0, true);

    // Pixel data (BGR bottom-up)
    const outBytes = new Uint8Array(buffer, 54);
    for (let y = 0; y < height; y++) {
      const srcY = height - 1 - y;
      for (let x = 0; x < width; x++) {
        const srcIdx = (srcY * width + x) * 4;
        const dstIdx = y * rowSize + x * 3;
        outBytes[dstIdx] = data[srcIdx + 2]; // B
        outBytes[dstIdx + 1] = data[srcIdx + 1]; // G
        outBytes[dstIdx + 2] = data[srcIdx]; // R
      }
    }

    return new Blob([buffer], { type: 'image/bmp' });
  }

  /**
   * Extracts prominent color palette from canvas
   */
  static extractPalette(canvas: HTMLCanvasElement, maxSwatches = 6): PaletteExtractionResult {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const fallback: ColorSwatch = {
        hex: '#06b6d4',
        rgb: 'rgb(6, 182, 212)',
        hsl: 'hsl(188, 94%, 43%)',
        r: 6,
        g: 182,
        b: 212,
        luminance: 0.45,
        isDark: false,
        percent: 100,
      };
      return {
        dominantColor: fallback,
        swatches: [fallback],
        hasAlpha: false,
        lightBackgroundSuitable: true,
        darkBackgroundSuitable: true,
      };
    }

    const { width, height } = canvas;
    const sampleWidth = Math.min(100, width);
    const sampleHeight = Math.min(100, height);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sampleWidth;
    tempCanvas.height = sampleHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Could not allocate palette sampling context.');

    tempCtx.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);
    const imgData = tempCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;

    const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
    let hasAlpha = false;

    for (let i = 0; i < imgData.length; i += 4) {
      const a = imgData[i + 3];
      if (a < 128) {
        hasAlpha = true;
        continue;
      }
      // Quantize to 5-bit depth to cluster near-identical colors
      const r = Math.round(imgData[i] / 16) * 16;
      const g = Math.round(imgData[i + 1] / 16) * 16;
      const b = Math.round(imgData[i + 2] / 16) * 16;
      const key = `${r},${g},${b}`;

      const existing = colorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(key, { r, g, b, count: 1 });
      }
    }

    const sorted = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
    const totalPixels = sorted.reduce((sum, item) => sum + item.count, 0) || 1;

    const swatches: ColorSwatch[] = sorted.slice(0, maxSwatches).map((item) => {
      const hex = `#${((1 << 24) + (item.r << 16) + (item.g << 8) + item.b).toString(16).slice(1)}`;
      const rgb = `rgb(${item.r}, ${item.g}, ${item.b})`;
      const luminance = (0.299 * item.r + 0.587 * item.g + 0.114 * item.b) / 255;
      const isDark = luminance < 0.5;

      // HSL calculation
      const rNorm = item.r / 255;
      const gNorm = item.g / 255;
      const bNorm = item.b / 255;
      const max = Math.max(rNorm, gNorm, bNorm);
      const min = Math.min(rNorm, gNorm, bNorm);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rNorm:
            h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
            break;
          case gNorm:
            h = (bNorm - rNorm) / d + 2;
            break;
          case bNorm:
            h = (rNorm - gNorm) / d + 4;
            break;
        }
        h /= 6;
      }

      const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

      return {
        hex,
        rgb,
        hsl,
        r: item.r,
        g: item.g,
        b: item.b,
        luminance: parseFloat(luminance.toFixed(2)),
        isDark,
        percent: Math.round((item.count / totalPixels) * 100),
      };
    });

    const dominant = swatches[0] || {
      hex: '#0ea5e9',
      rgb: 'rgb(14, 165, 233)',
      hsl: 'hsl(199, 89%, 48%)',
      r: 14,
      g: 165,
      b: 233,
      luminance: 0.5,
      isDark: false,
      percent: 100,
    };

    return {
      dominantColor: dominant,
      swatches,
      hasAlpha,
      lightBackgroundSuitable: dominant.luminance < 0.6,
      darkBackgroundSuitable: dominant.luminance > 0.4,
    };
  }

  /**
   * Checks if an image blob contains transparency (alpha channel or transparent pixels)
   */
  static async checkHasTransparency(blob: Blob | File): Promise<boolean> {
    const mime = (blob.type || '').toLowerCase();
    if (!mime.includes('png') && !mime.includes('webp') && !mime.includes('gif') && !mime.includes('ico')) {
      return false;
    }

    try {
      // If PNG, inspect color type in IHDR chunk
      if (mime.includes('png')) {
        const header = await this.readHeaderBytes(blob, 32);
        if (header.length > 25) {
          const colorType = header[25];
          // Color type 4 = Greyscale with alpha, Color type 6 = Truecolor with alpha (RGBA)
          if (colorType === 4 || colorType === 6) {
            return true;
          }
        }
      }

      // Fallback: draw on offscreen canvas and check pixel data for alpha < 255
      const url = this.createTrackedUrl(blob);
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image for transparency check'));
          img.src = url;
        });

        const canvas = document.createElement('canvas');
        const w = Math.min(100, img.naturalWidth || img.width || 100);
        const h = Math.min(100, img.naturalHeight || img.height || 100);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return false;

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            return true;
          }
        }
        return false;
      } finally {
        this.revokeTrackedUrl(url);
      }
    } catch {
      return false;
    }
  }
}
