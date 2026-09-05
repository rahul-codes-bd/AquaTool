import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Download,
  Trash2,
  RefreshCw,
  FileText,
  CheckCircle2,
  Sliders,
  Sparkles,
  Package,
} from 'lucide-react';
import { FileConversionTool, ConversionQueueItem, UseCasePreset } from '../../types/fileConv';
import { FileConvEngine } from '../../services/fileconv/fileConvEngine';
import { UniversalFileDropzone } from './UniversalFileDropzone';
import { CapabilityNotice } from './CapabilityNotice';
import { PrivacyBadge } from './PrivacyBadge';
import { ConversionReport } from './ConversionReport';
import { ErrorRecoveryPanel } from './ErrorRecoveryPanel';
import { FormatSelector } from './FormatSelector';
import { ConversionPresetSelector } from './ConversionPresetSelector';
import { SafeFilenameEditor } from './SafeFilenameEditor';
import { BatchZipExport } from './BatchZipExport';
import { OutputPreview } from './OutputPreview';
import { MetadataSummary } from './MetadataSummary';
import { AdSlotPlaceholder } from './AdSlotPlaceholder';
import { MediaOptionsEditor } from './MediaOptionsEditor';

import { SmartRecommendationEngine } from './SmartRecommendationEngine';
import { PipelineVisualizer } from './PipelineVisualizer';
import { BatchPresetsStudio, PresetRecipe } from './BatchPresetsStudio';
import { QualitySizeLab } from './QualitySizeLab';
import { SafeNamingStudio } from './SafeNamingStudio';
import { FileHealthScanner } from './FileHealthScanner';
import { FormatCompatibilityChecker } from './FormatCompatibilityChecker';
import { MediaTechnicalReport } from './MediaTechnicalReport';
import { ExtendedConversionReport } from './ExtendedConversionReport';
import { OfflineIndicator } from '../pwa/OfflineIndicator';

interface FileConvRunnerPageProps {
  tool: FileConversionTool;
  onBack: () => void;
}

