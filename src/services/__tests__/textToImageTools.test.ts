import { describe, it, expect } from 'vitest';
import {
  TextToImageService,
  FONT_FAMILIES,
  GRADIENT_PRESETS,
  CANVAS_SIZE_PRESETS,
} from '../textToImageTools';

describe('TextToImageService', () => {
  describe('Default Layer Creation', () => {
    it('creates a layer with valid default properties', () => {
      const layer = TextToImageService.createDefaultLayer();
      expect(layer.id).toBeDefined();
      expect(layer.text).toBe('Add Your Text Here');
      expect(layer.fontSize).toBe(48);
      expect(layer.color).toBe('#ffffff');
      expect(layer.opacity).toBe(1.0);
      expect(layer.align).toBe('center');
      expect(layer.xPercent).toBe(50);
      expect(layer.yPercent).toBe(50);
      expect(layer.visible).toBe(true);
      expect(layer.watermarkRepeat).toBe(false);
    });

    it('merges partial overrides correctly', () => {
      const layer = TextToImageService.createDefaultLayer({
        text: 'Custom Title',
        fontSize: 72,
        color: '#06b6d4',
        align: 'left',
        xPercent: 10,
        stroke: { enabled: true, color: '#000000', width: 4 },
      });
      expect(layer.text).toBe('Custom Title');
      expect(layer.fontSize).toBe(72);
      expect(layer.color).toBe('#06b6d4');
      expect(layer.align).toBe('left');
      expect(layer.xPercent).toBe(10);
      expect(layer.stroke.enabled).toBe(true);
      expect(layer.stroke.width).toBe(4);
    });
  });

  describe('Preset Templates', () => {
    it('generates meme preset with top and bottom text in Impact font', () => {
      const memeLayers = TextToImageService.getPresetLayers('meme');
      expect(memeLayers.length).toBe(2);
      expect(memeLayers[0].text).toBe('TOP TEXT');
      expect(memeLayers[1].text).toBe('BOTTOM TEXT');
      expect(memeLayers[0].fontFamily).toContain('Impact');
      expect(memeLayers[0].stroke.enabled).toBe(true);
      expect(memeLayers[0].yPercent).toBeLessThan(20);
      expect(memeLayers[1].yPercent).toBeGreaterThan(80);
    });

    it('generates watermark preset with tiled repeating pattern', () => {
      const watermarkLayers = TextToImageService.getPresetLayers('watermark');
      expect(watermarkLayers.length).toBe(1);
      expect(watermarkLayers[0].watermarkRepeat).toBe(true);
      expect(watermarkLayers[0].opacity).toBeLessThan(0.5);
      expect(watermarkLayers[0].rotation).not.toBe(0);
    });

    it('generates quote preset with quote text and attribution', () => {
      const quoteLayers = TextToImageService.getPresetLayers('quote');
      expect(quoteLayers.length).toBe(2);
      expect(quoteLayers[0].fontStyle).toBe('italic');
      expect(quoteLayers[1].text).toContain('—');
    });

    it('generates banner and confidential presets', () => {
      const bannerLayers = TextToImageService.getPresetLayers('banner');
      expect(bannerLayers.length).toBeGreaterThanOrEqual(2);

      const stampLayers = TextToImageService.getPresetLayers('confidential');
      expect(stampLayers[0].text).toBe('CONFIDENTIAL');
      expect(stampLayers[0].color).toBe('#ef4444');
    });
  });

  describe('Presets and Catalogs', () => {
    it('provides rich font families', () => {
      expect(FONT_FAMILIES.length).toBeGreaterThanOrEqual(5);
      expect(FONT_FAMILIES.some((f) => f.category === 'sans')).toBe(true);
      expect(FONT_FAMILIES.some((f) => f.category === 'serif')).toBe(true);
      expect(FONT_FAMILIES.some((f) => f.category === 'display')).toBe(true);
    });

    it('provides modern gradient presets', () => {
      expect(GRADIENT_PRESETS.length).toBeGreaterThanOrEqual(4);
      expect(GRADIENT_PRESETS.some((g) => g.id === 'aqua-deep')).toBe(true);
    });

    it('provides common canvas size presets', () => {
      expect(CANVAS_SIZE_PRESETS.length).toBeGreaterThanOrEqual(4);
      expect(CANVAS_SIZE_PRESETS.some((s) => s.width === 1080 && s.height === 1080)).toBe(true);
      expect(CANVAS_SIZE_PRESETS.some((s) => s.width === 1920 && s.height === 1080)).toBe(true);
    });
  });
});
