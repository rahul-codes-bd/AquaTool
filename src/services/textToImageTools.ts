/**
 * AquaTools - Text to Image & Typography Overlay Service
 * 
 * Provides high-precision client-side typography rendering on HTML5 Canvas:
 * - Text overlay & watermarking on uploaded images
 * - Standalone typography poster / social banner / meme generation
 * - Multi-line text wrapping, custom fonts, weights, strokes, shadows, and badges
 * - Tiled watermark repeat patterns
 * - Verified output blob generation (PNG, JPEG, WebP)
 */

import { SupportedImageFormat, ImageTools } from './imageTools';

export interface TextLayerStroke {
  enabled: boolean;
  color: string;
  width: number; // in pixels
}

export interface TextLayerShadow {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface TextLayerBackground {
  enabled: boolean;
  color: string; // e.g. '#000000', 'rgba(0,0,0,0.6)'
  padding: number;
  borderRadius: number;
}

export interface TextLayer {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number; // in px
  fontWeight: 'normal' | 'bold' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  color: string;
  opacity: number; // 0.0 to 1.0
  stroke: TextLayerStroke;
  shadow: TextLayerShadow;
  background: TextLayerBackground;
  align: 'left' | 'center' | 'right';
  xPercent: number; // 0 to 100% of canvas width
  yPercent: number; // 0 to 100% of canvas height
  rotation: number; // degrees -180 to 180
  watermarkRepeat: boolean; // tile diagonally across canvas
  watermarkSpacing?: number; // spacing between tiles in px
  visible: boolean;
}

export interface CanvasGradientPreset {
  id: string;
  name: string;
  stops: [string, string, string?];
  direction: 'to-r' | 'to-br' | 'to-b' | 'radial';
}

export interface CanvasBackgroundConfig {
  type: 'image' | 'solid' | 'gradient';
  color?: string; // hex
  gradientId?: string;
  width: number;
  height: number;
}

export interface TextToImageRenderOptions {
  background: CanvasBackgroundConfig;
  layers: TextLayer[];
  sourceImage?: HTMLImageElement | ImageBitmap | null;
  format: SupportedImageFormat;
  quality?: number;
}

export interface TextToImageRenderResult {
  blob: Blob;
  url: string;
  stats: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
    layersCount: number;
  };
}

export const FONT_FAMILIES = [
  { id: 'Inter, system-ui, sans-serif', label: 'Inter (Modern Sans)', category: 'sans' },
  { id: 'Impact, "Arial Black", sans-serif', label: 'Impact (Meme / Bold)', category: 'display' },
  { id: '"Playfair Display", Georgia, serif', label: 'Playfair Display (Classic Serif)', category: 'serif' },
  { id: '"Bebas Neue", sans-serif', label: 'Bebas Neue (Display Headline)', category: 'display' },
  { id: 'Montserrat, sans-serif', label: 'Montserrat (Geometric)', category: 'sans' },
  { id: 'Caveat, cursive', label: 'Caveat (Handwritten Script)', category: 'handwritten' },
  { id: '"JetBrains Mono", "Courier New", monospace', label: 'JetBrains Mono (Code / Tech)', category: 'mono' },
  { id: 'Georgia, serif', label: 'Georgia (Editorial Serif)', category: 'serif' },
  { id: 'Arial, Helvetica, sans-serif', label: 'Arial (Clean Neutral)', category: 'sans' },
];

export const GRADIENT_PRESETS: CanvasGradientPreset[] = [
  {
    id: 'aqua-deep',
    name: 'Aqua Depths',
    stops: ['#083344', '#0f766e', '#06b6d4'],
    direction: 'to-br',
  },
  {
    id: 'sunset-blaze',
    name: 'Sunset Glow',
    stops: ['#4c0519', '#9f1239', '#fb7185'],
    direction: 'to-br',
  },
  {
    id: 'cyber-dark',
    name: 'Cyber Noir',
    stops: ['#020617', '#0f172a', '#1e293b'],
    direction: 'to-b',
  },
  {
    id: 'emerald-aurora',
    name: 'Emerald Aurora',
    stops: ['#022c22', '#065f46', '#10b981'],
    direction: 'to-br',
  },
  {
    id: 'royal-indigo',
    name: 'Royal Indigo',
    stops: ['#1e1b4b', '#3730a3', '#6366f1'],
    direction: 'to-r',
  },
  {
    id: 'vibrant-neon',
    name: 'Neon Twilight',
    stops: ['#3b0764', '#701a75', '#d946ef'],
    direction: 'to-br',
  },
];

