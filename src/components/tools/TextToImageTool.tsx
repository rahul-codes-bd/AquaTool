import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Type,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Download,
  Sparkles,
  Sliders,
  Move,
  Layers,
  Palette,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Image as ImageIcon,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Shield,
  FileCheck,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ErrorAlert } from '../common/ErrorAlert';
import { ObjectUrlManager, FileHandlerService } from '../../services/fileHandler';
import { SupportedImageFormat } from '../../services/imageTools';
import {
  TextToImageService,
  TextLayer,
  CanvasBackgroundConfig,
  FONT_FAMILIES,
  GRADIENT_PRESETS,
  CANVAS_SIZE_PRESETS,
} from '../../services/textToImageTools';

export const TextToImageTool: React.FC = () => {
  // Mode: 'image' (overlay onto existing image) or 'canvas' (generate from scratch)
  const [mode, setMode] = useState<'image' | 'canvas'>('canvas');

  // Image source state
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceImageElement, setSourceImageElement] = useState<HTMLImageElement | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; name: string } | null>(null);

  // Canvas background config
  const [canvasWidth, setCanvasWidth] = useState<number>(1080);
  const [canvasHeight, setCanvasHeight] = useState<number>(1080);
  const [bgType, setBgType] = useState<'solid' | 'gradient'>('gradient');
  const [solidColor, setSolidColor] = useState<string>('#0f172a');
  const [selectedGradient, setSelectedGradient] = useState<string>('aqua-deep');

  // Text layers state
  const [layers, setLayers] = useState<TextLayer[]>(() =>
    TextToImageService.getPresetLayers('banner')
  );
  const [selectedLayerId, setSelectedLayerId] = useState<string>('');

  // Export settings
  const [outputFormat, setOutputFormat] = useState<SupportedImageFormat>('image/png');
  const [outputQuality, setOutputQuality] = useState<number>(0.92);

  // Render status & result
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputStats, setOutputStats] = useState<{
    width: number;
    height: number;
    fileSize: number;
    format: string;
  } | null>(null);

  // Zoom & Preview state
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Hidden preview canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Object URL manager for leak-free lifecycle
  const urlManagerRef = useRef<ObjectUrlManager>(new ObjectUrlManager());

  // Set initial selected layer
  useEffect(() => {
    if (layers.length > 0 && !selectedLayerId) {
      setSelectedLayerId(layers[0].id);
    }
  }, [layers, selectedLayerId]);

  // Clean up object URLs on unmount
  useEffect(() => {
    const manager = urlManagerRef.current;
    return () => {
      manager.revokeAll();
    };
  }, []);

  // Update canvas dimensions when an image is loaded
  const handleImageLoaded = async (file: File) => {
    setErrorMessage(null);
    try {
      const img = await TextToImageService.loadImageElement(file);
      setSourceFile(file);
      setSourceImageElement(img);
      setImageMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: file.name,
      });
      setCanvasWidth(img.naturalWidth);
      setCanvasHeight(img.naturalHeight);
      setMode('image');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read image.');
    }
  };

  // Re-render live preview whenever options change
  const renderCanvasPreview = useCallback(async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = mode === 'image' && sourceImageElement ? sourceImageElement.naturalWidth : canvasWidth;
    const height = mode === 'image' && sourceImageElement ? sourceImageElement.naturalHeight : canvasHeight;

    canvas.width = width;
    canvas.height = height;

    const bgConfig: CanvasBackgroundConfig = {
      type: mode === 'image' ? 'image' : bgType,
      color: solidColor,
      gradientId: selectedGradient,
      width,
      height,
    };

    // Draw Background
    TextToImageService.renderBackground(ctx, width, height, bgConfig, sourceImageElement);

    // Draw Layers
    for (const layer of layers) {
      TextToImageService.renderTextLayer(ctx, layer, width, height);
    }
  }, [mode, sourceImageElement, canvasWidth, canvasHeight, bgType, solidColor, selectedGradient, layers]);

  useEffect(() => {
    renderCanvasPreview();
  }, [renderCanvasPreview]);

  // Layer manipulation helpers
  const activeLayer = layers.find((l) => l.id === selectedLayerId) || layers[0];

  const updateActiveLayer = (partial: Partial<TextLayer>) => {
    if (!activeLayer) return;
    setLayers((prev) =>
      prev.map((l) => (l.id === activeLayer.id ? { ...l, ...partial } : l))
    );
  };

  const handleAddLayer = () => {
    const newLayer = TextToImageService.createDefaultLayer({
      text: 'New Text Layer',
      fontSize: 44,
      yPercent: 50 + (layers.length % 5) * 6,
    });
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) {
      setErrorMessage('At least one text layer must remain.');
      return;
    }
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) {
      const remaining = layers.filter((l) => l.id !== id);
      setSelectedLayerId(remaining[0].id);
    }
  };

  const handleDuplicateLayer = (layer: TextLayer) => {
    const duplicate = TextToImageService.createDefaultLayer({
      ...layer,
      id: undefined,
      text: `${layer.text} (Copy)`,
      yPercent: Math.min(95, layer.yPercent + 5),
      xPercent: Math.min(95, layer.xPercent + 3),
    });
    setLayers((prev) => [...prev, duplicate]);
    setSelectedLayerId(duplicate.id);
  };

  const handleApplyPreset = (presetId: 'meme' | 'watermark' | 'quote' | 'banner' | 'badge' | 'confidential') => {
    const preset = TextToImageService.getPresetLayers(presetId);
    setLayers(preset);
    setSelectedLayerId(preset[0].id);
  };

  // Position presets
  const applyPositionPreset = (
    pos: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'meme-top' | 'meme-bottom'
  ) => {
    if (!activeLayer) return;
    switch (pos) {
      case 'top-left':
        updateActiveLayer({ xPercent: 12, yPercent: 12, align: 'left' });
        break;
      case 'top-center':
        updateActiveLayer({ xPercent: 50, yPercent: 14, align: 'center' });
        break;
      case 'top-right':
        updateActiveLayer({ xPercent: 88, yPercent: 12, align: 'right' });
        break;
      case 'center':
        updateActiveLayer({ xPercent: 50, yPercent: 50, align: 'center' });
        break;
      case 'bottom-left':
        updateActiveLayer({ xPercent: 12, yPercent: 88, align: 'left' });
        break;
      case 'bottom-center':
        updateActiveLayer({ xPercent: 50, yPercent: 86, align: 'center' });
        break;
      case 'bottom-right':
        updateActiveLayer({ xPercent: 88, yPercent: 88, align: 'right' });
        break;
      case 'meme-top':
        updateActiveLayer({ xPercent: 50, yPercent: 10, align: 'center' });
        break;
      case 'meme-bottom':
        updateActiveLayer({ xPercent: 50, yPercent: 90, align: 'center' });
        break;
    }
  };

  // Generate & Export High-Res Image
  const handleExport = async () => {
    setIsRendering(true);
    setErrorMessage(null);

    try {
      const width = mode === 'image' && sourceImageElement ? sourceImageElement.naturalWidth : canvasWidth;
      const height = mode === 'image' && sourceImageElement ? sourceImageElement.naturalHeight : canvasHeight;

      const bgConfig: CanvasBackgroundConfig = {
        type: mode === 'image' ? 'image' : bgType,
        color: solidColor,
        gradientId: selectedGradient,
        width,
        height,
      };

      const result = await TextToImageService.renderToBlob({
        background: bgConfig,
        layers,
        sourceImage: sourceImageElement,
        format: outputFormat,
        quality: outputQuality,
      });

      // Manage object URL memory
      urlManagerRef.current.revokeAll();
      const safeUrl = urlManagerRef.current.createSafeUrl(result.blob);
      try {
        URL.revokeObjectURL(result.url);
      } catch {
        // ignore
      }
      setOutputUrl(safeUrl);
      setOutputStats({
        width: result.stats.width,
        height: result.stats.height,
        fileSize: result.stats.fileSize,
        format: result.stats.format,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Export failed.');
    } finally {
      setIsRendering(false);
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2500);
        } catch {
          setErrorMessage('Clipboard copy not permitted by browser permission. Please download instead.');
        }
      }, 'image/png');
    } catch (err: any) {
      setErrorMessage(err.message || 'Clipboard copy failed.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Type className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Text to Image & Typography Studio
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30">
                100% Client-Side
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Add watermarks, quotes, meme text to photos or design high-resolution typography cards from scratch.
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-sm">
          <button
            type="button"
            onClick={() => setMode('canvas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              mode === 'canvas'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Blank Canvas / Presets
          </button>
          <button
            type="button"
            onClick={() => setMode('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              mode === 'image'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Overlay on Photo
          </button>
        </div>
      </div>

      {errorMessage && <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

      {/* Preset Quick Actions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <span className="text-slate-500 font-medium whitespace-nowrap pl-1">Style Presets:</span>
        <button
          type="button"
          onClick={() => handleApplyPreset('banner')}
          className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Modern Banner
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('meme')}
          className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <Type className="w-3.5 h-3.5 text-amber-400" />
          Classic Meme
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('watermark')}
          className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          Tiled Watermark
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('quote')}
          className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <Type className="w-3.5 h-3.5 text-pink-400" />
          Inspirational Quote
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('badge')}
          className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
          Verified Badge
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('confidential')}
          className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <Shield className="w-3.5 h-3.5 text-red-400" />
          Confidential Stamp
        </button>
      </div>

      {/* Main Grid: Left Controls, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Layers, Typography, Canvas Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Photo Dropzone if in 'image' mode */}
          {mode === 'image' && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  Background Image
                </span>
                {imageMeta && (
                  <span className="text-xs text-slate-400">
                    {imageMeta.name} ({imageMeta.width}×{imageMeta.height}px)
                  </span>
                )}
              </div>
              <FileDropzone
                onFilesSelected={(files) => {
                  if (files[0]) handleImageLoaded(files[0]);
                }}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                maxSizeMB={40}
                subtitle="Drop any PNG, JPG, or WebP photo to add text or watermarks"
              />
            </div>
          )}

          {/* Canvas Settings if in 'canvas' mode */}
          {mode === 'canvas' && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  Canvas Dimensions & Background
                </span>
              </div>

              {/* Aspect Ratio Size Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CANVAS_SIZE_PRESETS.map((p) => {
                  const active = canvasWidth === p.width && canvasHeight === p.height;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setCanvasWidth(p.width);
                        setCanvasHeight(p.height);
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        active
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-medium'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-semibold">{p.label}</div>
                      <div className="text-[10px] text-slate-400">{p.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Background Color / Gradient Options */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="bgType"
                      checked={bgType === 'gradient'}
                      onChange={() => setBgType('gradient')}
                      className="accent-cyan-400"
                    />
                    Modern Gradient
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="bgType"
                      checked={bgType === 'solid'}
                      onChange={() => setBgType('solid')}
                      className="accent-cyan-400"
                    />
                    Solid Color
                  </label>
                </div>

                {bgType === 'gradient' ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {GRADIENT_PRESETS.map((grad) => (
                      <button
                        key={grad.id}
                        type="button"
                        onClick={() => setSelectedGradient(grad.id)}
                        className={`h-12 rounded-xl border relative transition-all overflow-hidden ${
                          selectedGradient === grad.id
                            ? 'ring-2 ring-cyan-400 border-cyan-300 scale-105'
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${grad.stops[0]}, ${grad.stops[1]}, ${
                            grad.stops[2] || grad.stops[1]
                          })`,
                        }}
                        title={grad.name}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={solidColor}
                      onChange={(e) => setSolidColor(e.target.value)}
                      className="w-10 h-10 rounded-xl bg-transparent border border-slate-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={solidColor}
                      onChange={(e) => setSolidColor(e.target.value)}
                      className="w-28 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                    />
                    <div className="flex items-center gap-1.5">
                      {['#0b1120', '#000000', '#ffffff', '#1e293b', '#0f766e', '#831843'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSolidColor(c)}
                          className="w-6 h-6 rounded-md border border-slate-700"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Layer Selector Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Text Layers ({layers.length})
              </span>
              <button
                type="button"
                onClick={handleAddLayer}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Text Layer
              </button>
            </div>

            {/* Layers Pill Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {layers.map((layer, idx) => {
                const isActive = layer.id === selectedLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs cursor-pointer border transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-semibold shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLayers((prev) =>
                          prev.map((l) => (l.id === layer.id ? { ...l, visible: !l.visible } : l))
                        );
                      }}
                      className="text-slate-400 hover:text-white"
                      title={layer.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                    </button>
                    <span className="max-w-[120px] truncate">
                      {layer.text || `Layer ${idx + 1}`}
                    </span>
                    {layers.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLayer(layer.id);
                        }}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete layer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Layer Customization Panel */}
          {activeLayer && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Styling: <span className="text-cyan-300 font-mono text-xs">{activeLayer.text.slice(0, 20)}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDuplicateLayer(activeLayer)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs flex items-center gap-1"
                    title="Duplicate layer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLayer(activeLayer.id)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 text-xs"
                    title="Delete layer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Text Content</label>
                <textarea
                  rows={2}
                  value={activeLayer.text}
                  onChange={(e) => updateActiveLayer({ text: e.target.value })}
                  placeholder="Enter caption, watermark, or quote..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none font-sans"
                />
              </div>

              {/* Font Family & Typography Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Font Family</label>
                  <select
                    value={activeLayer.fontFamily}
                    onChange={(e) => updateActiveLayer({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {FONT_FAMILIES.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Font Size</span>
                    <span className="text-cyan-400 font-mono">{activeLayer.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="180"
                    value={activeLayer.fontSize}
                    onChange={(e) => updateActiveLayer({ fontSize: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* Font Weight, Style, & Alignment */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Weight</label>
                  <select
                    value={activeLayer.fontWeight}
                    onChange={(e) =>
                      updateActiveLayer({
                        fontWeight: e.target.value as TextLayer['fontWeight'],
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="800">Extra Bold</option>
                    <option value="900">Black / Heavy</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Style</label>
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveLayer({
                        fontStyle: activeLayer.fontStyle === 'italic' ? 'normal' : 'italic',
                      })
                    }
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      activeLayer.fontStyle === 'italic'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 italic'
                        : 'bg-slate-950 border-slate-700 text-slate-300'
                    }`}
                  >
                    Italic Font
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Alignment</label>
                  <div className="flex bg-slate-950 border border-slate-700 rounded-lg p-0.5">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => updateActiveLayer({ align })}
                        className={`flex-1 py-1 rounded flex justify-center items-center transition-colors ${
                          activeLayer.align === align
                            ? 'bg-cyan-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color & Opacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeLayer.color}
                      onChange={(e) => updateActiveLayer({ color: e.target.value })}
                      className="w-9 h-9 rounded-lg bg-transparent border border-slate-700 cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      {['#ffffff', '#000000', '#38bdf8', '#fbbf24', '#f43f5e', '#34d399'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateActiveLayer({ color: c })}
                          className="w-6 h-6 rounded-md border border-slate-700"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Opacity</span>
                    <span className="text-cyan-400 font-mono">
                      {Math.round(activeLayer.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={activeLayer.opacity}
                    onChange={(e) => updateActiveLayer({ opacity: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* Outline / Stroke & Shadow Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                {/* Stroke Section */}
                <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeLayer.stroke.enabled}
                        onChange={(e) =>
                          updateActiveLayer({
                            stroke: { ...activeLayer.stroke, enabled: e.target.checked },
                          })
                        }
                        className="accent-cyan-400 rounded"
                      />
                      Text Outline / Stroke (Ideal for memes & contrast)
                    </label>
                    {activeLayer.stroke.enabled && (
                      <span className="text-xs text-cyan-400 font-mono">
                        {activeLayer.stroke.width}px
                      </span>
                    )}
                  </div>
                  {activeLayer.stroke.enabled && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Color:</span>
                        <input
                          type="color"
                          value={activeLayer.stroke.color}
                          onChange={(e) =>
                            updateActiveLayer({
                              stroke: { ...activeLayer.stroke, color: e.target.value },
                            })
                          }
                          className="w-7 h-7 rounded bg-transparent border border-slate-700 cursor-pointer"
                        />
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={activeLayer.stroke.width}
                        onChange={(e) =>
                          updateActiveLayer({
                            stroke: { ...activeLayer.stroke, width: Number(e.target.value) },
                          })
                        }
                        className="accent-cyan-400"
                      />
                    </div>
                  )}
                </div>

                {/* Drop Shadow Section */}
                <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeLayer.shadow.enabled}
                        onChange={(e) =>
                          updateActiveLayer({
                            shadow: { ...activeLayer.shadow, enabled: e.target.checked },
                          })
                        }
                        className="accent-cyan-400 rounded"
                      />
                      Text Drop Shadow
                    </label>
                  </div>
                  {activeLayer.shadow.enabled && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Color:</span>
                        <input
                          type="color"
                          value={activeLayer.shadow.color.startsWith('#') ? activeLayer.shadow.color : '#000000'}
                          onChange={(e) =>
                            updateActiveLayer({
                              shadow: { ...activeLayer.shadow, color: e.target.value },
                            })
                          }
                          className="w-7 h-7 rounded bg-transparent border border-slate-700 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Blur:</span>
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={activeLayer.shadow.blur}
                          onChange={(e) =>
                            updateActiveLayer({
                              shadow: { ...activeLayer.shadow, blur: Number(e.target.value) },
                            })
                          }
                          className="accent-cyan-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Background Box / Badge Section */}
                <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeLayer.background.enabled}
                        onChange={(e) =>
                          updateActiveLayer({
                            background: { ...activeLayer.background, enabled: e.target.checked },
                          })
                        }
                        className="accent-cyan-400 rounded"
                      />
                      Background Badge / Box
                    </label>
                  </div>
                  {activeLayer.background.enabled && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Color:</span>
                        <input
                          type="color"
                          value={activeLayer.background.color.startsWith('#') ? activeLayer.background.color : '#000000'}
                          onChange={(e) =>
                            updateActiveLayer({
                              background: { ...activeLayer.background, color: e.target.value },
                            })
                          }
                          className="w-7 h-7 rounded bg-transparent border border-slate-700 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Padding:</span>
                        <input
                          type="range"
                          min="4"
                          max="40"
                          value={activeLayer.background.padding}
                          onChange={(e) =>
                            updateActiveLayer({
                              background: { ...activeLayer.background, padding: Number(e.target.value) },
                            })
                          }
                          className="accent-cyan-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Positioning Shortcuts & Sliders */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-cyan-400" />
                  Positioning & Alignment Shortcuts
                </span>

                {/* Quick alignment matrix */}
                <div className="grid grid-cols-3 gap-1.5 max-w-xs">
                  <button
                    type="button"
                    onClick={() => applyPositionPreset('top-left')}
                    className="p-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Top Left
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPositionPreset('top-center')}
                    className="p-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Top Center
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPositionPreset('top-right')}
                    className="p-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Top Right
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPositionPreset('meme-top')}
                    className="p-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Meme Top
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPositionPreset('center')}
                    className="p-1.5 text-xs rounded bg-cyan-500/20 text-cyan-300 font-semibold"
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPositionPreset('meme-bottom')}
                    className="p-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Meme Bottom
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPositionPreset('bottom-left')}
                    className="p-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Btm Left
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPositionPreset('bottom-center')}
                    className="p-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Btm Center
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPositionPreset('bottom-right')}
                    className="p-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Btm Right
                  </button>
                </div>

                {/* Fine Position Sliders */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>X Position</span>
                      <span className="font-mono text-cyan-400">{Math.round(activeLayer.xPercent)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeLayer.xPercent}
                      onChange={(e) => updateActiveLayer({ xPercent: Number(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Y Position</span>
                      <span className="font-mono text-cyan-400">{Math.round(activeLayer.yPercent)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeLayer.yPercent}
                      onChange={(e) => updateActiveLayer({ yPercent: Number(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                {/* Rotation & Watermark Pattern */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <RotateCw className="w-3 h-3" /> Angle
                      </span>
                      <span className="font-mono text-cyan-400">{activeLayer.rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={activeLayer.rotation}
                      onChange={(e) => updateActiveLayer({ rotation: Number(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer pb-1">
                      <input
                        type="checkbox"
                        checked={activeLayer.watermarkRepeat}
                        onChange={(e) => updateActiveLayer({ watermarkRepeat: e.target.checked })}
                        className="accent-cyan-400 rounded"
                      />
                      Tile Diagonally (Full Watermark)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Canvas Preview & Export (5 cols) */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            {/* Preview Controls Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                Live Canvas Preview
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.max(25, z - 25))}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono text-slate-400 px-1">{previewZoom}%</span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.min(200, z + 25))}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={renderCanvasPreview}
                  className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 ml-1"
                  title="Refresh Canvas"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Stage View */}
            <div className="w-full h-80 sm:h-96 rounded-xl bg-slate-950 border border-slate-800/80 overflow-auto flex items-center justify-center p-4 relative group">
              <canvas
                ref={canvasRef}
                style={{
                  transform: `scale(${previewZoom / 100})`,
                  transformOrigin: 'center center',
                  maxWidth: previewZoom <= 100 ? '100%' : 'none',
                  maxHeight: previewZoom <= 100 ? '100%' : 'none',
                  objectFit: 'contain',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
                className="rounded-lg shadow-2xl transition-transform"
              />
            </div>

            {/* Export Format & Quality Bar */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2">
                {(['image/png', 'image/jpeg', 'image/webp'] as const).map((fmt) => {
                  const label = fmt.split('/')[1].toUpperCase();
                  const isSel = outputFormat === fmt;
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setOutputFormat(fmt)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSel
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {outputFormat !== 'image/png' && (
                <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Quality</span>
                    <span className="font-mono text-cyan-400">{Math.round(outputQuality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="1.0"
                    step="0.05"
                    value={outputQuality}
                    onChange={(e) => setOutputQuality(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isRendering}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  {isRendering ? 'Rendering High-Res...' : 'Generate & Export'}
                </button>

                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  title="Copy image to clipboard"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Output Download Link & Stats */}
            {outputUrl && outputStats && (
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Ready for Download
                  </span>
                  <span className="text-slate-400 font-mono">
                    {FileHandlerService.formatBytes(outputStats.fileSize)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 grid grid-cols-2 gap-1 border-t border-cyan-500/15 pt-2">
                  <div>
                    Resolution: <span className="text-slate-200 font-mono">{outputStats.width}×{outputStats.height}px</span>
                  </div>
                  <div>
                    Format: <span className="text-slate-200 font-mono">{outputStats.format}</span>
                  </div>
                </div>

                <a
                  href={outputUrl}
                  download={`aquatools-text-image-${Date.now()}.${outputFormat.split('/')[1]}`}
                  className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors block text-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