export const FileConvRunnerPage: React.FC<FileConvRunnerPageProps> = ({ tool, onBack }) => {
  const [queue, setQueue] = useState<ConversionQueueItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>(tool.outputFormats[0] || 'pdf');
  const [preset, setPreset] = useState<UseCasePreset>('web');
  const [activeBatchPresetId, setActiveBatchPresetId] = useState<string | undefined>(undefined);
  const [pipelineStage, setPipelineStage] = useState<'idle' | 'scanning' | 'decoding' | 'optimizing' | 'encoding' | 'completed'>('idle');
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [quality, setQuality] = useState<number>(0.9);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [filenamePattern, setFilenamePattern] = useState<string>('converted_output');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaOpts, setMediaOpts] = useState<{
    startTime?: number;
    endTime?: number;
    sampleRate?: number;
    channels?: number;
    frameTime?: number;
  }>({});

  const createdResultUrlsRef = useRef<Set<string>>(new Set());

  const handleSelectBatchPreset = (recipe: PresetRecipe) => {
    setActiveBatchPresetId(recipe.id);
    setTargetFormat(recipe.targetFormat);
    setQuality(recipe.quality);
    if (recipe.width) setWidth(recipe.width);
    if (recipe.sampleRate) setMediaOpts((prev) => ({ ...prev, sampleRate: recipe.sampleRate, channels: recipe.channels }));
  };

  const handleFilesSelected = (files: File[]) => {
    const newItems: ConversionQueueItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      sourceFormat: file.name.split('.').pop() || 'bin',
      targetFormat,
      status: 'pending',
      progress: 0,
    }));
    setQueue((prev) => [...prev, ...newItems]);
  };

  useEffect(() => {
    return () => {
      // Revoke all created result URLs on component unmount
      createdResultUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      createdResultUrlsRef.current.clear();
    };
  }, []);

  const removeItem = (id: string) => {
    setQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.resultUrl) {
        URL.revokeObjectURL(target.resultUrl);
        createdResultUrlsRef.current.delete(target.resultUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearQueue = () => {
    queue.forEach((item) => {
      if (item.resultUrl) {
        URL.revokeObjectURL(item.resultUrl);
        createdResultUrlsRef.current.delete(item.resultUrl);
      }
    });
    setQueue([]);
  };

  const handlePresetChange = (p: UseCasePreset) => {
    setPreset(p);
    if (p === 'web') {
      setQuality(0.85);
      setWidth(1200);
    } else if (p === 'mobile') {
      setQuality(0.75);
      setWidth(800);
    } else if (p === 'print') {
      setQuality(1.0);
      setWidth(undefined);
    } else if (p === 'social') {
      setQuality(0.9);
      setWidth(1080);
    }
  };

  const processQueue = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setPipelineStage('scanning');
    setPipelineProgress(10);

    const updatedQueue = [...queue];
    for (let i = 0; i < updatedQueue.length; i++) {
      if (updatedQueue[i].status === 'success') continue;
      updatedQueue[i].status = 'processing';
      setPipelineStage('decoding');
      setPipelineProgress(30);
      setQueue([...updatedQueue]);

      try {
        setPipelineStage('optimizing');
        setPipelineProgress(50);
        const res = await FileConvEngine.convertFile(
          updatedQueue[i].file,
          {
            targetFormat,
            quality,
            width,
            height,
            startTime: mediaOpts.startTime,
            endTime: mediaOpts.endTime,
            sampleRate: mediaOpts.sampleRate,
            channels: mediaOpts.channels,
            frameTime: mediaOpts.frameTime,
          },
          (prog) => {
            updatedQueue[i].progress = prog;
            if (prog > 60) setPipelineStage('encoding');
            setPipelineProgress(prog);
            setQueue([...updatedQueue]);
          }
        );

        updatedQueue[i].status = 'success';
        updatedQueue[i].resultBlob = res.blob;
        updatedQueue[i].resultUrl = res.url;
        if (res.url) {
          createdResultUrlsRef.current.add(res.url);
        }
        updatedQueue[i].resultFilename = res.filename;
        updatedQueue[i].report = res.report;
        updatedQueue[i].progress = 100;
      } catch (err: any) {
        updatedQueue[i].status = 'error';
        updatedQueue[i].error = err.message || 'Conversion failed.';
        setErrorMessage(err.message || 'Conversion failed.');
      }
      setQueue([...updatedQueue]);
    }
    setPipelineStage('completed');
    setPipelineProgress(100);
    setIsProcessing(false);
  };

  const downloadAllZip = async () => {
    const successItems = queue.filter((i) => i.status === 'success' && i.resultBlob && i.resultFilename);
    if (successItems.length === 0) return;

    const zipPayload = successItems.map((item) => ({
      filename: item.resultFilename || 'output',
      blob: item.resultBlob!,
    }));

    const res = await FileConvEngine.createZipBatch(zipPayload);
    const link = document.createElement('a');
    link.href = res.url;
    link.download = `${tool.slug}-batch.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(res.url);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Back to Hub</span>
        </button>
        <PrivacyBadge processingMode={tool.processingMode} />
      </div>

      {/* Title & Description */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{tool.title}</h1>
        <p className="text-xs text-slate-400">{tool.description}</p>
      </div>

      {/* Universal Batch Presets */}
      <BatchPresetsStudio
        onSelectPreset={handleSelectBatchPreset}
        activePresetId={activeBatchPresetId}
      />

      {/* Dropzone */}
      <UniversalFileDropzone
        onFilesSelected={handleFilesSelected}
        acceptedExtensions={tool.acceptedExtensions}
        maxRecommendedBytes={tool.maxRecommendedBytes}
      />

      {/* Pre-flight Scanner & Smart Recommendation when files exist */}
      {queue.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileHealthScanner file={queue[0].file} />
          <SmartRecommendationEngine
            file={queue[0].file}
            onApplyFormat={(fmt, q) => {
              setTargetFormat(fmt);
              if (q) setQuality(q);
            }}
          />
        </div>
      )}

      {/* Controls & Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
          <FormatSelector
            availableFormats={tool.outputFormats}
            selectedFormat={targetFormat}
            onChange={setTargetFormat}
            disabled={isProcessing}
          />
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
          <ConversionPresetSelector
            selectedPreset={preset}
            onSelectPreset={handlePresetChange}
            disabled={isProcessing}
          />
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
          <SafeFilenameEditor
            value={filenamePattern}
            onChange={setFilenamePattern}
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* Quality-vs-Size Lab & Safe Output Naming Studio */}
      {queue.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QualitySizeLab
            file={queue[0].file}
            targetFormat={targetFormat}
            initialQuality={quality}
            onQualityChange={setQuality}
          />
          <SafeNamingStudio
            sampleFilename={queue[0].file.name}
            targetFormat={targetFormat}
            pattern={filenamePattern}
            onChangePattern={setFilenamePattern}
          />
        </div>
      )}

      {/* Active Local Conversion Pipeline Visualizer */}
      {isProcessing && (
        <PipelineVisualizer currentStage={pipelineStage} progress={pipelineProgress} />
      )}

      {/* Media Inspection Report */}
      {queue.length > 0 && (
        <MediaTechnicalReport file={queue[0].file} />
      )}

      {/* Advanced Parameters */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-xs">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Encoding & Output Parameters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300">Quality / Compression: {Math.round(quality * 100)}%</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300">Target Width (Optional)</label>
            <input
              type="number"
              placeholder="Auto (e.g. 1200)"
              value={width || ''}
              onChange={(e) => setWidth(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Media Audio & Video Controls */}
      {queue.some((i) =>
        i.file.type.startsWith('audio/') ||
        i.file.type.startsWith('video/') ||
        ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'mp4', 'webm', 'mov', 'avi', 'mkv'].some((ext) =>
          i.file.name.toLowerCase().endsWith('.' + ext)
        )
      ) && (
        <MediaOptionsEditor
          file={
            queue.find((i) =>
              i.file.type.startsWith('audio/') ||
              i.file.type.startsWith('video/') ||
              ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'mp4', 'webm', 'mov', 'avi', 'mkv'].some((ext) =>
                i.file.name.toLowerCase().endsWith('.' + ext)
              )
            )!.file
          }
          targetFormat={targetFormat}
          startTime={mediaOpts.startTime}
          endTime={mediaOpts.endTime}
          sampleRate={mediaOpts.sampleRate}
          channels={mediaOpts.channels}
          frameTime={mediaOpts.frameTime}
          onChange={(opts) => setMediaOpts((prev) => ({ ...prev, ...opts }))}
          disabled={isProcessing}
        />
      )}

      {/* File Queue */}
      {queue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Conversion Queue ({queue.length} files)</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearQueue}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs"
              >
                Clear Queue
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={processQueue}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Convert All Files</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {queue.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-xs uppercase">
                      {item.sourceFormat}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">{item.file.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(item.file.size / 1024).toFixed(1)} KB → .{targetFormat}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold ${
                        item.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : item.status === 'error'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : item.status === 'processing'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse motion-reduce:animate-none'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      {item.status}
                    </span>

                    {item.resultUrl && item.resultFilename && (
                      <a
                        href={item.resultUrl}
                        download={item.resultFilename}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-500/30 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {item.status === 'processing' && (
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === 'success' && item.resultUrl && item.resultFilename && (
                  <div className="space-y-3 pt-2">
                    <OutputPreview url={item.resultUrl} filename={item.resultFilename} format={item.targetFormat} />
                    <MetadataSummary
                      filename={item.resultFilename}
                      sizeBytes={item.resultBlob?.size || item.file.size}
                      format={item.targetFormat}
                      metadataPreserved={item.report?.metadataPreserved ?? true}
                    />
                  </div>
                )}

                {item.report && (
                  <div className="space-y-2">
                    <ConversionReport report={item.report} />
                    <ExtendedConversionReport report={item.report} filename={item.resultFilename || item.file.name} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {queue.some((i) => i.status === 'success') && (
            <div className="pt-2 flex justify-end">
              <BatchZipExport
                onExport={downloadAllZip}
                itemCount={queue.filter((i) => i.status === 'success').length}
              />
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <ErrorRecoveryPanel error={errorMessage} onRetry={processQueue} onDismiss={() => setErrorMessage(null)} />
      )}

      {/* Cross-Browser Format Compatibility Checker */}
      <FormatCompatibilityChecker />

      {/* Capability & Privacy Notice */}
      <CapabilityNotice
        mode={tool.processingMode}
        status={tool.status}
        privacyNote={tool.privacyNote}
        knownLimitations={tool.knownLimitations}
      />

      {/* Floating PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
};
