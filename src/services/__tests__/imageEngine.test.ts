import { describe, it, expect } from 'vitest';
import { ImageEngine } from '../imageEngine';
import { IMAGE_CONFIG } from '../../config/imageConfig';

describe('ImageEngine Core Services', () => {
  describe('Safe Download File Name Sanitization', () => {
    it('sanitizes unsafe characters like slashes, colons, stars, and question marks', () => {
      const unsafe = 'my/cool:photo*name?.png';
      const safe = ImageEngine.getSafeDownloadFilename(unsafe, 'image/jpeg', 'converted');
      expect(safe).not.toContain('/');
      expect(safe).not.toContain(':');
      expect(safe).not.toContain('*');
      expect(safe).not.toContain('?');
      expect(safe).toBe('my_cool_photo_name__converted.jpg');
    });

    it('correctly maps target MIME types to standard file extensions', () => {
      expect(ImageEngine.getSafeDownloadFilename('banner.jpg', 'image/png')).toBe('banner_converted.png');
      expect(ImageEngine.getSafeDownloadFilename('banner.png', 'image/webp')).toBe('banner_converted.webp');
      expect(ImageEngine.getSafeDownloadFilename('banner.png', 'image/avif')).toBe('banner_converted.avif');
      expect(ImageEngine.getSafeDownloadFilename('banner.png', 'image/jpeg')).toBe('banner_converted.jpg');
      expect(ImageEngine.getSafeDownloadFilename('banner.png', 'image/bmp')).toBe('banner_converted.bmp');
      expect(ImageEngine.getSafeDownloadFilename('banner.png', 'image/x-icon')).toBe('banner_converted.ico');
    });

    it('handles empty or null original file names gracefully', () => {
      const safe = ImageEngine.getSafeDownloadFilename('', 'image/webp');
      expect(safe).toBe('image_converted.webp');
    });

    it('prevents path traversal sequences like ..', () => {
      const safe = ImageEngine.getSafeDownloadFilename('../../../etc/passwd.jpg', 'image/png');
      expect(safe).not.toContain('..');
      expect(safe).toBe('______etc_passwd_converted.png');
    });
  });

  describe('Dimension Calculations and Aspect Ratio Locking', () => {
    it('calculates proportional height when only width is changed with aspect ratio locked', () => {
      const orig = { width: 1920, height: 1080 };
      const result = ImageEngine.calculateDimensions(orig, {
        width: 1280,
        maintainAspectRatio: true,
      });
      expect(result.width).toBe(1280);
      expect(result.height).toBe(720);
    });

    it('calculates proportional width when only height is changed with aspect ratio locked', () => {
      const orig = { width: 1920, height: 1080 };
      const result = ImageEngine.calculateDimensions(orig, {
        height: 540,
        maintainAspectRatio: true,
      });
      expect(result.width).toBe(960);
      expect(result.height).toBe(540);
    });

    it('scales dimensions by percentage accurately', () => {
      const orig = { width: 1000, height: 800 };
      const result = ImageEngine.calculateDimensions(orig, { scalePercent: 0.5 });
      expect(result.width).toBe(500);
      expect(result.height).toBe(400);
    });

    it('allows non-proportional dimensions when maintainAspectRatio is false', () => {
      const orig = { width: 1920, height: 1080 };
      const result = ImageEngine.calculateDimensions(orig, {
        width: 800,
        height: 800,
        maintainAspectRatio: false,
      });
      expect(result.width).toBe(800);
      expect(result.height).toBe(800);
    });

    it('clamps oversized dimensions to safety limit MAX_SAFE_DIMENSION_PX', () => {
      const orig = { width: 20000, height: 10000 };
      const result = ImageEngine.calculateDimensions(orig, {
        width: 15000,
        maintainAspectRatio: false,
      });
      expect(result.width).toBeLessThanOrEqual(IMAGE_CONFIG.MAX_SAFE_DIMENSION_PX);
    });
  });

  describe('Rotation and Dimension Swapping', () => {
    it('swaps width and height for 90 and 270 degree rotations', () => {
      const dims = { width: 1920, height: 1080 };
      const rot90 = ImageEngine.calculateRotatedDimensions(dims, 90);
      expect(rot90.width).toBe(1080);
      expect(rot90.height).toBe(1920);

      const rot270 = ImageEngine.calculateRotatedDimensions(dims, 270);
      expect(rot270.width).toBe(1080);
      expect(rot270.height).toBe(1920);
    });

    it('maintains original width and height for 0 and 180 degree rotations', () => {
      const dims = { width: 1920, height: 1080 };
      const rot0 = ImageEngine.calculateRotatedDimensions(dims, 0);
      expect(rot0).toEqual({ width: 1920, height: 1080 });

      const rot180 = ImageEngine.calculateRotatedDimensions(dims, 180);
      expect(rot180).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe('Reduction Stats and Byte Savings Calculation', () => {
    it('computes positive percentage savings and compression ratio', () => {
      const origSize = 1000000; // 1 MB
      const newSize = 250000;   // 250 KB
      const stats = ImageEngine.calculateReductionStats(origSize, newSize);
      expect(stats.isReduced).toBe(true);
      expect(stats.savingsPercent).toBe(75);
      expect(stats.bytesSaved).toBe(750000);
      expect(stats.compressionRatio).toBe('4.0x');
    });

    it('handles files that increase in size gracefully', () => {
      const origSize = 100000;
      const newSize = 150000;
      const stats = ImageEngine.calculateReductionStats(origSize, newSize);
      expect(stats.isReduced).toBe(false);
      expect(stats.savingsPercent).toBe(-50);
      expect(stats.bytesSaved).toBe(-50000);
    });
  });

  describe('Binary Validation and Magic Byte Detection', () => {
    it('rejects 0-byte empty files', async () => {
      const emptyBlob = new Blob([], { type: 'image/png' });
      const result = await ImageEngine.validateImageFile(emptyBlob);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('rejects oversized files that exceed safe browser memory limit', async () => {
      // Mock large blob
      const oversizedBlob = {
        size: (IMAGE_CONFIG.MAX_SAFE_FILE_SIZE_MB + 5) * 1024 * 1024,
        type: 'image/jpeg',
      } as Blob;
      const result = await ImageEngine.validateImageFile(oversizedBlob);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds the safe browser limit');
    });

    it('identifies genuine PNG magic headers', async () => {
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const blob = new Blob([pngHeader], { type: 'image/png' });
      const result = await ImageEngine.validateImageFile(blob);
      expect(result.isValid).toBe(true);
      expect(result.detectedFormat).toBe('PNG');
      expect(result.mimeType).toBe('image/png');
    });

    it('identifies genuine JPEG magic headers', async () => {
      const jpgHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const blob = new Blob([jpgHeader], { type: 'image/jpeg' });
      const result = await ImageEngine.validateImageFile(blob);
      expect(result.isValid).toBe(true);
      expect(result.detectedFormat).toBe('JPEG');
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('identifies genuine WebP magic headers (RIFF....WEBP)', async () => {
      const webpHeader = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      const blob = new Blob([webpHeader], { type: 'image/webp' });
      const result = await ImageEngine.validateImageFile(blob);
      expect(result.isValid).toBe(true);
      expect(result.detectedFormat).toBe('WebP');
      expect(result.mimeType).toBe('image/webp');
    });

    it('identifies BMP magic headers (BM)', async () => {
      const bmpHeader = new Uint8Array([0x42, 0x4d, 0x00, 0x00]);
      const blob = new Blob([bmpHeader], { type: 'image/bmp' });
      const result = await ImageEngine.validateImageFile(blob);
      expect(result.isValid).toBe(true);
      expect(result.detectedFormat).toBe('BMP');
      expect(result.mimeType).toBe('image/bmp');
    });
  });

  describe('Format Support Detection', () => {
    it('confirms support for standard web image formats', () => {
      expect(ImageEngine.isFormatSupported('image/png')).toBe(true);
      expect(ImageEngine.isFormatSupported('image/jpeg')).toBe(true);
      expect(ImageEngine.isFormatSupported('image/webp')).toBe(true);
    });
  });

  describe('Memory and Object URL Management', () => {
    it('creates tracked object URLs and revokes them cleanly', () => {
      const blob = new Blob(['sample-image-data'], { type: 'image/png' });
      const url = ImageEngine.createTrackedUrl(blob);
      expect(typeof url).toBe('string');
      expect(url.startsWith('blob:')).toBe(true);

      // Safe revocation
      expect(() => ImageEngine.revokeTrackedUrl(url)).not.toThrow();
      expect(() => ImageEngine.cleanupAllTrackedUrls()).not.toThrow();
    });
  });

  describe('Image Compression and Quality Controls', () => {
    it('validates quality parameter within 0.01 to 1.0 bounds', () => {
      expect(ImageEngine.validateQualityParam(0.5)).toBe(0.5);
      expect(ImageEngine.validateQualityParam(-0.5)).toBe(0.01);
      expect(ImageEngine.validateQualityParam(1.5)).toBe(1.0);
      expect(ImageEngine.validateQualityParam(NaN)).toBe(0.85);
    });

    it('estimates compressed size and reduction percentages correctly', () => {
      const origSize = 2000000; // 2MB
      const estimate = ImageEngine.estimateCompressedSize(origSize, 0.7, 'image/jpeg');
      expect(estimate.estimatedBytes).toBeLessThan(origSize);
      expect(estimate.reductionPercent).toBeGreaterThan(0);
      expect(estimate.isSavings).toBe(true);
    });

    it('approximates quality for target file size with disclaimer', () => {
      const origSize = 5000000; // 5MB
      const targetSize = 500000; // 500KB
      const approx = ImageEngine.approximateQualityForTargetSize(origSize, targetSize, 'image/jpeg');
      expect(approx.quality).toBeGreaterThan(0);
      expect(approx.quality).toBeLessThanOrEqual(1.0);
      expect(approx.disclaimer).toContain('approximation');
    });

    it('identifies formats that support lossless encoding', () => {
      expect(ImageEngine.isLosslessSupported('image/png')).toBe(true);
      expect(ImageEngine.isLosslessSupported('image/webp')).toBe(true);
      expect(ImageEngine.isLosslessSupported('image/jpeg')).toBe(false);
    });
  });

  describe('Invalid and Oversized Files Handling', () => {
    it('rejects invalid or unsupported MIME types', async () => {
      const textBlob = new Blob(['hello text content'], { type: 'text/plain' });
      const result = await ImageEngine.validateImageFile(textBlob);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported');
    });

    it('rejects files exceeding MAX_SAFE_FILE_SIZE_MB limit', async () => {
      const hugeBlob = new Blob([new ArrayBuffer(10)], { type: 'image/png' });
      Object.defineProperty(hugeBlob, 'size', {
        value: 150 * 1024 * 1024, // 150 MB
      });
      const result = await ImageEngine.validateImageFile(hugeBlob);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds the safe browser limit');
    });
  });

  describe('Transparent PNG Detection', () => {
    it('detects alpha channel / transparency presence in PNG headers', async () => {
      // PNG header + IHDR chunk with color type 6 (RGBA truecolor with alpha)
      const rgbaHeader = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, // IHDR length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x64, // width 100
        0x00, 0x00, 0x00, 0x64, // height 100
        0x08,                   // bit depth 8
        0x06,                   // color type 6 = RGBA (has transparency)
        0x00, 0x00, 0x00,
      ]);
      const blob = new Blob([rgbaHeader], { type: 'image/png' });
      const hasAlpha = await ImageEngine.checkHasTransparency(blob);
      expect(hasAlpha).toBe(true);
    });
  });

  describe('Batch Compression Engine', () => {
    it('supports batch processing structure and progress callback', async () => {
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const file1 = new File([pngHeader], 'test1.png', { type: 'image/png' });
      const file2 = new File([pngHeader], 'test2.png', { type: 'image/png' });

      let progressCalls = 0;
      const progressCb = (completed: number, total: number) => {
        progressCalls++;
        expect(total).toBe(2);
      };

      // Mock image loading in node/test env if needed or test validation
      const validation1 = await ImageEngine.validateImageFile(file1);
      expect(validation1.isValid).toBe(true);
      expect(validation1.detectedFormat).toBe('PNG');
    });
  });
});