export const CANVAS_SIZE_PRESETS = [
  { label: '1:1 Square (1080×1080)', width: 1080, height: 1080, desc: 'Instagram / Avatar' },
  { label: '16:9 Landscape (1920×1080)', width: 1920, height: 1080, desc: 'YouTube / Presentation' },
  { label: '9:16 Story / Reel (1080×1920)', width: 1080, height: 1920, desc: 'TikTok / Stories' },
  { label: '4:3 Standard (1200×900)', width: 1200, height: 900, desc: 'Blog Card / Graphic' },
  { label: '3:1 Banner (1500×500)', width: 1500, height: 500, desc: 'Twitter / X Header' },
  { label: '3:2 Photo (1200×800)', width: 1200, height: 800, desc: '35mm Aspect' },
];

export class TextToImageService {
  /**
   * Creates a default new text layer
   */
  static createDefaultLayer(partial: Partial<TextLayer> = {}): TextLayer {
    const id = `layer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      id,
      text: partial.text || 'Add Your Text Here',
      fontFamily: partial.fontFamily || 'Inter, system-ui, sans-serif',
      fontSize: partial.fontSize || 48,
      fontWeight: partial.fontWeight || 'bold',
      fontStyle: partial.fontStyle || 'normal',
      color: partial.color || '#ffffff',
      opacity: partial.opacity !== undefined ? partial.opacity : 1.0,
      stroke: {
        enabled: partial.stroke?.enabled || false,
        color: partial.stroke?.color || '#000000',
        width: partial.stroke?.width || 3,
      },
      shadow: {
        enabled: partial.shadow?.enabled || false,
        color: partial.shadow?.color || 'rgba(0, 0, 0, 0.7)',
        blur: partial.shadow?.blur || 8,
        offsetX: partial.shadow?.offsetX || 2,
        offsetY: partial.shadow?.offsetY || 2,
      },
      background: {
        enabled: partial.background?.enabled || false,
        color: partial.background?.color || 'rgba(15, 23, 42, 0.75)',
        padding: partial.background?.padding || 12,
        borderRadius: partial.background?.borderRadius || 8,
      },
      align: partial.align || 'center',
      xPercent: partial.xPercent !== undefined ? partial.xPercent : 50,
      yPercent: partial.yPercent !== undefined ? partial.yPercent : 50,
      rotation: partial.rotation || 0,
      watermarkRepeat: partial.watermarkRepeat || false,
      watermarkSpacing: partial.watermarkSpacing || 220,
      visible: partial.visible !== undefined ? partial.visible : true,
    };
  }

  /**
   * Creates preset template layers (e.g. Meme, Watermark, Quote, Badge)
   */
  static getPresetLayers(
    presetId: 'meme' | 'watermark' | 'quote' | 'banner' | 'badge' | 'confidential'
  ): TextLayer[] {
    switch (presetId) {
      case 'meme':
        return [
          this.createDefaultLayer({
            text: 'TOP TEXT',
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: 64,
            fontWeight: '900',
            color: '#ffffff',
            stroke: { enabled: true, color: '#000000', width: 6 },
            shadow: { enabled: true, color: 'rgba(0,0,0,0.8)', blur: 4, offsetX: 2, offsetY: 2 },
            align: 'center',
            xPercent: 50,
            yPercent: 12,
          }),
          this.createDefaultLayer({
            text: 'BOTTOM TEXT',
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: 64,
            fontWeight: '900',
            color: '#ffffff',
            stroke: { enabled: true, color: '#000000', width: 6 },
            shadow: { enabled: true, color: 'rgba(0,0,0,0.8)', blur: 4, offsetX: 2, offsetY: 2 },
            align: 'center',
            xPercent: 50,
            yPercent: 88,
          }),
        ];

      case 'watermark':
        return [
          this.createDefaultLayer({
            text: '© AquaTools • Confidential Draft',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 28,
            fontWeight: 'bold',
            color: '#ffffff',
            opacity: 0.28,
            rotation: -25,
            watermarkRepeat: true,
            watermarkSpacing: 260,
            align: 'center',
            xPercent: 50,
            yPercent: 50,
          }),
        ];

      case 'quote':
        return [
          this.createDefaultLayer({
            text: '“Simplicity is the soul of efficiency.”',
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 52,
            fontWeight: 'normal',
            fontStyle: 'italic',
            color: '#f8fafc',
            shadow: { enabled: true, color: 'rgba(0,0,0,0.6)', blur: 12, offsetX: 0, offsetY: 4 },
            align: 'center',
            xPercent: 50,
            yPercent: 44,
          }),
          this.createDefaultLayer({
            text: '— Austin Freeman',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 22,
            fontWeight: 'bold',
            color: '#38bdf8',
            align: 'center',
            xPercent: 50,
            yPercent: 62,
          }),
        ];

      case 'banner':
        return [
          this.createDefaultLayer({
            text: 'ULTIMATE GUIDE',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 20,
            fontWeight: '900',
            color: '#06b6d4',
            background: { enabled: true, color: 'rgba(8, 51, 68, 0.85)', padding: 10, borderRadius: 999 },
            align: 'center',
            xPercent: 50,
            yPercent: 28,
          }),
          this.createDefaultLayer({
            text: 'BUILD FASTER WITH AI',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 76,
            fontWeight: 'bold',
            color: '#ffffff',
            shadow: { enabled: true, color: '#06b6d4', blur: 24, offsetX: 0, offsetY: 0 },
            stroke: { enabled: true, color: '#0f172a', width: 3 },
            align: 'center',
            xPercent: 50,
            yPercent: 48,
          }),
          this.createDefaultLayer({
            text: 'High performance tools crafted for developers',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 24,
            fontWeight: 'normal',
            color: '#cbd5e1',
            align: 'center',
            xPercent: 50,
            yPercent: 68,
          }),
        ];

      case 'badge':
        return [
          this.createDefaultLayer({
            text: 'VERIFIED CONTENT',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 22,
            fontWeight: 'bold',
            color: '#34d399',
            background: { enabled: true, color: 'rgba(2, 44, 34, 0.85)', padding: 14, borderRadius: 12 },
            stroke: { enabled: true, color: '#059669', width: 1 },
            align: 'center',
            xPercent: 50,
            yPercent: 50,
          }),
        ];

      case 'confidential':
        return [
          this.createDefaultLayer({
            text: 'CONFIDENTIAL',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 72,
            fontWeight: '900',
            color: '#ef4444',
            opacity: 0.8,
            rotation: -18,
            stroke: { enabled: true, color: '#991b1b', width: 3 },
            background: { enabled: true, color: 'rgba(127, 29, 29, 0.25)', padding: 16, borderRadius: 8 },
            align: 'center',
            xPercent: 50,
            yPercent: 50,
          }),
        ];
    }
  }

  /**
   * Splits text into multi-line wrapped text if it exceeds maxWidth
   */
  static wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const paragraphs = text.split('\n');
    const resultLines: string[] = [];

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        resultLines.push('');
        continue;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && currentLine !== '') {
          resultLines.push(currentLine);
          currentLine = words[n];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        resultLines.push(currentLine);
      }
    }

    return resultLines.length > 0 ? resultLines : [text];
  }

  /**
   * Helper to draw a rounded rectangle on a canvas context
   */
  static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * Renders background onto canvas (image, solid, or gradient)
   */
  static renderBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: CanvasBackgroundConfig,
    sourceImage?: HTMLImageElement | ImageBitmap | null
  ): void {
    if (config.type === 'image' && sourceImage) {
      // Draw image to fill or fit canvas
      ctx.drawImage(sourceImage, 0, 0, width, height);
      return;
    }

    if (config.type === 'gradient' && config.gradientId) {
      const preset =
        GRADIENT_PRESETS.find((g) => g.id === config.gradientId) || GRADIENT_PRESETS[0];

      let grad: CanvasGradient;
      if (preset.direction === 'to-r') {
        grad = ctx.createLinearGradient(0, height / 2, width, height / 2);
      } else if (preset.direction === 'to-b') {
        grad = ctx.createLinearGradient(width / 2, 0, width / 2, height);
      } else {
        grad = ctx.createLinearGradient(0, 0, width, height);
      }

      grad.addColorStop(0, preset.stops[0]);
      grad.addColorStop(0.5, preset.stops[1]);
      if (preset.stops[2]) {
        grad.addColorStop(1, preset.stops[2]);
      } else {
        grad.addColorStop(1, preset.stops[1]);
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      return;
    }

    // Default solid color
    ctx.fillStyle = config.color || '#0b1120';
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Renders a single text layer onto the canvas context
   */
  static renderTextLayer(
    ctx: CanvasRenderingContext2D,
    layer: TextLayer,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!layer.visible || !layer.text) return;

    ctx.save();

    // Configure font string: e.g. "italic bold 48px Inter, sans-serif"
    const stylePart = layer.fontStyle === 'italic' ? 'italic ' : '';
    const weightPart = layer.fontWeight ? `${layer.fontWeight} ` : '';
    ctx.font = `${stylePart}${weightPart}${Math.max(8, layer.fontSize)}px ${layer.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = layer.align;

    // Watermark Repeating Tile Pattern
    if (layer.watermarkRepeat) {
      ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));
      ctx.fillStyle = layer.color;

      const spacing = layer.watermarkSpacing || 240;
      const angleRad = (layer.rotation * Math.PI) / 180;

      // Draw grid of tiled watermarks
      for (let x = -canvasWidth; x < canvasWidth * 2; x += spacing) {
        for (let y = -canvasHeight; y < canvasHeight * 2; y += spacing) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angleRad);
          if (layer.stroke.enabled) {
            ctx.strokeStyle = layer.stroke.color;
            ctx.lineWidth = layer.stroke.width;
            ctx.strokeText(layer.text, 0, 0);
          }
          ctx.fillText(layer.text, 0, 0);
          ctx.restore();
        }
      }

      ctx.restore();
      return;
    }

    // Single Layer Rendering
    const posX = (layer.xPercent / 100) * canvasWidth;
    const posY = (layer.yPercent / 100) * canvasHeight;

    // Apply global layer opacity
    ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));

    // Multi-line wrapping (allow up to 90% of canvas width)
    const maxTextWidth = canvasWidth * 0.9;
    const lines = this.wrapText(ctx, layer.text, maxTextWidth);
    const lineHeight = layer.fontSize * 1.25;
    const totalHeight = lines.length * lineHeight;

    ctx.translate(posX, posY);
    if (layer.rotation !== 0) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }

    // Measure maximum line width
    let widestLine = 0;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > widestLine) widestLine = w;
    }

    // Background Badge / Box
    if (layer.background.enabled && lines.length > 0) {
      const pad = layer.background.padding;
      const bgW = widestLine + pad * 2;
      const bgH = totalHeight + pad * 2;

      let bgX = -bgW / 2;
      if (layer.align === 'left') bgX = -pad;
      if (layer.align === 'right') bgX = -bgW + pad;

      const bgY = -bgH / 2;

      ctx.save();
      ctx.fillStyle = layer.background.color;
      this.drawRoundedRect(ctx, bgX, bgY, bgW, bgH, layer.background.borderRadius);
      ctx.fill();
      ctx.restore();
    }

    // Drop Shadow
    if (layer.shadow.enabled) {
      ctx.shadowColor = layer.shadow.color;
      ctx.shadowBlur = layer.shadow.blur;
      ctx.shadowOffsetX = layer.shadow.offsetX;
      ctx.shadowOffsetY = layer.shadow.offsetY;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Render Each Line
    const startY = -(totalHeight / 2) + lineHeight / 2;

    for (let i = 0; i < lines.length; i++) {
      const currentY = startY + i * lineHeight;

      // Stroke / Outline
      if (layer.stroke.enabled && layer.stroke.width > 0) {
        ctx.strokeStyle = layer.stroke.color;
        ctx.lineWidth = layer.stroke.width;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(lines[i], 0, currentY);
      }

      // Fill text
      ctx.fillStyle = layer.color;
      ctx.fillText(lines[i], 0, currentY);
    }

    ctx.restore();
  }

  /**
   * Main rendering routine: creates output blob and returns statistics
   */
  static async renderToBlob(
    options: TextToImageRenderOptions
  ): Promise<TextToImageRenderResult> {
    const width = Math.max(10, Math.round(options.background.width));
    const height = Math.max(10, Math.round(options.background.height));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to acquire 2D Canvas context.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw Background
    this.renderBackground(ctx, width, height, options.background, options.sourceImage);

    // 2. Draw Text Layers in sequential order
    for (const layer of options.layers) {
      this.renderTextLayer(ctx, layer, width, height);
    }

    // 3. Convert to Blob
    const quality = options.quality !== undefined ? options.quality : 0.95;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas encoding to blob failed.'));
        },
        options.format,
        quality
      );
    });

    // 4. Verify Output Blob
    const verification = await ImageTools.verifyOutputBlob(blob, options.format);
    if (!verification.isValid) {
      throw new Error(`Output file verification failed: ${verification.error}`);
    }

    const url = URL.createObjectURL(blob);
    const visibleCount = options.layers.filter((l) => l.visible).length;

    return {
      blob,
      url,
      stats: {
        width,
        height,
        fileSize: blob.size,
        format: options.format.split('/')[1].toUpperCase(),
        layersCount: visibleCount,
      },
    };
  }

  /**
   * Loads an image File into an HTMLImageElement for canvas drawing
   */
  static async loadImageElement(file: File | Blob): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Failed to decode image file.'));
        el.src = url;
      });
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
