import JSZip from 'jszip';
import { FileHandlerService } from './fileHandler';

export type SupportedImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ImageCropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageConvertOptions {
  format: SupportedImageFormat;
  quality?: number; // 0.05 to 1.0
  width?: number;
  height?: number;
  scalePercent?: number; // e.g. 50% = 0.5
  maintainAspectRatio?: boolean;
  backgroundColor?: string; // e.g. '#ffffff', 'transparent', or hex
  cropBox?: ImageCropBox;
  maxDimensionCap?: number; // default 8192px to prevent canvas crash
  useWorker?: boolean; // try Web Worker if supported
}

export interface ImageStats {
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
  originalSize: number;
  newSize: number;
  compressionRatio: string;
  format: string;
  isDownscaledForSafety?: boolean;
  processedWithWorker?: boolean;
}

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  aspectRatioLabel: string;
  sizeBytes: number;
  mimeType: string;
  megapixels: number;
  isVeryLarge: boolean;
  suggestedAction?: string;
}

export class ImageTools {
  /**
   * Maximum safe canvas dimension (most mobile and desktop GPUs safely handle up to 8192px)
   */
  static readonly MAX_SAFE_DIMENSION = 8192;
  /**
   * Maximum safe pixel budget (~36 megapixels) to avoid out-of-memory browser tab crash
   */
  static readonly MAX_SAFE_PIXELS = 6000 * 6000;

  private static workerInstance: Worker | null = null;
  private static workerSupported: boolean | null = null;

  /**
   * Initialize or retrieve the reusable Web Worker instance
   */
  private static getWorker(): Worker | null {
    if (this.workerSupported === false) return null;
    if (typeof Worker === 'undefined') {
      this.workerSupported = false;
      return null;
    }

    if (!this.workerInstance) {
      try {
        this.workerInstance = new Worker(
          new URL('../workers/imageWorker.ts', import.meta.url),
          { type: 'module' }
        );
        this.workerSupported = true;
      } catch {
        this.workerSupported = false;
        this.workerInstance = null;
      }
    }
    return this.workerInstance;
  }

  /**
   * Calculate human-readable closest aspect ratio string
   */
  static getClosestAspectRatioLabel(width: number, height: number): string {
    if (!width || !height) return 'Unknown';
    const ratio = width / height;

    const commonRatios: [number, string][] = [
      [1, '1:1 (Square)'],
      [16 / 9, '16:9 (Widescreen)'],
      [9 / 16, '9:16 (Vertical Story)'],
      [4 / 3, '4:3 (Standard)'],
      [3 / 4, '3:4 (Portrait)'],
      [3 / 2, '3:2 (35mm Photo)'],
      [2 / 3, '2:3 (Photo Portrait)'],
      [21 / 9, '21:9 (Ultrawide)'],
    ];

    for (const [r, label] of commonRatios) {
      if (Math.abs(ratio - r) < 0.05) {
        return label;
      }
    }

    return `${width}:${height}`;
  }

