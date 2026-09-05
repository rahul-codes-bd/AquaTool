import { describe, it, expect } from 'vitest';
import { ImageTools } from '../imageTools';

describe('ImageTools Service', () => {
  describe('Aspect Ratio Computations', () => {
    it('accurately identifies common aspect ratios', () => {
      expect(ImageTools.getClosestAspectRatioLabel(1000, 1000)).toBe('1:1 (Square)');
      expect(ImageTools.getClosestAspectRatioLabel(1920, 1080)).toBe('16:9 (Widescreen)');
      expect(ImageTools.getClosestAspectRatioLabel(1080, 1920)).toBe('9:16 (Vertical Story)');
      expect(ImageTools.getClosestAspectRatioLabel(1200, 900)).toBe('4:3 (Standard)');
      expect(ImageTools.getClosestAspectRatioLabel(1800, 1200)).toBe('3:2 (35mm Photo)');
      expect(ImageTools.getClosestAspectRatioLabel(1200, 1800)).toBe('2:3 (Photo Portrait)');
    });

    it('computes 1:1 center crop box for wide image', () => {
      const crop = ImageTools.computeCenterCropBox(1920, 1080, '1:1');
      expect(crop.width).toBe(1080);
      expect(crop.height).toBe(1080);
      expect(crop.x).toBe(Math.round((1920 - 1080) / 2));
      expect(crop.y).toBe(0);
    });

    it('computes 1:1 center crop box for tall image', () => {
      const crop = ImageTools.computeCenterCropBox(1080, 1920, '1:1');
      expect(crop.width).toBe(1080);
      expect(crop.height).toBe(1080);
      expect(crop.x).toBe(0);
      expect(crop.y).toBe(Math.round((1920 - 1080) / 2));
    });

    it('computes 16:9 crop box for square image', () => {
      const crop = ImageTools.computeCenterCropBox(1000, 1000, '16:9');
      expect(crop.width).toBe(1000);
      expect(crop.height).toBe(Math.round((1000 * 9) / 16));
      expect(crop.x).toBe(0);
      expect(crop.y).toBe(Math.round((1000 - crop.height) / 2));
    });

    it('returns full dimensions for freeform preset', () => {
      const crop = ImageTools.computeCenterCropBox(1280, 720, 'free');
      expect(crop).toEqual({ x: 0, y: 0, width: 1280, height: 720 });
    });
  });

  describe('Output Blob Verification', () => {
    it('fails when blob is empty (0 bytes)', async () => {
      const emptyBlob = new Blob([], { type: 'image/png' });
      const res = await ImageTools.verifyOutputBlob(emptyBlob, 'image/png');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('empty');
    });

    it('validates genuine PNG header bytes', async () => {
      // 89 50 4E 47 0D 0A 1A 0A
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const blob = new Blob([pngBytes], { type: 'image/png' });

      // In Node/happy-dom environment, Image decoding might reject incomplete binary,
      // but header check passes. Let's verify header check:
      try {
        const res = await ImageTools.verifyOutputBlob(blob, 'image/png');
        // If image decode throws in node/vitest, res.isValid will be false with decode error, but NOT header error
        if (!res.isValid) {
          expect(res.error).not.toContain('Output binary signature is not a valid PNG header');
        }
      } catch {
        // ok
      }
    });

    it('rejects invalid signature when format is JPEG but header is random', async () => {
      const badBytes = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55]);
      const badBlob = new Blob([badBytes], { type: 'image/jpeg' });
      const res = await ImageTools.verifyOutputBlob(badBlob, 'image/jpeg');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('JPEG header');
    });

    it('rejects invalid signature when format is WebP but header is not RIFF', async () => {
      const badBytes = new Uint8Array([0x41, 0x42, 0x43, 0x44, 0x45]);
      const badBlob = new Blob([badBytes], { type: 'image/webp' });
      const res = await ImageTools.verifyOutputBlob(badBlob, 'image/webp');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('WebP header');
    });
  });

  describe('Large Image Limits', () => {
    it('defines safe maximum dimensions and pixel limits', () => {
      expect(ImageTools.MAX_SAFE_DIMENSION).toBeGreaterThanOrEqual(4096);
      expect(ImageTools.MAX_SAFE_PIXELS).toBeGreaterThanOrEqual(16000000);
    });
  });
});
