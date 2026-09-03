import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Layers,
  Sparkles,
  AlertTriangle,
  Clock,
  Download,
  CheckCircle2,
  FileText,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { PdfToolDefinition, PdfToolCategory } from '../../types/pdf';
import { PDF_CATEGORIES, getPdfToolsByCategory } from '../../registry/pdfRegistry';
import { DynamicIcon } from '../common/DynamicIcon';
import { PdfCapabilityBadge } from '../pdf/PdfCapabilityBadge';
import { PdfCapabilityNotice } from '../pdf/PdfCapabilityNotice';
import { PdfErrorBoundary } from '../pdf/PdfErrorBoundary';
import { PdfLazyBoundary } from '../pdf/PdfLazyBoundary';
import { PdfDropzone } from '../pdf/PdfDropzone';
import { PdfEngine } from '../../services/pdfEngine';
import { PdfMetadataTool } from '../tools/PdfMetadataTool';
import { PdfMergeSplitTool } from '../tools/PdfMergeSplitTool';
import { PdfViewerTool } from '../tools/PdfViewerTool';
import { PdfPageOrganizerTool } from '../tools/PdfPageOrganizerTool';
import { ImagesToPdfTool } from '../tools/ImagesToPdfTool';
import { PdfToImagesTool } from '../tools/PdfToImagesTool';
import { PdfCropTool } from '../tools/PdfCropTool';
import { PdfWatermarkTool } from '../tools/PdfWatermarkTool';
import { PdfPageNumbersTool } from '../tools/PdfPageNumbersTool';
import { PdfFlattenTool } from '../tools/PdfFlattenTool';
import { PasswordGeneratorTool } from '../tools/PasswordGeneratorTool';
import { PdfProtectTool } from '../tools/PdfProtectTool';
import { PdfUnlockTool } from '../tools/PdfUnlockTool';
import { PdfAnnotateTool } from '../tools/PdfAnnotateTool';
import { PdfFormsTool } from '../tools/PdfFormsTool';
import { PdfNUpTool } from '../tools/PdfNUpTool';
import { PdfOverlayTool } from '../tools/PdfOverlayTool';
import { PdfCompareTool } from '../tools/PdfCompareTool';
import { PdfBookmarksTool } from '../tools/PdfBookmarksTool';
import { PdfCompressTool } from '../tools/PdfCompressTool';
import { PdfExtractImagesTool } from '../tools/PdfExtractImagesTool';
import { PdfRepairTool } from '../tools/PdfRepairTool';
import { PdfArchivalTool } from '../tools/PdfArchivalTool';
import { PdfWebOptimizeTool } from '../tools/PdfWebOptimizeTool';
import { PdfOcrTool } from '../tools/PdfOcrTool';
import { OfficeConvertNoticeTool } from '../tools/OfficeConvertNoticeTool';

interface PdfToolRunnerPageProps {
  tool: PdfToolDefinition;
  isFavorite?: boolean;
  onToggleFavorite?: (slug: string) => void;
  onNavigateHub: () => void;
  onSelectTool: (slug: string) => void;
}

