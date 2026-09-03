import React, { useEffect } from 'react';
import { ToolDefinition } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { PrivacyBadge } from '../common/PrivacyBadge';
import { Star, ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';
import { ALL_TOOLS, getRelatedTools } from '../../registry/toolsRegistry';
import { ToolCard } from '../common/ToolCard';
import { AdSlotPlaceholder } from '../common/AdSlotPlaceholder';

// Import All Tool Implementations
import { ImageConverterTool } from '../tools/ImageConverterTool';
import { ImageCompressorTool } from '../tools/ImageCompressorTool';
import { ImageCropperTool } from '../tools/ImageCropperTool';
import { ImageColorPickerTool } from '../tools/ImageColorPickerTool';
import { FaviconGeneratorTool } from '../tools/FaviconGeneratorTool';
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
import { PdfProtectTool } from '../tools/PdfProtectTool';
import { PdfUnlockTool } from '../tools/PdfUnlockTool';
import { PdfAnnotateTool } from '../tools/PdfAnnotateTool';
import { PdfFormsTool } from '../tools/PdfFormsTool';
import { PdfNUpTool } from '../tools/PdfNUpTool';
import { PdfOverlayTool } from '../tools/PdfOverlayTool';
import { PdfCompareTool } from '../tools/PdfCompareTool';
import { PdfBookmarksTool } from '../tools/PdfBookmarksTool';
import { JsonCsvConverterTool } from '../tools/JsonCsvConverterTool';
import { CodeFormatterTool } from '../tools/CodeFormatterTool';
import { MarkdownPreviewTool } from '../tools/MarkdownPreviewTool';
import { Base64Tool } from '../tools/Base64Tool';
import { UrlEncoderTool } from '../tools/UrlEncoderTool';
import { TextUtilitiesTool } from '../tools/TextUtilitiesTool';
import { UuidGeneratorTool } from '../tools/UuidGeneratorTool';
import { PasswordGeneratorTool } from '../tools/PasswordGeneratorTool';
import { HashGeneratorTool } from '../tools/HashGeneratorTool';
import { JwtDecoderTool } from '../tools/JwtDecoderTool';
import { TimestampConverterTool } from '../tools/TimestampConverterTool';
import { ColorConverterTool } from '../tools/ColorConverterTool';
import { RegexTesterTool } from '../tools/RegexTesterTool';
import { QrCodeGeneratorTool } from '../tools/QrCodeGeneratorTool';
import { GeneratorSuiteTool } from '../tools/GeneratorSuiteTool';
import { WebBoilerplateTool } from '../tools/WebBoilerplateTool';
import { FileInfoTool } from '../tools/FileInfoTool';
import { TextToImageTool } from '../tools/TextToImageTool';

interface ToolRunnerPageProps {
  tool: ToolDefinition;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
  onNavigateHome: () => void;
  onSelectTool: (slug: string) => void;
}

export const ToolRunnerPage: React.FC<ToolRunnerPageProps> = ({
  tool,
  isFavorite,
  onToggleFavorite,
  onNavigateHome,
  onSelectTool,
}) => {
  // Update document title for this specific tool
  useEffect(() => {
    document.title = `${tool.name} | AquaTools - 100% Private Browser Utility`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tool]);

  const related = getRelatedTools(tool.slug, 3);

  const renderToolComponent = () => {
    switch (tool.slug) {
      case 'image-converter':
        return <ImageConverterTool />;
      case 'image-compressor':
        return <ImageCompressorTool />;
      case 'image-cropper':
        return <ImageCropperTool />;
      case 'image-color-picker':
        return <ImageColorPickerTool />;
      case 'favicon-generator':
        return <FaviconGeneratorTool />;
      case 'view-pdf':
      case 'pdf-viewer':
        return <PdfViewerTool />;
      case 'merge-pdf':
      case 'split-pdf':
      case 'pdf-merge':
      case 'pdf-split':
      case 'pdf-merge-split':
        return <PdfMergeSplitTool />;
      case 'organize-pdf-pages':
      case 'rearrange-pdf-pages':
        return <PdfPageOrganizerTool initialMode="rearrange" />;
      case 'rotate-pdf-pages':
      case 'rotate-pdf':
        return <PdfPageOrganizerTool initialMode="rotate" />;
      case 'remove-pdf-pages':
      case 'delete-pdf-pages':
        return <PdfPageOrganizerTool initialMode="remove" />;
      case 'extract-pdf-pages':
        return <PdfPageOrganizerTool initialMode="extract" />;
      case 'images-to-pdf':
      case 'jpg-to-pdf':
      case 'png-to-pdf':
        return <ImagesToPdfTool />;
      case 'pdf-to-images':
      case 'pdf-to-jpg':
      case 'pdf-to-png':
        return <PdfToImagesTool defaultFormat={tool.slug === 'pdf-to-png' ? 'png' : 'jpeg'} />;
      case 'crop-pdf':
        return <PdfCropTool />;
      case 'add-watermark':
      case 'watermark-pdf':
        return <PdfWatermarkTool />;
      case 'add-page-numbers':
      case 'page-numbers-pdf':
        return <PdfPageNumbersTool />;
      case 'flatten-pdf':
        return <PdfFlattenTool />;
      case 'protect-pdf':
      case 'pdf-protect':
      case 'encrypt-pdf':
        return <PdfProtectTool />;
      case 'unlock-pdf':
      case 'pdf-unlock':
      case 'decrypt-pdf':
        return <PdfUnlockTool />;
      case 'pdf-metadata':
      case 'edit-pdf-document-info':
      case 'edit-pdf-metadata':
        return <PdfMetadataTool initialTab="inspect" />;
      case 'remove-pdf-metadata':
      case 'sanitize-pdf':
        return <PdfMetadataTool initialTab="remove" />;
      case 'annotate-pdf':
      case 'pdf-annotate':
      case 'draw-pdf':
        return <PdfAnnotateTool />;
      case 'fill-pdf-forms':
      case 'fill-form':
      case 'pdf-form-filler':
        return <PdfFormsTool initialMode="fill" />;
      case 'create-pdf-forms':
      case 'create-form':
      case 'form-builder':
        return <PdfFormsTool initialMode="create" />;
      case 'nup-pdf':
      case 'pages-per-sheet':
      case 'pdf-nup':
        return <PdfNUpTool initialMode="nup" />;
      case 'halve-pdf':
      case 'split-spreads':
      case 'halve-pages':
        return <PdfNUpTool initialMode="halve" />;
      case 'overlay-pdf':
      case 'pdf-overlay':
      case 'letterhead-pdf':
        return <PdfOverlayTool />;
      case 'compare-pdf':
      case 'pdf-compare':
      case 'pdf-diff':
        return <PdfCompareTool />;
      case 'bookmarks-pdf':
      case 'pdf-bookmarks':
      case 'toc-pdf':
      case 'table-of-contents':
        return <PdfBookmarksTool />;
      case 'generate-password':
      case 'password-generator':
      case 'passphrase-generator':
      case 'pin-generator':
        return <PasswordGeneratorTool />;
      case 'json-csv-converter':
        return <JsonCsvConverterTool />;
      case 'code-formatter':
        return <CodeFormatterTool />;
      case 'markdown-preview':
        return <MarkdownPreviewTool />;
      case 'base64-encoder':
        return <Base64Tool />;
      case 'url-encoder':
        return <UrlEncoderTool />;
      case 'text-utilities':
      case 'text-diff':
        return <TextUtilitiesTool />;
      case 'uuid-generator':
        return <UuidGeneratorTool />;
      case 'hash-generator':
        return <HashGeneratorTool />;
      case 'jwt-decoder':
        return <JwtDecoderTool />;
      case 'timestamp-converter':
        return <TimestampConverterTool />;
      case 'color-converter':
        return <ColorConverterTool />;
      case 'regex-tester':
        return <RegexTesterTool />;
      case 'qr-code-generator':
        return <QrCodeGeneratorTool />;
      case 'text-to-image':
      case 'add-text-to-image':
        return <TextToImageTool />;
      case 'random-generator':
      case 'random-data-generator':
        return <GeneratorSuiteTool initialTab="random" />;
      case 'slug-generator':
        return <GeneratorSuiteTool initialTab="slug" />;
      case 'username-generator':
        return <GeneratorSuiteTool initialTab="username" />;
      case 'palette-generator':
        return <GeneratorSuiteTool initialTab="palette" />;
      case 'gradient-generator':
        return <GeneratorSuiteTool initialTab="gradient" />;
      case 'shadow-generator':
        return <GeneratorSuiteTool initialTab="shadow" />;
      case 'web-boilerplate':
      case 'html-boilerplate':
        return <WebBoilerplateTool defaultTab="html" />;
      case 'robots-generator':
      case 'robots-txt-generator':
        return <WebBoilerplateTool defaultTab="robots" />;
      case 'sitemap-generator':
      case 'sitemap-xml-generator':
        return <WebBoilerplateTool defaultTab="sitemap" />;
      case 'open-graph-generator':
        return <WebBoilerplateTool defaultTab="og" />;
      case 'file-info':
        return <FileInfoTool />;
      default:
        return (
          <div className="glass-panel p-8 text-center rounded-2xl text-slate-400">
            Tool runner is loading...
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 py-2">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tools</span>
        </button>

        <div className="flex items-center gap-2">
          <PrivacyBadge />
          <button
            type="button"
            id={`favorite-toggle-${tool.slug}`}
            onClick={() => onToggleFavorite(tool.slug)}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs ${
              isFavorite
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="hidden sm:inline">{isFavorite ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>
      </div>

      {/* Tool Header Card */}
      <div className="relative bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-3 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/20">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <DynamicIcon name={tool.iconName} size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {tool.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  100% Client-Side
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {tool.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Tool Dynamic Component */}
      <div className="min-h-[400px]">{renderToolComponent()}</div>

      {/* Related Tools Section */}
      {related.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Related Utilities</h3>
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              View Full Catalog →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((r) => (
              <ToolCard
                key={r.slug}
                tool={r}
                onSelectTool={onSelectTool}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {/* Non-intrusive Ad Slot (Disabled by default, 0 CLS, outside interactive controls) */}
      <AdSlotPlaceholder
        slotId={`tool-footer-${tool.slug}`}
        format="horizontal-banner"
        positionLabel={`Tool Footer (${tool.name})`}
        className="mt-8"
      />
    </div>
  );
};
