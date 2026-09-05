import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Layers,
  ShieldCheck,
  Zap,
  Sliders,
  Maximize2,
  Crop as CropIcon,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Share2,
  Palette,
  FileSearch,
  Lock,
  Boxes,
  Code2,
  Eye,
  Trash2,
  Plus,
} from 'lucide-react';
import { ImageToolDefinition, ImageFileItem, ImageProcessingConfig, ImageMetadataReport, ImageStats, PaletteExtractionResult } from '../../types/image';
import { IMAGE_CONFIG } from '../../config/imageConfig';
import { ImageEngine } from '../../services/imageEngine';
import { ImageDropzone } from '../image/ImageDropzone';
import { ImageFileList } from '../image/ImageFileList';
import { ImagePreviewCanvas } from '../image/ImagePreviewCanvas';
import { BeforeAfterSlider } from '../image/BeforeAfterSlider';
import { DimensionControls } from '../image/DimensionControls';
import { QualityControl } from '../image/QualityControl';
import { FormatSelector } from '../image/FormatSelector';
import { WatermarkControls } from '../image/WatermarkControls';
import { MetadataPanel } from '../image/MetadataPanel';
import { PrivacyRiskPanel } from '../image/PrivacyRiskPanel';
import { PalettePanel } from '../image/PalettePanel';
import { ImageDownloadButton } from '../image/ImageDownloadButton';
import { ZipExportButton } from '../image/ZipExportButton';
import { OutputSummary } from '../image/OutputSummary';
import { ImageEditorControls } from '../image/ImageEditorControls';
import { AquaToolsHub } from '../aquatools/AquaToolsHub';
import { ErrorRecoveryPanel } from '../image/ErrorRecoveryPanel';
import { DynamicIcon } from '../common/DynamicIcon';

interface ImageToolRunnerPageProps {
  tool: ImageToolDefinition;
  initialFiles?: File[];
  onBack: () => void;
  onSelectOtherTool?: (slug: string) => void;
}