export const PdfToolRunnerPage: React.FC<PdfToolRunnerPageProps> = ({
  tool,
  isFavorite = false,
  onToggleFavorite,
  onNavigateHub,
  onSelectTool,
}) => {
  // Update document title for this specific PDF utility
  useEffect(() => {
    document.title = `${tool.title} | AquaTools PDF Suite - 100% Client-Side`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tool]);

  const catMeta = PDF_CATEGORIES.find((c) => c.id === tool.category);
  const relatedTools = getPdfToolsByCategory(tool.category)
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 3);

  // Render specific tool implementation or honest capability placeholder
  const renderToolBody = () => {
    // 1. View PDF
    if (tool.slug === 'view-pdf' || tool.slug === 'pdf-viewer') {
      return <PdfViewerTool />;
    }

    // 2. Merge & Split PDF
    if (tool.slug === 'merge-pdf' || tool.slug === 'split-pdf' || tool.slug === 'pdf-merge' || tool.slug === 'pdf-split') {
      return <PdfMergeSplitTool />;
    }

    // 3. Rearrange, Rotate, Remove, Extract Pages
    if (
      tool.slug === 'rearrange-pdf-pages' ||
      tool.slug === 'rotate-pdf-pages' ||
      tool.slug === 'rotate-pdf' ||
      tool.slug === 'remove-pdf-pages' ||
      tool.slug === 'delete-pdf-pages' ||
      tool.slug === 'extract-pdf-pages' ||
      tool.slug === 'organize-pdf-pages'
    ) {
      const mode =
        tool.slug.includes('rotate')
          ? 'rotate'
          : tool.slug.includes('remove') || tool.slug.includes('delete')
          ? 'remove'
          : tool.slug.includes('extract')
          ? 'extract'
          : 'rearrange';
      return <PdfPageOrganizerTool initialMode={mode} />;
    }

    // 4. Images to PDF
    if (tool.slug === 'images-to-pdf' || tool.slug === 'jpg-to-pdf' || tool.slug === 'png-to-pdf') {
      return <ImagesToPdfTool />;
    }

    // 5. PDF to Images (JPG / PNG)
    if (tool.slug === 'pdf-to-jpg' || tool.slug === 'pdf-to-png' || tool.slug === 'pdf-to-images') {
      const defaultFormat = tool.slug === 'pdf-to-jpg' ? 'jpeg' : 'png';
      return <PdfToImagesTool defaultFormat={defaultFormat} />;
    }

    // 6. Crop PDF
    if (tool.slug === 'crop-pdf') {
      return <PdfCropTool />;
    }

    // 7. Add Watermark
    if (tool.slug === 'add-watermark' || tool.slug === 'watermark-pdf') {
      return <PdfWatermarkTool />;
    }

    // 8. Add Page Numbers
    if (tool.slug === 'add-page-numbers' || tool.slug === 'page-numbers-pdf') {
      return <PdfPageNumbersTool />;
    }

    // 9. PDF Metadata & Document Info
    if (
      tool.slug === 'pdf-metadata' ||
      tool.slug === 'edit-pdf-document-info' ||
      tool.slug === 'remove-pdf-metadata' ||
      tool.slug === 'edit-pdf-metadata'
    ) {
      return <PdfMetadataTool />;
    }

    // 10. Flatten PDF
    if (tool.slug === 'flatten-pdf') {
      return <PdfFlattenTool />;
    }

    // 11. Protect PDF & Unlock PDF
    if (tool.slug === 'protect-pdf' || tool.slug === 'encrypt-pdf' || tool.slug === 'pdf-protect') {
      return <PdfProtectTool />;
    }
    if (tool.slug === 'unlock-pdf' || tool.slug === 'decrypt-pdf' || tool.slug === 'pdf-unlock') {
      return <PdfUnlockTool />;
    }

    // 12. Annotate & Draw
    if (tool.slug === 'annotate-pdf' || tool.slug === 'draw-pdf' || tool.slug === 'pdf-annotate') {
      return <PdfAnnotateTool />;
    }

    // 13. Fill Forms & Form Builder
    if (tool.slug === 'fill-pdf-forms' || tool.slug === 'fill-form' || tool.slug === 'pdf-form-filler') {
      return <PdfFormsTool initialMode="fill" />;
    }
    if (tool.slug === 'create-pdf-forms' || tool.slug === 'create-form' || tool.slug === 'form-builder') {
      return <PdfFormsTool initialMode="create" />;
    }

    // 14. N-Up & Halve Pages
    if (tool.slug === 'nup-pdf' || tool.slug === 'pages-per-sheet' || tool.slug === 'pdf-nup') {
      return <PdfNUpTool initialMode="nup" />;
    }
    if (tool.slug === 'halve-pdf' || tool.slug === 'split-spreads' || tool.slug === 'halve-pages') {
      return <PdfNUpTool initialMode="halve" />;
    }

    // 15. Overlay & Letterhead
    if (tool.slug === 'overlay-pdf' || tool.slug === 'letterhead-pdf' || tool.slug === 'pdf-overlay') {
      return <PdfOverlayTool />;
    }

    // 16. Compare PDF
    if (tool.slug === 'compare-pdf' || tool.slug === 'pdf-compare' || tool.slug === 'pdf-diff') {
      return <PdfCompareTool />;
    }

    // 17. Bookmarks & TOC
    if (tool.slug === 'bookmarks-pdf' || tool.slug === 'pdf-bookmarks' || tool.slug === 'toc-pdf' || tool.slug === 'table-of-contents') {
      return <PdfBookmarksTool />;
    }

    // 18. Compress PDF
    if (tool.slug === 'compress-pdf' || tool.slug === 'pdf-compress' || tool.slug === 'shrink-pdf') {
      return <PdfCompressTool />;
    }

    // 19. Extract Images
    if (tool.slug === 'extract-pdf-images' || tool.slug === 'pdf-extract-images' || tool.slug === 'extract-images-from-pdf') {
      return <PdfExtractImagesTool />;
    }

    // 20. Repair PDF
    if (tool.slug === 'repair-pdf' || tool.slug === 'pdf-repair' || tool.slug === 'fix-pdf') {
      return <PdfRepairTool />;
    }

    // 21. PDF/A Archival
    if (tool.slug === 'pdf-a' || tool.slug === 'pdf-archival' || tool.slug === 'pdfa-converter') {
      return <PdfArchivalTool />;
    }

    // 22. Web Stream Optimize
    if (tool.slug === 'web-optimize-pdf' || tool.slug === 'optimize-pdf' || tool.slug === 'fast-web-view') {
      return <PdfWebOptimizeTool />;
    }

    // 23. OCR PDF
    if (tool.slug === 'ocr-pdf' || tool.slug === 'pdf-ocr' || tool.slug === 'searchable-pdf') {
      return <PdfOcrTool />;
    }

    // 24. Office to PDF Notices
    if (tool.slug === 'word-to-pdf' || tool.slug === 'docx-to-pdf') {
      return <OfficeConvertNoticeTool format="word" />;
    }
    if (tool.slug === 'excel-to-pdf' || tool.slug === 'xlsx-to-pdf') {
      return <OfficeConvertNoticeTool format="excel" />;
    }
    if (tool.slug === 'powerpoint-to-pdf' || tool.slug === 'pptx-to-pdf') {
      return <OfficeConvertNoticeTool format="powerpoint" />;
    }

    // 25. Secure Password Generation
    if (
      tool.slug === 'generate-password' ||
      tool.slug === 'password-generator' ||
      tool.slug === 'generate-secure-password'
    ) {
      return <PasswordGeneratorTool />;
    }

    // Ready/Implemented tools in Phase A/B foundation
    if (tool.browserSupportLevel === 'ready' && tool.implementationStatus === 'implemented') {
      return <PdfStandardToolRunner tool={tool} />;
    }

    // Honest coming-soon / roadmap state
    return <PdfComingSoonRoadmap tool={tool} onNavigateHub={onNavigateHub} onSelectTool={onSelectTool} />;
  };

  return (
    <PdfErrorBoundary fallbackTitle={`Error Running ${tool.title}`}>
      <div className="space-y-8 py-2">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateHub}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to PDF Hub</span>
          </button>

          <div className="flex items-center gap-2">
            <PdfCapabilityBadge level={tool.browserSupportLevel} size="md" />
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(tool.slug)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs ${
                  isFavorite
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                aria-label={isFavorite ? 'Remove bookmark' : 'Bookmark tool'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span className="hidden sm:inline">{isFavorite ? 'Bookmarked' : 'Bookmark'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tool Header Card */}
        <div className="relative bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl overflow-hidden shadow-2xl space-y-4">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 shrink-0">
                <DynamicIcon name={tool.iconName} size={28} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {tool.title}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-slate-300 border border-white/10">
                    {catMeta?.name || tool.category}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  {tool.fullDescription || tool.shortDescription}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Tool Core Area */}
        <div className="min-h-[360px]">
          <PdfLazyBoundary fallbackText={`Initializing ${tool.title}...`}>
            {renderToolBody()}
          </PdfLazyBoundary>
        </div>

        {/* Technical Capability Notice */}
        <PdfCapabilityNotice tool={tool} />

        {/* Related Category Tools */}
        {relatedTools.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>More in {catMeta?.name}</span>
              </h3>
              <button
                type="button"
                onClick={onNavigateHub}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                View Category Catalog →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedTools.map((rel) => (
                <div
                  key={rel.slug}
                  onClick={() => onSelectTool(rel.slug)}
                  className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-cyan-400/40 cursor-pointer transition-all flex items-start gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <DynamicIcon name={rel.iconName} size={18} />
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                      {rel.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {rel.shortDescription}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PdfErrorBoundary>
  );
};

// Standard PDF Dropzone Runner for Ready Tools
const PdfStandardToolRunner: React.FC<{ tool: PdfToolDefinition }> = ({ tool }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ downloadUrl: string; fileName: string; pageCount?: number } | null>(null);

  const handleFileAccepted = (file: File) => {
    setSelectedFile(file);
    setResult(null);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
      {!selectedFile ? (
        <PdfDropzone
          onFileAccepted={handleFileAccepted}
          maxSizeMB={tool.maxRecommendedFileSizeMB}
          acceptLabel={`Drop PDF to use with ${tool.title}`}
        />
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{selectedFile.name}</div>
                <div className="text-xs text-slate-400 font-mono">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for processing
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              Change File
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-center space-y-3">
            <p className="text-xs sm:text-sm text-slate-300">
              Document verified locally. The dedicated interactive panel for <span className="text-cyan-300 font-semibold">{tool.title}</span> is initializing.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>Loaded in Client Memory Buffer</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Honest Roadmap / Coming-Soon State Component
const PdfComingSoonRoadmap: React.FC<{
  tool: PdfToolDefinition;
  onNavigateHub: () => void;
  onSelectTool: (slug: string) => void;
}> = ({ tool, onNavigateHub, onSelectTool }) => {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-200">Active WASM Development Pipeline</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              This advanced document converter is currently undergoing client-side WebAssembly porting to guarantee zero server uploads.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap self-start sm:self-auto">
          Honest Roadmap State
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-2">
          <h4 className="font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Why is this tool marked coming-soon?</span>
          </h4>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Unlike commercial tools that quietly upload your files to remote third-party cloud servers, AquaTools strictly enforces 100% private in-browser execution. Complex format conversions require standalone WebAssembly engines (e.g. LibreOffice WASM, Tesseract OCR, or HarfBuzz font shaping).
          </p>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-2">
          <h4 className="font-semibold text-white flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Privacy & Security Guarantee</span>
          </h4>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Once compiled to WebAssembly, this tool will execute entirely in your local browser sandbox with zero network telemetry or tracking.
          </p>
        </div>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-400">
          Looking for active utilities? Check out <button type="button" onClick={() => onSelectTool('pdf-metadata')} className="text-cyan-400 hover:underline">PDF Metadata</button> or <button type="button" onClick={() => onSelectTool('pdf-merge')} className="text-cyan-400 hover:underline">PDF Merge & Split</button>.
        </div>

        <button
          type="button"
          onClick={onNavigateHub}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
        >
          Explore Ready PDF Tools
        </button>
      </div>
    </div>
  );
};