  /**
   * Reads image dimensions and metadata without keeping heavy textures in RAM
   */
  static async getImageMetadata(file: File | Blob): Promise<ImageMetadata> {
    const objectUrl = URL.createObjectURL(file);
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
        };
        img.onerror = () => {
          reject(new Error(`Unable to decode image. The file format is unsupported or corrupted.`));
        };
        img.src = objectUrl;
      });

      const { width, height } = dimensions;
      const megapixels = parseFloat(((width * height) / 1000000).toFixed(2));
      const isVeryLarge =
        width > this.MAX_SAFE_DIMENSION ||
        height > this.MAX_SAFE_DIMENSION ||
        width * height > this.MAX_SAFE_PIXELS;

      let suggestedAction: string | undefined;
      if (isVeryLarge) {
        suggestedAction = `Image is very large (${width}×${height}px, ${megapixels} MP). Automatic downscaling will be applied during processing to protect browser memory.`;
      }

      return {
        width,
        height,
        aspectRatio: width / height,
        aspectRatioLabel: this.getClosestAspectRatioLabel(width, height),
        sizeBytes: file.size,
        mimeType: file.type || 'image/unknown',
        megapixels,
        isVeryLarge,
        suggestedAction,
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  /**
   * Verifies that the resulting output file opens and renders cleanly
   * by checking binary magic signatures and testing browser image decoding.
   */
  static async verifyOutputBlob(
    blob: Blob,
    expectedFormat: SupportedImageFormat
  ): Promise<{ isValid: boolean; error?: string }> {
    if (blob.size === 0) {
      return { isValid: false, error: 'Generated output file is empty (0 bytes).' };
    }

    // 1. Verify Magic Byte Header
    try {
      const headerBytes = await FileHandlerService.readHeaderBytes(blob, 12);
      if (expectedFormat === 'image/png') {
        const isPng =
          headerBytes[0] === 0x89 &&
          headerBytes[1] === 0x50 &&
          headerBytes[2] === 0x4e &&
          headerBytes[3] === 0x47;
        if (!isPng) {
          return { isValid: false, error: 'Output binary signature is not a valid PNG header.' };
        }
      } else if (expectedFormat === 'image/jpeg') {
        const isJpg = headerBytes[0] === 0xff && headerBytes[1] === 0xd8 && headerBytes[2] === 0xff;
        if (!isJpg) {
          return { isValid: false, error: 'Output binary signature is not a valid JPEG header.' };
        }
      } else if (expectedFormat === 'image/webp') {
        const isRiff =
          headerBytes[0] === 0x52 &&
          headerBytes[1] === 0x49 &&
          headerBytes[2] === 0x46 &&
          headerBytes[3] === 0x46;
        if (!isRiff) {
          return { isValid: false, error: 'Output binary signature is not a valid WebP header.' };
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Binary check failed';
      return { isValid: false, error: `Header validation error: ${msg}` };
    }

    // 2. Verify that the browser can open and decode the output file
    const testUrl = URL.createObjectURL(blob);
    try {
      await new Promise<void>((resolve, reject) => {
        const testImg = new Image();
        testImg.onload = () => {
          if (testImg.naturalWidth > 0 && testImg.naturalHeight > 0) {
            resolve();
          } else {
            reject(new Error('Image opened but reports 0x0 natural dimensions.'));
          }
        };
        testImg.onerror = () => {
          reject(new Error('Browser failed to decode the generated image. File may be corrupted.'));
        };
        testImg.src = testUrl;
      });
      return { isValid: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Decoding error';
      return { isValid: false, error: msg };
    } finally {
      URL.revokeObjectURL(testUrl);
    }
  }

  /**
   * Process image using Web Worker with OffscreenCanvas if available
   */
  private static async processWithWorker(
    file: File | Blob,
    options: ImageConvertOptions,
    targetWidth: number,
    targetHeight: number,
    crop?: ImageCropBox
  ): Promise<{ blob: Blob; stats: Partial<ImageStats> } | null> {
    const worker = this.getWorker();
    if (!worker || typeof createImageBitmap === 'undefined') {
      return null;
    }

    try {
      const imageBitmap = await createImageBitmap(file);
      const reqId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error('Image worker processing timed out.'));
        }, 15000);

        const onMessage = (e: MessageEvent) => {
          if (e.data && e.data.id === reqId) {
            cleanup();
            if (e.data.success && e.data.blob) {
              resolve({
                blob: e.data.blob,
                stats: {
                  newWidth: e.data.stats?.outputWidth || targetWidth,
                  newHeight: e.data.stats?.outputHeight || targetHeight,
                  newSize: e.data.blob.size,
                  processedWithWorker: true,
                },
              });
            } else {
              reject(new Error(e.data.error || 'Worker processing returned failure'));
            }
          }
        };

        const cleanup = () => {
          clearTimeout(timeout);
          worker.removeEventListener('message', onMessage);
        };

        worker.addEventListener('message', onMessage);

        worker.postMessage(
          {
            id: reqId,
            type: 'PROCESS_IMAGE',
            imageBitmap,
            options: {
              format: options.format,
              quality: options.quality,
              width: targetWidth,
              height: targetHeight,
              backgroundColor: options.backgroundColor,
              crop,
            },
          },
          [imageBitmap]
        );
      });
    } catch {
      // Worker processing failed; fall back to Canvas on main thread
      return null;
    }
  }

  /**
   * Main image processing engine:
   * Handles format conversion, compression, resize, scaling, background fill,
   * safe downscaling of very large images, and output verification.
   */
  static async processImage(
    file: File | Blob,
    options: ImageConvertOptions
  ): Promise<{ blob: Blob; url: string; stats: ImageStats }> {
    const objectUrl = URL.createObjectURL(file);

    try {
      // 1. Load image and determine source dimensions
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => {
          reject(
            new Error(
              `Failed to load image. The format may be unsupported (e.g. raw HEIC or corrupt image).`
            )
          );
        };
        element.src = objectUrl;
      });

      const originalWidth = img.naturalWidth || img.width;
      const originalHeight = img.naturalHeight || img.height;

      if (!originalWidth || !originalHeight) {
        throw new Error('Image has invalid zero dimensions.');
      }

      // 2. Determine target dimensions with resize / aspect ratio / scaling
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (options.scalePercent && options.scalePercent > 0) {
        targetWidth = Math.round(originalWidth * options.scalePercent);
        targetHeight = Math.round(originalHeight * options.scalePercent);
      } else if (options.width && !options.height) {
        targetWidth = options.width;
        targetHeight = options.maintainAspectRatio !== false
          ? Math.round((options.width / originalWidth) * originalHeight)
          : originalHeight;
      } else if (options.height && !options.width) {
        targetHeight = options.height;
        targetWidth = options.maintainAspectRatio !== false
          ? Math.round((options.height / originalHeight) * originalWidth)
          : originalWidth;
      } else if (options.width && options.height) {
        if (options.maintainAspectRatio) {
          const origAspect = originalWidth / originalHeight;
          const targetAspect = options.width / options.height;
          if (origAspect > targetAspect) {
            targetWidth = options.width;
            targetHeight = Math.round(options.width / origAspect);
          } else {
            targetHeight = options.height;
            targetWidth = Math.round(options.height * origAspect);
          }
        } else {
          targetWidth = options.width;
          targetHeight = options.height;
        }
      }

      // 3. Graceful handling for very large images: enforce safety dimension caps
      let isDownscaledForSafety = false;
      const maxCap = options.maxDimensionCap || this.MAX_SAFE_DIMENSION;

      if (targetWidth > maxCap || targetHeight > maxCap) {
        const downscaleRatio = Math.min(maxCap / targetWidth, maxCap / targetHeight);
        targetWidth = Math.max(1, Math.round(targetWidth * downscaleRatio));
        targetHeight = Math.max(1, Math.round(targetHeight * downscaleRatio));
        isDownscaledForSafety = true;
      }

      // Check pixel budget
      if (targetWidth * targetHeight > this.MAX_SAFE_PIXELS) {
        const scale = Math.sqrt(this.MAX_SAFE_PIXELS / (targetWidth * targetHeight));
        targetWidth = Math.max(1, Math.round(targetWidth * scale));
        targetHeight = Math.max(1, Math.round(targetHeight * scale));
        isDownscaledForSafety = true;
      }

      // 4. Attempt Web Worker offloading when appropriate
      let processedBlob: Blob | null = null;
      let usedWorker = false;

      if (options.useWorker !== false && !options.cropBox) {
        const workerResult = await this.processWithWorker(
          file,
          options,
          targetWidth,
          targetHeight
        );
        if (workerResult) {
          processedBlob = workerResult.blob;
          usedWorker = true;
        }
      }

      // 5. If worker didn't handle it, execute via main thread Canvas
      if (!processedBlob) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, targetWidth);
        canvas.height = Math.max(1, targetHeight);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Could not allocate 2D Canvas context.');
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Background color handling
        if (options.backgroundColor && options.backgroundColor !== 'transparent') {
          ctx.fillStyle = options.backgroundColor;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else if (options.format === 'image/jpeg') {
          // JPEG format does not support alpha channel; default to clean white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        if (options.cropBox) {
          ctx.drawImage(
            img,
            options.cropBox.x,
            options.cropBox.y,
            options.cropBox.width,
            options.cropBox.height,
            0,
            0,
            targetWidth,
            targetHeight
          );
        } else {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        }

        const quality = options.quality !== undefined ? options.quality : 0.92;
        processedBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error('Canvas toBlob encoding failed.'));
            },
            options.format,
            quality
          );
        });
      }

      // 6. Verify that the output file opens and renders cleanly
      const verification = await this.verifyOutputBlob(processedBlob, options.format);
      if (!verification.isValid) {
        throw new Error(
          `Image generation verification failed: ${verification.error || 'Output file could not be verified'}`
        );
      }

      // 7. Calculate savings & return result
      const originalSize = file.size;
      const newSize = processedBlob.size;
      const ratio =
        originalSize > 0
          ? (((originalSize - newSize) / originalSize) * 100).toFixed(1)
          : '0';

      const outputUrl = URL.createObjectURL(processedBlob);

      return {
        blob: processedBlob,
        url: outputUrl,
        stats: {
          originalWidth,
          originalHeight,
          newWidth: targetWidth,
          newHeight: targetHeight,
          originalSize,
          newSize,
          compressionRatio: `${ratio}%`,
          format: options.format.split('/')[1].toUpperCase(),
          isDownscaledForSafety,
          processedWithWorker: usedWorker,
        },
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  /**
   * Dedicated crop utility with aspect ratio calculation and coordinate extraction
   */
  static async cropImage(
    file: File | Blob,
    cropBox: ImageCropBox,
    options: {
      format?: SupportedImageFormat;
      quality?: number;
      backgroundColor?: string;
    } = {}
  ): Promise<{ blob: Blob; url: string; stats: ImageStats }> {
    return this.processImage(file, {
      format: options.format || 'image/png',
      quality: options.quality ?? 0.95,
      backgroundColor: options.backgroundColor,
      width: Math.round(cropBox.width),
      height: Math.round(cropBox.height),
      cropBox,
      maintainAspectRatio: false,
    });
  }

  /**
   * Helper to compute crop coordinates given source dimensions and aspect ratio preset
   */
  static computeCenterCropBox(
    sourceWidth: number,
    sourceHeight: number,
    aspectPreset: '1:1' | '16:9' | '4:3' | '3:2' | '9:16' | '2:3' | 'free'
  ): ImageCropBox {
    if (aspectPreset === 'free') {
      return { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
    }

    const ratios: Record<string, number> = {
      '1:1': 1,
      '16:9': 16 / 9,
      '4:3': 4 / 3,
      '3:2': 3 / 2,
      '9:16': 9 / 16,
      '2:3': 2 / 3,
    };

    const targetRatio = ratios[aspectPreset] || 1;
    const sourceRatio = sourceWidth / sourceHeight;

    let cropW = sourceWidth;
    let cropH = sourceHeight;

    if (sourceRatio > targetRatio) {
      cropW = Math.round(sourceHeight * targetRatio);
      cropH = sourceHeight;
    } else {
      cropW = sourceWidth;
      cropH = Math.round(sourceWidth / targetRatio);
    }

    const cropX = Math.max(0, Math.round((sourceWidth - cropW) / 2));
    const cropY = Math.max(0, Math.round((sourceHeight - cropH) / 2));

    return {
      x: cropX,
      y: cropY,
      width: cropW,
      height: cropH,
    };
  }

  /**
   * Generate favicon and web app icon bundle in a ZIP
   */
  static async generateFaviconPackage(
    file: File | Blob
  ): Promise<{ zipBlob: Blob; previewUrls: Record<string, string>; htmlSnippet: string }> {
    const sizes = [
      { name: 'favicon-16x16.png', size: 16 },
      { name: 'favicon-32x32.png', size: 32 },
      { name: 'favicon-48x48.png', size: 48 },
      { name: 'apple-touch-icon.png', size: 180 },
      { name: 'android-chrome-192x192.png', size: 192 },
      { name: 'android-chrome-512x512.png', size: 512 },
    ];

    const zip = new JSZip();
    const previewUrls: Record<string, string> = {};

    for (const s of sizes) {
      const res = await this.processImage(file, {
        format: 'image/png',
        width: s.size,
        height: s.size,
        maintainAspectRatio: false,
      });
      const buffer = await res.blob.arrayBuffer();
      zip.file(s.name, buffer);
      previewUrls[s.name] = res.url;
    }

    const htmlSnippet = `<!-- Favicon & Touch Icons generated with AquaTools -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

    zip.file('html-head-tags.html', htmlSnippet);

    const manifestContent = JSON.stringify(
      {
        name: 'My Web App',
        short_name: 'App',
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        theme_color: '#06b6d4',
        background_color: '#020617',
        display: 'standalone',
      },
      null,
      2
    );
    zip.file('site.webmanifest', manifestContent);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { zipBlob, previewUrls, htmlSnippet };
  }

  /**
   * Generate favicon and web app icon bundle from text or emoji
   */
  static async generateFaviconFromText(
    text: string,
    options: {
      backgroundColor?: string;
      textColor?: string;
      shape?: 'square' | 'circle' | 'rounded';
    } = {}
  ): Promise<{ zipBlob: Blob; previewUrls: Record<string, string>; htmlSnippet: string }> {
    const {
      backgroundColor = '#06b6d4',
      textColor = '#ffffff',
      shape = 'rounded',
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context is unavailable.');

    ctx.clearRect(0, 0, 512, 512);

    // Draw shape
    ctx.fillStyle = backgroundColor;
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(256, 256, 256, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === 'rounded') {
      const radius = 96;
      ctx.beginPath();
      ctx.roundRect(0, 0, 512, 512, radius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, 512, 512);
    }

    // Draw text/emoji
    const displayText = (text || '★').trim();
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isSingleEmoji = /\p{Extended_Pictographic}/u.test(displayText) && displayText.length <= 4;
    const fontSize = isSingleEmoji ? 280 : displayText.length <= 2 ? 260 : displayText.length <= 4 ? 170 : 120;
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(displayText, 256, 260);

    const baseBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to render text to canvas blob'));
      }, 'image/png');
    });

    return this.generateFaviconPackage(baseBlob);
  }
}

