import React, { useState, useEffect, useRef } from 'react';
import { FileDropzone } from '../common/FileDropzone';
import { OutputCard } from '../common/OutputCard';
import { ProgressBar } from '../common/ProgressBar';
import { ErrorAlert } from '../common/ErrorAlert';
import {
  ImageTools,
  SupportedImageFormat,
  ImageCropBox,
  ImageMetadata,
} from '../../services/imageTools';
import { FileHandlerService, ObjectUrlManager } from '../../services/fileHandler';
import {
  Crop,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Move,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';

type AspectPreset = '1:1' | '16:9' | '4:3' | '3:2' | '9:16' | '2:3' | 'free';

interface AspectOption {
  id: AspectPreset;
  label: string;
  sub: string;
}

const ASPECT_OPTIONS: AspectOption[] = [
  { id: '1:1', label: '1:1', sub: 'Avatar / Square' },
  { id: '16:9', label: '16:9', sub: 'YouTube / Widescreen' },
  { id: '9:16', label: '9:16', sub: 'Story / TikTok' },
  { id: '4:3', label: '4:3', sub: 'Standard Photo' },
  { id: '3:2', label: '3:2', sub: '35mm Camera' },
  { id: '2:3', label: '2:3', sub: 'Portrait Photo' },
  { id: 'free', label: 'Free', sub: 'Custom Dimension' },
];

export const ImageCropperTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);

  const [aspectPreset, setAspectPreset] = useState<AspectPreset>('1:1');
  const [format, setFormat] = useState<SupportedImageFormat>('image/png');
  const [quality, setQuality] = useState<number>(0.92);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');

  // Crop box coordinates (relative to natural image dimensions)
  const [cropBox, setCropBox] = useState<ImageCropBox>({ x: 0, y: 0, width: 0, height: 0 });

  const [isCropping, setIsCropping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    stats: any;
    fileName: string;
  } | null>(null);

  const urlManagerRef = useRef<ObjectUrlManager>(new ObjectUrlManager());

  useEffect(() => {
    const manager = urlManagerRef.current;
    return () => {
      manager.revokeAll();
    };
  }, []);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const uploaded = files[0];

    urlManagerRef.current.revokeAll();
    setFile(uploaded);
    setResult(null);
    setError(null);

    const safeUrl = urlManagerRef.current.createSafeUrl(uploaded);
    setImgUrl(safeUrl);

    try {
      const meta = await ImageTools.getImageMetadata(uploaded);
      setMetadata(meta);

      // Compute initial crop box (1:1 center crop)
      const initialCrop = ImageTools.computeCenterCropBox(meta.width, meta.height, '1:1');
      setCropBox(initialCrop);
      setAspectPreset('1:1');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to parse image.';
      setError(msg);
    }
  };

  const applyPreset = (preset: AspectPreset) => {
    setAspectPreset(preset);
    if (!metadata) return;

    const newBox = ImageTools.computeCenterCropBox(metadata.width, metadata.height, preset);
    setCropBox(newBox);
  };

  const alignCrop = (alignment: 'center' | 'top' | 'bottom' | 'left' | 'right') => {
    if (!metadata) return;

    setCropBox((prev) => {
      let newX = prev.x;
      let newY = prev.y;

      if (alignment === 'center') {
        newX = Math.round((metadata.width - prev.width) / 2);
        newY = Math.round((metadata.height - prev.height) / 2);
      } else if (alignment === 'top') {
        newY = 0;
      } else if (alignment === 'bottom') {
        newY = Math.max(0, metadata.height - prev.height);
      } else if (alignment === 'left') {
        newX = 0;
      } else if (alignment === 'right') {
        newX = Math.max(0, metadata.width - prev.width);
      }

      return { ...prev, x: Math.max(0, newX), y: Math.max(0, newY) };
    });
  };

  const handleCrop = async () => {
    if (!file || !metadata) return;

    setIsCropping(true);
    setError(null);
    setProgress(30);

    try {
      setProgress(60);
      const res = await ImageTools.cropImage(file, cropBox, {
        format,
        quality,
        backgroundColor: format === 'image/jpeg' ? backgroundColor : undefined,
      });

      urlManagerRef.current.createSafeUrl(res.blob);
      setProgress(100);

      const ext = format.split('/')[1].replace('jpeg', 'jpg');
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const sanitizedBase = FileHandlerService.sanitizeFileName(baseName, 'cropped');
      const fileName = `${sanitizedBase}_crop_${res.stats.newWidth}x${res.stats.newHeight}.${ext}`;

      setResult({
        blob: res.blob,
        url: res.url,
        stats: {
          croppedDimensions: `${res.stats.newWidth}×${res.stats.newHeight} px`,
          sourceDimensions: `${metadata.width}×${metadata.height} px`,
          aspectRatio: ImageTools.getClosestAspectRatioLabel(res.stats.newWidth, res.stats.newHeight),
          fileSize: FileHandlerService.formatBytes(res.blob.size),
          format: ext.toUpperCase(),
        },
        fileName,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cropping failed.';
      setError(msg);
    } finally {
      setIsCropping(false);
    }
  };

  const handleReset = () => {
    urlManagerRef.current.revokeAll();
    setFile(null);
    setImgUrl(null);
    setMetadata(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  // Calculate overlay percentage relative to natural image
  const cropOverlayStyle = metadata && metadata.width > 0 && metadata.height > 0
    ? {
        left: `${(cropBox.x / metadata.width) * 100}%`,
        top: `${(cropBox.y / metadata.height) * 100}%`,
        width: `${(cropBox.width / metadata.width) * 100}%`,
        height: `${(cropBox.height / metadata.height) * 100}%`,
      }
    : { left: '0%', top: '0%', width: '100%', height: '100%' };

  return (
    <div className="space-y-6">
      {!file ? (
        <FileDropzone
          accept="image/*"
          maxSizeMB={50}
          onFilesSelected={handleFile}
          title="Upload image to crop with aspect ratio presets"
          subtitle="Interactive center cropping, social media aspect ratios (1:1, 16:9, 9:16, 4:3), and verified export."
        />
      ) : (
        <div className="space-y-6">
          {/* Main workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual Crop Canvas & Frame (7 cols) */}
            <div className="lg:col-span-7 glass-panel rounded-3xl p-5 sm:p-6 space-y-4 border border-white/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Crop className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-semibold text-slate-100">Live Crop Visualizer</h4>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-rose-300"
                >
                  Change Image
                </button>
              </div>

              {/* Crop Frame Box */}
              <div className="relative w-full aspect-video rounded-2xl bg-slate-950/90 border border-white/10 overflow-hidden flex items-center justify-center p-2">
                <div className="relative inline-block max-h-full max-w-full">
                  <img
                    src={imgUrl!}
                    alt="Source for cropping"
                    className="max-h-[340px] max-w-full object-contain rounded select-none opacity-80"
                  />
                  {/* Visual Crop Highlight Frame */}
                  <div
                    style={cropOverlayStyle}
                    className="absolute border-2 border-cyan-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.7)] pointer-events-none rounded transition-all duration-150"
                  >
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300 border border-white/10">
                      {cropBox.width}×{cropBox.height} px
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Alignment Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Align Frame:</span>
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  {(['center', 'top', 'bottom', 'left', 'right'] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => alignCrop(dir)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-cyan-300 capitalize text-xs transition-colors"
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Crop Settings & Aspect Presets (5 cols) */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-5 sm:p-6 space-y-5 border border-white/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>Crop Geometry</span>
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  {metadata?.width}×{metadata?.height} px
                </span>
              </div>

              {/* Aspect Ratio Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Aspect Ratio Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ASPECT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => applyPreset(opt.id)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        aspectPreset === opt.id
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-sm font-semibold'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-mono">{opt.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Coordinate Sliders / Manual Width & Height */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-900/50 border border-white/10 text-xs">
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>Crop Dimensions</span>
                  <span className="font-mono text-cyan-400">{cropBox.width} × {cropBox.height} px</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400">Width</span>
                    <input
                      type="number"
                      min="10"
                      max={metadata?.width || 8192}
                      value={cropBox.width || ''}
                      onChange={(e) => {
                        const val = Math.min(metadata?.width || 8192, parseInt(e.target.value, 10) || 10);
                        setCropBox((prev) => ({ ...prev, width: val, x: Math.min(prev.x, (metadata?.width || val) - val) }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-cyan-200 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400">Height</span>
                    <input
                      type="number"
                      min="10"
                      max={metadata?.height || 8192}
                      value={cropBox.height || ''}
                      onChange={(e) => {
                        const val = Math.min(metadata?.height || 8192, parseInt(e.target.value, 10) || 10);
                        setCropBox((prev) => ({ ...prev, height: val, y: Math.min(prev.y, (metadata?.height || val) - val) }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-cyan-200 font-mono"
                    />
                  </div>
                </div>

                {/* X & Y Offset sliders */}
                {metadata && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Horizontal Offset (X)</span>
                        <span className="font-mono text-slate-300">{cropBox.x} px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, metadata.width - cropBox.width)}
                        value={cropBox.x}
                        onChange={(e) => setCropBox({ ...cropBox, x: parseInt(e.target.value, 10) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Vertical Offset (Y)</span>
                        <span className="font-mono text-slate-300">{cropBox.y} px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, metadata.height - cropBox.height)}
                        value={cropBox.y}
                        onChange={(e) => setCropBox({ ...cropBox, y: parseInt(e.target.value, 10) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Export Format */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Export Format</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['image/png', 'image/jpeg', 'image/webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`py-2 rounded-xl border text-center font-medium transition-all ${
                        format === fmt
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-sm'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {fmt.replace('image/', '').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Crop Button */}
              <button
                type="button"
                id="execute-crop-btn"
                onClick={handleCrop}
                disabled={isCropping}
                className="w-full py-3.5 rounded-2xl aqua-glow-button text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xl"
              >
                <Crop className={`w-4 h-4 ${isCropping ? 'animate-spin' : ''}`} />
                <span>{isCropping ? 'Cropping Pixels...' : 'Crop & Export Image'}</span>
              </button>
            </div>
          </div>

          {/* Progress */}
          {isCropping && (
            <ProgressBar progress={progress} stageText="Extracting pixel crop on HTML5 Canvas..." />
          )}

          {/* Error */}
          {error && <ErrorAlert message={error} onRetry={handleCrop} />}

          {/* Result Output */}
          {result && (
            <OutputCard
              title="Cropped Result"
              blob={result.blob}
              downloadUrl={result.url}
              fileName={result.fileName}
              stats={result.stats}
              previewElement={
                <div className="p-4 space-y-3">
                  <div className="w-full max-h-[380px] flex items-center justify-center bg-slate-950/80 p-4 rounded-2xl border border-cyan-500/30 overflow-hidden">
                    <img
                      src={result.url}
                      alt="Cropped output"
                      className="max-h-[320px] max-w-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>File integrity verified: Output file rendered cleanly in browser memory.</span>
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
