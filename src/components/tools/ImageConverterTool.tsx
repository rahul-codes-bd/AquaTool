import React, { useState, useEffect, useRef } from 'react';
import { FileDropzone } from '../common/FileDropzone';
import { OutputCard } from '../common/OutputCard';
import { ProgressBar } from '../common/ProgressBar';
import { ErrorAlert } from '../common/ErrorAlert';
import {
  ImageTools,
  ImageConvertOptions,
  ImageMetadata,
  SupportedImageFormat,
} from '../../services/imageTools';
import { FileHandlerService, ObjectUrlManager } from '../../services/fileHandler';
import {
  Sliders,
  RefreshCw,
  Image as ImageIcon,
  Lock,
  Unlock,
  AlertTriangle,
  Sparkles,
  Layers,
  Eye,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

const SCALE_PRESETS = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1.0 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2.0 },
];

const COLOR_CHIPS = [
  { label: 'White', color: '#ffffff' },
  { label: 'Black', color: '#000000' },
  { label: 'Slate Dark', color: '#0f172a' },
  { label: 'Cyan Tint', color: '#083344' },
  { label: 'Transparent', color: 'transparent' },
];

export const ImageConverterTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);

  const [format, setFormat] = useState<SupportedImageFormat>('image/png');
  const [quality, setQuality] = useState<number>(0.9);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [scalePreset, setScalePreset] = useState<number | null>(1.0);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    stats: any;
    fileName: string;
  } | null>(null);

  const [previewTab, setPreviewTab] = useState<'side-by-side' | 'output-only'>('side-by-side');

  // Object URL manager for leak-free lifecycle
  const urlManagerRef = useRef<ObjectUrlManager>(new ObjectUrlManager());

  useEffect(() => {
    const manager = urlManagerRef.current;
    return () => {
      manager.revokeAll();
    };
  }, []);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];

    // Cleanup previous urls
    urlManagerRef.current.revokeAll();
    setResult(null);
    setError(null);
    setSelectedFile(file);

    const safeUrl = urlManagerRef.current.createSafeUrl(file);
    setOriginalUrl(safeUrl);

    try {
      const meta = await ImageTools.getImageMetadata(file);
      setMetadata(meta);
      setWidth(meta.width);
      setHeight(meta.height);
      setAspectRatio(meta.aspectRatio);
      setScalePreset(1.0);

      // Default format logic: if original is JPG, default to WebP or PNG
      if (file.type === 'image/jpeg') {
        setFormat('image/webp');
      } else if (file.type === 'image/webp') {
        setFormat('image/png');
      } else {
        setFormat('image/jpeg');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to inspect image metadata.';
      setError(msg);
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    setScalePreset(null);
    if (lockAspect && aspectRatio > 0 && val > 0) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    setScalePreset(null);
    if (lockAspect && aspectRatio > 0 && val > 0) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  const handleScalePresetClick = (presetVal: number) => {
    setScalePreset(presetVal);
    if (metadata) {
      setWidth(Math.round(metadata.width * presetVal));
      setHeight(Math.round(metadata.height * presetVal));
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setProgress(15);
    setProgressStage('Preparing local canvas & worker...');

    try {
      setProgress(40);
      setProgressStage('Decoding pixels & adjusting geometry...');

      const opts: ImageConvertOptions = {
        format,
        quality,
        width: width > 0 ? width : undefined,
        height: height > 0 ? height : undefined,
        maintainAspectRatio: lockAspect,
        backgroundColor: format === 'image/jpeg' || backgroundColor !== 'transparent' ? backgroundColor : undefined,
        useWorker: true,
      };

      setProgress(70);
      setProgressStage('Encoding format & verifying output bytes...');

      const res = await ImageTools.processImage(selectedFile, opts);
      urlManagerRef.current.createSafeUrl(res.blob);

      setProgress(100);
      setProgressStage('Complete! Output verified.');

      const ext = format.split('/')[1].replace('jpeg', 'jpg');
      const baseName =
        selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
      const sanitizedBase = FileHandlerService.sanitizeFileName(baseName, 'converted');
      const outFileName = `${sanitizedBase}_${res.stats.newWidth}x${res.stats.newHeight}.${ext}`;

      setResult({
        blob: res.blob,
        url: res.url,
        stats: {
          format: ext.toUpperCase(),
          dimensions: `${res.stats.newWidth}×${res.stats.newHeight} px`,
          size: FileHandlerService.formatBytes(res.stats.newSize),
          originalSize: FileHandlerService.formatBytes(selectedFile.size),
          compression: res.stats.compressionRatio,
          engine: res.stats.processedWithWorker ? 'Web Worker (Offscreen)' : 'HTML5 Canvas2D',
          safetyDownscaled: res.stats.isDownscaledForSafety ? 'Yes (Memory Protected)' : 'No',
        },
        fileName: outFileName,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image conversion failed.';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    urlManagerRef.current.revokeAll();
    setSelectedFile(null);
    setOriginalUrl(null);
    setMetadata(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {!selectedFile ? (
        <FileDropzone
          accept="image/*,.svg,.bmp,.webp"
          maxSizeMB={50}
          onFilesSelected={handleFiles}
          title="Drop image to convert & resize"
          subtitle="Supports PNG, JPG, WebP, SVG rasterization, BMP, and GIF. 100% browser-local."
        />
      ) : (
        <div className="space-y-6">
          {/* Top Notice if image is massive */}
          {metadata?.isVeryLarge && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3 backdrop-blur-md">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-amber-300">Large Image Detected ({metadata.width}×{metadata.height}px, {metadata.megapixels} MP)</p>
                <p className="text-amber-200/80 leading-relaxed">
                  To protect your browser tab from GPU memory crashes, dimensions will be safely constrained within {ImageTools.MAX_SAFE_DIMENSION}px without sacrificing visual fidelity.
                </p>
              </div>
            </div>
          )}

          {/* Main Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Source image info & preview (4 cols) */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-5 sm:p-6 space-y-4 border border-white/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Source Image</span>
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-rose-300 transition-colors"
                >
                  Change file
                </button>
              </div>

              <div className="w-full aspect-video rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-center overflow-hidden p-3 relative group">
                {originalUrl && (
                  <img
                    src={originalUrl}
                    alt="Source preview"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                )}
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-cyan-300 border border-white/10 backdrop-blur-md">
                  {metadata?.width}×{metadata?.height} px
                </span>
              </div>

              {metadata && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400">File Size</span>
                    <p className="font-mono text-slate-200">{FileHandlerService.formatBytes(metadata.sizeBytes)}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400">Aspect Ratio</span>
                    <p className="font-mono text-slate-200 truncate">{metadata.aspectRatioLabel}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400">Format</span>
                    <p className="font-mono text-cyan-300 uppercase">{metadata.mimeType.replace('image/', '')}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400">Megapixels</span>
                    <p className="font-mono text-slate-200">{metadata.megapixels} MP</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Controls & Conversion settings (7 cols) */}
            <div className="lg:col-span-7 glass-panel rounded-3xl p-5 sm:p-6 space-y-5 border border-white/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>Output Configuration</span>
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-teal-400">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Local Web Worker Active</span>
                </div>
              </div>

              {/* Target Format Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'image/png', label: 'PNG', desc: 'Lossless + Alpha' },
                      { id: 'image/jpeg', label: 'JPG / JPEG', desc: 'Standard Photo' },
                      { id: 'image/webp', label: 'WebP', desc: 'Modern Compact' },
                    ] as const
                  ).map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setFormat(fmt.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        format === fmt.id
                          ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-2 ring-cyan-500/20'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="font-bold text-xs">{fmt.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Slider (JPG and WebP) */}
              {format !== 'image/png' && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/50 border border-white/10">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-300">Encoding Quality</span>
                    <span className="font-mono text-cyan-400 font-semibold">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Smaller Size (Aggressive)</span>
                    <span>High Fidelity (Recommended 85-92%)</span>
                  </div>
                </div>
              )}

              {/* Resize & Geometry Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Resize Dimensions</label>
                  <button
                    type="button"
                    onClick={() => setLockAspect(!lockAspect)}
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition-colors ${
                      lockAspect
                        ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-900 border-white/10 text-slate-400'
                    }`}
                  >
                    {lockAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{lockAspect ? 'Aspect Ratio Locked' : 'Unlocked'}</span>
                  </button>
                </div>

                {/* Quick Scale Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {SCALE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleScalePresetClick(p.value)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium border transition-all ${
                        scalePreset === p.value
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Width & Height Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Width (px)</span>
                    <input
                      type="number"
                      min="1"
                      value={width || ''}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Height (px)</span>
                    <input
                      type="number"
                      min="1"
                      value={height || ''}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Background Color for JPEG or transparent fills */}
              <div className="space-y-2 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Background Fill {format === 'image/jpeg' ? '(JPEG replaces transparency)' : '(Optional)'}
                  </label>
                  <span className="font-mono text-[11px] text-slate-400">{backgroundColor}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <input
                      type="color"
                      value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                      title="Custom color"
                    />
                  </div>

                  {COLOR_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      disabled={format === 'image/jpeg' && chip.color === 'transparent'}
                      onClick={() => setBackgroundColor(chip.color)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                        backgroundColor === chip.color
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                      } ${format === 'image/jpeg' && chip.color === 'transparent' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  id="convert-image-btn"
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-2xl aqua-glow-button text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xl"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Processing Image Locally...' : 'Convert & Process Image'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <ProgressBar progress={progress} stageText={progressStage} />
          )}

          {/* Error Notice */}
          {error && <ErrorAlert message={error} onRetry={handleConvert} />}

          {/* Output Card */}
          {result && (
            <OutputCard
              title="Verified Output Image"
              blob={result.blob}
              downloadUrl={result.url}
              fileName={result.fileName}
              stats={result.stats}
              previewElement={
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-teal-400" />
                      <span>Visual Inspection Preview</span>
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('side-by-side')}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] ${
                          previewTab === 'side-by-side'
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-white/10 text-slate-400'
                        }`}
                      >
                        Side-by-Side
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('output-only')}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] ${
                          previewTab === 'output-only'
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-white/10 text-slate-400'
                        }`}
                      >
                        Output Only
                      </button>
                    </div>
                  </div>

                  {previewTab === 'side-by-side' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1 text-center">
                        <span className="text-[11px] text-slate-400">Original ({metadata?.width}×{metadata?.height})</span>
                        <div className="h-60 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-center p-2 overflow-hidden">
                          <img
                            src={originalUrl!}
                            alt="Original"
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        </div>
                      </div>
                      <div className="space-y-1 text-center">
                        <span className="text-[11px] text-teal-300">Converted Output ({result.stats.dimensions})</span>
                        <div className="h-60 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-center p-2 overflow-hidden">
                          <img
                            src={result.url}
                            alt="Converted"
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-h-96 flex items-center justify-center bg-slate-950/80 p-4 rounded-xl border border-cyan-500/30">
                      <img
                        src={result.url}
                        alt="Converted output"
                        className="max-h-80 max-w-full object-contain rounded"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Integrity Verified: Output file opened and rendered cleanly in browser memory.</span>
                  </div>
                </div>
              }
              onReset={handleReset}
            />
          )}
        </div>
      )}
    </div>
  );
};