export const ImageToolRunnerPage: React.FC<ImageToolRunnerPageProps> = ({
  tool,
  initialFiles,
  onBack,
  onSelectOtherTool,
}) => {
  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'adjust' | 'compare' | 'metadata' | 'palette'>('adjust');

  // Base Processing Config state
  const [config, setConfig] = useState<ImageProcessingConfig>({
    format: tool.outputTypes[0] || 'image/png',
    quality: 0.9,
    maintainAspectRatio: true,
    rotationAngle: 0,
    flipHorizontal: false,
    flipVertical: false,
    backgroundColor: 'transparent',
    watermarkOpacity: 0.6,
    watermarkPosition: 'bottom-right',
  });

  // Specific Tool Preset Initializations
  useEffect(() => {
    // Customize initial config per tool slug
    const newConfig: ImageProcessingConfig = {
      format: tool.outputTypes[0] || 'image/png',
      quality: 0.88,
      maintainAspectRatio: true,
      rotationAngle: 0,
      flipHorizontal: false,
      flipVertical: false,
      backgroundColor: 'transparent',
      watermarkOpacity: 0.6,
      watermarkPosition: 'bottom-right',
    };

    if (tool.slug === 'convert-to-webp') newConfig.format = 'image/webp';
    if (tool.slug === 'convert-to-avif') newConfig.format = 'image/avif';
    if (tool.slug === 'png-to-jpg') {
      newConfig.format = 'image/jpeg';
      newConfig.backgroundColor = '#ffffff';
    }
    if (tool.slug === 'jpg-to-png') newConfig.format = 'image/png';
    if (tool.slug === 'ico-generator') newConfig.format = 'image/x-icon';

    if (tool.slug === 'remove-exif-metadata' || tool.slug === 'view-exif-metadata') {
      setActiveTab('metadata');
    } else if (tool.slug === 'extract-color-palette' || tool.slug === 'image-color-picker') {
      setActiveTab('palette');
    } else if (tool.slug === 'compare-images' || tool.slug === 'compress-image') {
      setActiveTab('compare');
    }

    setConfig(newConfig);
  }, [tool.slug, tool.outputTypes]);

  // Load initial files if provided
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      handleFilesSelected(initialFiles);
    }
  }, [initialFiles]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      ImageEngine.cleanupAllTrackedUrls();
    };
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    setGlobalError(null);
    const newItems: ImageFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = await ImageEngine.validateImageFile(file);

      if (!validation.isValid) {
        setGlobalError(validation.error || 'Failed to validate image format.');
        continue;
      }

      const previewUrl = ImageEngine.createTrackedUrl(file);

      let metadata: ImageMetadataReport | undefined = undefined;
      try {
        metadata = await ImageEngine.inspectImageMetadata(file);
      } catch {
        // Non-fatal
      }

      const item: ImageFileItem = {
        id: `img_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        dimensions: metadata?.dimensions,
        metadata,
        status: 'pending',
        progress: 0,
      };

      newItems.push(item);
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      if (items.length === 0 && newItems[0].dimensions) {
        setConfig((c) => ({
          ...c,
          width: newItems[0].dimensions?.width,
          height: newItems[0].dimensions?.height,
        }));
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl) ImageEngine.revokeTrackedUrl(target.previewUrl);
      if (target?.resultUrl) ImageEngine.revokeTrackedUrl(target.resultUrl);
      const filtered = prev.filter((i) => i.id !== id);
      if (selectedIndex >= filtered.length) {
        setSelectedIndex(Math.max(0, filtered.length - 1));
      }
      return filtered;
    });
  };

  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.previewUrl) ImageEngine.revokeTrackedUrl(item.previewUrl);
      if (item.resultUrl) ImageEngine.revokeTrackedUrl(item.resultUrl);
    });
    setItems([]);
    setSelectedIndex(0);
    setGlobalError(null);
  };

  const currentItem = items[selectedIndex];

  // Primary Processing Pipeline
  const processActiveItem = useCallback(async () => {
    if (!currentItem) return;

    try {
      setIsProcessing(true);
      setGlobalError(null);

      // 1. Create source HTMLImageElement in memory
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image into canvas buffer.'));
        img.src = currentItem.previewUrl;
      });

      const origDimensions = currentItem.dimensions || {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      };

      // 2. Render Transformations to Canvas
      const canvas = await ImageEngine.renderToCanvas(img, config, origDimensions);

      // 3. Extract Palette if requested
      const palette = ImageEngine.extractPalette(canvas, 6);

      // 4. Export Canvas to Blob with chosen MIME format & quality
      const { blob, url, stats } = await ImageEngine.exportCanvas(canvas, config);

      // Determine result filename
      const baseName = currentItem.name.replace(/\.[^/.]+$/, '');
      const formatExt = config.format?.replace('image/', '') || 'png';
      const cleanExt = formatExt === 'x-icon' ? 'ico' : formatExt;
      const resultFileName = `${baseName}_processed.${cleanExt}`;

      // Update current item in state
      setItems((prev) => {
        const next = [...prev];
        const oldResult = next[selectedIndex]?.resultUrl;
        if (oldResult && oldResult !== url) {
          ImageEngine.revokeTrackedUrl(oldResult);
        }

        next[selectedIndex] = {
          ...next[selectedIndex],
          resultBlob: blob,
          resultUrl: url,
          resultFileName,
          stats,
          palette,
          status: 'completed',
          progress: 100,
        };
        return next;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing failed';
      setGlobalError(msg);
      setItems((prev) => {
        const next = [...prev];
        if (next[selectedIndex]) {
          next[selectedIndex] = { ...next[selectedIndex], status: 'error', error: msg };
        }
        return next;
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentItem, config, selectedIndex]);

  // Process item when config changes or new item is selected
  useEffect(() => {
    if (currentItem && currentItem.previewUrl) {
      const timer = setTimeout(() => {
        processActiveItem();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [
    currentItem?.id,
    config.format,
    config.quality,
    config.width,
    config.height,
    config.scalePercent,
    config.rotationAngle,
    config.flipHorizontal,
    config.flipVertical,
    config.grayscale,
    config.brightness,
    config.contrast,
    config.backgroundColor,
    config.watermarkText,
    config.watermarkOpacity,
    config.watermarkPosition,
  ]);

  // Batch Process All Items
  const handleBatchProcessAll = async () => {
    if (items.length === 0 || isProcessing) return;
    setIsProcessing(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Image decode failure'));
          img.src = item.previewUrl;
        });

        const dims = item.dimensions || { width: img.naturalWidth, height: img.naturalHeight };
        const canvas = await ImageEngine.renderToCanvas(img, config, dims);
        const { blob, url, stats } = await ImageEngine.exportCanvas(canvas, config);

        const baseName = item.name.replace(/\.[^/.]+$/, '');
        const formatExt = config.format?.replace('image/', '') || 'png';
        const cleanExt = formatExt === 'x-icon' ? 'ico' : formatExt;
        const resultFileName = `${baseName}_processed.${cleanExt}`;

        setItems((prev) => {
          const next = [...prev];
          next[i] = {
            ...next[i],
            resultBlob: blob,
            resultUrl: url,
            resultFileName,
            stats,
            status: 'completed',
            progress: 100,
          };
          return next;
        });
      } catch (err) {
        console.error(`Error processing batch item ${item.name}:`, err);
      }
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 py-2">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Image Studio Hub</span>
          </button>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <DynamicIcon name={tool.iconName} size={16} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">{tool.title}</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">{tool.category.toUpperCase()} • 100% Client-Side</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {items.length > 1 && (
            <button
              type="button"
              onClick={handleBatchProcessAll}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all text-xs font-semibold flex items-center gap-1.5"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Process All Batch ({items.length})</span>
            </button>
          )}

          {items.length > 0 && currentItem?.resultBlob && (
            <ImageDownloadButton
              blob={currentItem.resultBlob}
              downloadUrl={currentItem.resultUrl}
              fileName={currentItem.resultFileName || currentItem.name}
              formatExtension={config.format?.replace('image/', '') || 'png'}
              sizeBytes={currentItem.stats?.newSize}
              label="Download Image"
            />
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      {items.length === 0 ? (
        /* Empty State: Dropzone */
        <div className="space-y-6">
          <ImageDropzone
            onFilesSelected={handleFilesSelected}
            title={`Select or drop images to use with ${tool.title}`}
            subtitle={tool.fullDescription || tool.description}
          />

          <div className="p-5 rounded-3xl bg-white/5 border border-white/10 text-xs text-slate-400 space-y-2 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Privacy & Architecture Guarantee</span>
            </div>
            <p className="leading-relaxed">{tool.privacyNote}</p>
          </div>
        </div>
      ) : (
        /* Active Workspace with Workbench Controls & Visual Preview */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Visual Preview & Metadata */}
          <div className="lg:col-span-7 space-y-4">
            {/* View Mode Tabs */}
            <div className="flex items-center justify-between p-1 bg-white/5 border border-white/10 rounded-2xl text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('adjust')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    activeTab === 'adjust'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Processed Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('compare')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'compare'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Before & After</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('metadata')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'metadata'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileSearch className="w-3.5 h-3.5" />
                  <span>EXIF & Privacy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('palette')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'palette'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Palette</span>
                </button>
              </div>

              {/* Status spinner indicator */}
              {isProcessing && (
                <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-medium px-2 py-0.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                  <span>Rendering...</span>
                </div>
              )}
            </div>

            {/* View Tab Display */}
            {activeTab === 'adjust' && (
              <ImagePreviewCanvas
                imageUrl={currentItem?.resultUrl || currentItem?.previewUrl}
                dimensions={
                  currentItem?.stats
                    ? { width: currentItem.stats.newWidth, height: currentItem.stats.newHeight }
                    : currentItem?.dimensions
                }
                title={currentItem?.name}
              />
            )}

            {activeTab === 'compare' && (
              <BeforeAfterSlider
                originalUrl={currentItem.previewUrl}
                processedUrl={currentItem.resultUrl || currentItem.previewUrl}
                originalSizeText={
                  currentItem.size ? `${(currentItem.size / 1024).toFixed(1)} KB` : undefined
                }
                processedSizeText={
                  currentItem.stats ? `${(currentItem.stats.newSize / 1024).toFixed(1)} KB` : undefined
                }
              />
            )}

            {activeTab === 'metadata' && (
              <div className="space-y-4">
                {currentItem.metadata?.privacyRisks && (
                  <PrivacyRiskPanel
                    risks={currentItem.metadata.privacyRisks}
                    onAutoFix={() => {
                      setConfig((c) => ({ ...c, format: 'image/png' }));
                      processActiveItem();
                    }}
                  />
                )}
                <MetadataPanel
                  metadata={currentItem.metadata}
                  onStripExif={() => {
                    processActiveItem();
                  }}
                />
              </div>
            )}

            {activeTab === 'palette' && (
              <div className="space-y-4">
                {currentItem.palette ? (
                  <PalettePanel palette={currentItem.palette} />
                ) : (
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center text-slate-400 text-xs">
                    Render the image to extract its color palette.
                  </div>
                )}
              </div>
            )}

            {/* Output Metrics Summary */}
            {currentItem?.stats && <OutputSummary stats={currentItem.stats} fileName={currentItem.name} />}

            {/* Error Panel if any */}
            {globalError && <ErrorRecoveryPanel error={globalError} onRetry={processActiveItem} />}

            {/* Multi-item File List */}
            {items.length > 1 && (
              <ImageFileList
                items={items}
                selectedIndex={selectedIndex}
                onSelectItem={(idx) => setSelectedIndex(idx)}
                onRemoveItem={handleRemoveItem}
                onClearAll={handleClearAll}
              />
            )}
          </div>

          {/* Right Column: Interactive Settings Workbench */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/70 border border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Processing Controls</span>
                </div>
                <button
                  type="button"
                  onClick={processActiveItem}
                  disabled={isProcessing}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>Re-render</span>
                </button>
              </div>

              {/* Format Selector */}
              <FormatSelector
                selectedFormat={config.format || 'image/png'}
                onFormatChange={(fmt) => setConfig((c) => ({ ...c, format: fmt }))}
              />

              {/* Quality & Compression */}
              <QualityControl
                quality={config.quality !== undefined ? config.quality : 0.9}
                onChange={(q) => setConfig((c) => ({ ...c, quality: q }))}
                format={config.format}
                originalSizeBytes={currentItem?.size}
                stripMetadata={config.stripMetadata !== false}
                onStripMetadataChange={(strip) => setConfig((c) => ({ ...c, stripMetadata: strip }))}
                targetSizeBytes={config.targetSizeBytes}
                onTargetSizeChange={(targetBytes) => setConfig((c) => ({ ...c, targetSizeBytes: targetBytes }))}
              />

              {/* Dimensions & Resizing */}
              {currentItem?.dimensions && (
                <DimensionControls
                  originalDimensions={currentItem.dimensions}
                  width={config.width || currentItem.dimensions.width}
                  height={config.height || currentItem.dimensions.height}
                  maintainAspectRatio={config.maintainAspectRatio !== false}
                  scalePercent={config.scalePercent || 1.0}
                  onWidthChange={(w) => setConfig((c) => ({ ...c, width: w }))}
                  onHeightChange={(h) => setConfig((c) => ({ ...c, height: h }))}
                  onMaintainAspectRatioToggle={() =>
                    setConfig((c) => ({ ...c, maintainAspectRatio: !c.maintainAspectRatio }))
                  }
                  onScalePercentChange={(p) => setConfig((c) => ({ ...c, scalePercent: p }))}
                  onReset={() =>
                    setConfig((c) => ({
                      ...c,
                      width: currentItem.dimensions?.width,
                      height: currentItem.dimensions?.height,
                      scalePercent: 1.0,
                    }))
                  }
                />
              )}

              {/* Transform (Rotate & Flip) */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-slate-200">Orientation & Flip</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        rotationAngle: ((c.rotationAngle || 0) + 90) % 360,
                      }))
                    }
                    className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-slate-300 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rotate 90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, flipHorizontal: !c.flipHorizontal }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      config.flipHorizontal
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip X</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, flipVertical: !c.flipVertical }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      config.flipVertical
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Flip Y</span>
                  </button>
                </div>
              </div>

              {/* Watermark Controls */}
              <div className="pt-2 border-t border-white/10">
                <WatermarkControls
                  watermarkText={config.watermarkText || ''}
                  opacity={config.watermarkOpacity !== undefined ? config.watermarkOpacity : 0.6}
                  position={config.watermarkPosition || 'bottom-right'}
                  onTextChange={(txt) => setConfig((c) => ({ ...c, watermarkText: txt }))}
                  onOpacityChange={(op) => setConfig((c) => ({ ...c, watermarkOpacity: op }))}
                  onPositionChange={(pos) => setConfig((c) => ({ ...c, watermarkPosition: pos }))}
                />
              </div>

              {/* Advanced Image Editor Controls */}
              <div className="pt-2 border-t border-white/10">
                <ImageEditorControls
                  config={config}
                  onChange={setConfig}
                  onReset={() =>
                    setConfig((c) => ({
                      ...c,
                      grayscale: false,
                      sepia: false,
                      invert: false,
                      brightness: 0,
                      contrast: 0,
                      saturation: 0,
                      exposure: 0,
                      temperature: 0,
                      blurRadius: 0,
                      pixelateSize: 0,
                      sharpen: false,
                      borderSize: 0,
                      borderColor: '#ffffff',
                      borderRadius: 0,
                      customText: '',
                      shapeOverlay: 'none',
                    }))
                  }
                />
              </div>

              {/* Download & Export Buttons */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                {currentItem?.resultBlob && (
                  <ImageDownloadButton
                    blob={currentItem.resultBlob}
                    downloadUrl={currentItem.resultUrl}
                    fileName={currentItem.resultFileName || currentItem.name}
                    formatExtension={config.format?.replace('image/', '') || 'png'}
                    sizeBytes={currentItem.stats?.newSize}
                    className="w-full"
                  />
                )}

                {items.length > 1 && (
                  <ZipExportButton
                    items={items}
                    zipFileName="aquatools_processed_images.zip"
                  />
                )}
              </div>
            </div>

            {/* Add More Files Drop Area */}
            <div className="pt-1">
              <ImageDropzone
                onFilesSelected={handleFilesSelected}
                compact
                title="Add more images to queue"
                subtitle="Supports batch processing with one-click ZIP export"
              />
            </div>

            {/* AquaTools Advanced Suite Hub */}
            <div className="pt-6">
              <AquaToolsHub
                currentFile={currentItem?.file}
                currentBlob={currentItem?.resultBlob}
                currentConfig={config}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
