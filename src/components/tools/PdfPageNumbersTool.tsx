import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  RefreshCw,
  Sparkles,
  Sliders,
  Eye,
  Hash,
  Palette,
} from 'lucide-react';
import { FileDropzone } from '../common/FileDropzone';
import { ProgressBar } from '../common/ProgressBar';
import { ErrorAlert } from '../common/ErrorAlert';
import { OutputCard } from '../common/OutputCard';
import { PdfRenderer } from '../../services/pdfRenderer';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfValidator } from '../../services/pdfValidator';

export const PdfPageNumbersTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Numbering Settings
  const [format, setFormat] = useState<'page' | 'page-of-total' | 'roman' | 'custom'>('page-of-total');
  const [customTemplate, setCustomTemplate] = useState<string>('Page {n} of {total}');
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'>('bottom-center');
  const [fontSize, setFontSize] = useState<number>(10);
  const [colorHex, setColorHex] = useState<string>('#334155');
  const [marginPt, setMarginPt] = useState<number>(25);
  const [startNumber, setStartNumber] = useState<number>(1);
  const [targetPages, setTargetPages] = useState<'all' | 'odd' | 'even'>('all');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    fileName: string;
    pageCount: number;
    fileSizeBytes: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (result?.url) {
        PdfEngine.revokeUrl(result.url);
      }
      PdfEngine.cleanupAllTrackedUrls();
    };
  }, [result]);

  const handleFileSelect = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const selectedFile = files[0];

    const validation = await PdfValidator.validatePdf(selectedFile);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Invalid PDF file.');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setIsProcessing(true);
    setProgress(20);
    setProgressText('Rendering live preview for page number placement...');
    setResult(null);

    try {
      const doc = await PdfRenderer.loadPdfDocument(selectedFile);
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setPreviewPage(1);

      const renderRes = await PdfRenderer.renderPage(doc, 1, 1.2, 'image/png');
      setPreviewDataUrl(renderRes.dataUrl);
      setProgress(100);
    } catch (err: any) {
      setError(err?.message || 'Failed to load PDF preview.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPreviewLabel = () => {
    if (format === 'page') return `${startNumber}`;
    if (format === 'page-of-total') return `Page ${startNumber} of ${totalPages || 1}`;
    if (format === 'custom') {
      return customTemplate.replace(/\{n\}/g, String(startNumber)).replace(/\{total\}/g, String(totalPages || 1));
    }
    return `${startNumber}`;
  };

  const handleApplyNumbers = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(15);
    setProgressText('Stamping page numbering vectors into PDF...');
    setError(null);

    try {
      const res = await PdfEngine.addPageNumbers(
        file,
        {
          format,
          customTemplate,
          position,
          fontSize,
          colorHex,
          marginPt,
          startNumber,
          targetPages,
        },
        (pct, msg) => {
          setProgress(pct);
          setProgressText(msg);
        }
      );

      setResult({
        blob: res.blob!,
        url: res.downloadUrl!,
        fileName: res.fileName || `numbered-${file.name}`,
        pageCount: res.pageCount || totalPages,
        fileSizeBytes: res.fileSizeBytes || res.blob!.size,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to add page numbers.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null);
    setPreviewDataUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {!file && (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <FileDropzone
            accept=".pdf,application/pdf"
            multiple={false}
            maxSizeMB={50}
            onFilesSelected={handleFileSelect}
            title="Drop PDF to Add Page Numbers"
            subtitle="Stamp customizable page numbers (Page N of Total, headers, footers) client-side"
          />
        </div>
      )}

      {file && !result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Numbering Settings */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                  <div>
                    <span className="font-semibold text-white">{file.name}</span>
                    <span className="text-slate-500 mx-2">•</span>
                    <span className="text-slate-400">{totalPages} Pages</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                </div>

                {/* Numbering Format */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Number Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormat('page-of-total')}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all ${
                        format === 'page-of-total'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      Page 1 of {totalPages || 'N'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat('page')}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all ${
                        format === 'page'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      1, 2, 3...
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormat('custom');
                        setCustomTemplate('- {n} -');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all ${
                        format === 'custom' && customTemplate === '- {n} -'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      - 1 -
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormat('custom');
                        setCustomTemplate('Page {n}');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all ${
                        format === 'custom' && customTemplate === 'Page {n}'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      Page 1
                    </button>
                  </div>
                </div>

                {/* Position Preset Grid */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Stamp Position</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'top-left', label: 'Top Left' },
                      { id: 'top-center', label: 'Top Center' },
                      { id: 'top-right', label: 'Top Right' },
                      { id: 'bottom-left', label: 'Bottom Left' },
                      { id: 'bottom-center', label: 'Bottom Center' },
                      { id: 'bottom-right', label: 'Bottom Right' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setPosition(pos.id as any)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] border transition-all text-center ${
                          position === pos.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Font Size */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Font Size</span>
                      <span className="font-mono text-cyan-300">{fontSize} pt</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="24"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  {/* Margin */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Margin</span>
                      <span className="font-mono text-cyan-300">{marginPt} pt</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={marginPt}
                      onChange={(e) => setMarginPt(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </div>

                {/* Start Number & Color */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Start Number</label>
                    <input
                      type="number"
                      min="1"
                      value={startNumber}
                      onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-1.5 bg-black/40 border border-white/15 rounded-xl text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="w-full px-2 py-1 bg-black/40 border border-white/15 rounded-lg text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleApplyNumbers}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Apply Page Numbers & Export PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Preview */}
            <div className="lg:col-span-6 bg-slate-950/80 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="flex items-center justify-between w-full mb-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Numbering Placement Preview</span>
                </span>
                <span className="font-mono text-cyan-300 text-[11px]">
                  Page 1 of {totalPages}
                </span>
              </div>

              {previewDataUrl ? (
                <div className="relative max-w-full max-h-[450px] bg-white rounded shadow-2xl overflow-hidden border border-slate-700">
                  <img
                    src={previewDataUrl}
                    alt="Page Number Preview"
                    className="max-h-[420px] object-contain"
                  />

                  {/* Stamped Number Overlay */}
                  <div
                    className="absolute inset-0 flex pointer-events-none select-none p-4"
                    style={{
                      justifyContent: position.includes('left')
                        ? 'flex-start'
                        : position.includes('right')
                        ? 'flex-end'
                        : 'center',
                      alignItems: position.includes('top') ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <span
                      style={{
                        color: colorHex,
                        fontSize: `${fontSize}px`,
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontWeight: '500',
                      }}
                    >
                      {getPreviewLabel()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">Rendering preview...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <ProgressBar progress={progress} stageText={progressText} />
      )}

      {result && (
        <OutputCard
          title="Page Numbers Added Successfully"
          downloadUrl={result.url}
          fileName={result.fileName}
          stats={{
            'File Name': result.fileName,
            'Total Pages': result.pageCount,
            'Position': position.replace('-', ' '),
            'File Size': PdfValidator.formatFileSize(result.fileSizeBytes),
            'Privacy': '100% Client-Side In-Memory',
          }}
          onReset={handleReset}
        />
      )}
    </div>
  );
};
