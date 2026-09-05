import { CategoryMeta, ToolCategory, ToolDefinition } from '../types';
import { TOOLS } from './toolsRegistry';
import { FILE_CONVERSION_TOOLS } from './fileConvRegistry';
import { IMAGE_TOOLS } from './imageRegistry';
import { PDF_TOOLS } from './pdfRegistry';

export const MASTER_CATEGORIES: CategoryMeta[] = [
  {
    id: 'converters',
    name: 'File Converters',
    tagline: 'Format Transformation Engine',
    description: 'Convert images, documents, audio, video, ebooks, fonts, archives, and spreadsheets client-side.',
    iconName: 'RefreshCw',
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
  },
  {
    id: 'documents',
    name: 'PDF Suite & Documents',
    tagline: 'Complete PDF Workstation',
    description: 'Create, merge, split, compress, edit, annotate, protect, sign, OCR, and organize PDF files locally.',
    iconName: 'FileText',
    color: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30 text-sky-400',
  },
  {
    id: 'images',
    name: 'Image Studio & Media',
    tagline: 'Visual Asset Workbench',
    description: 'Compress, resize, crop, filter, watermark, convert to WebP/AVIF, change background, and edit EXIF metadata.',
    iconName: 'Image',
    color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-400',
  },
  {
    id: 'generators',
    name: 'Generators & Design',
    tagline: 'Asset & Code Generators',
    description: 'Generate QR codes, typography studio graphics, favicons, app icon packs, color palettes, CSS gradients, and Open Graph cards.',
    iconName: 'Sparkles',
    color: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-300',
  },
  {
    id: 'developer',
    name: 'Developer & Data Tools',
    tagline: 'Engineering Utilities',
    description: 'Hashes (SHA-256/512), UUID v4, password CSPRNG, JWT decoder, Unix timestamps, regex tester, code formatter, and diffs.',
    iconName: 'Code2',
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
  },
  {
    id: 'security',
    name: 'Privacy & Security',
    tagline: 'Local Security & Anonymization',
    description: 'Strip hidden device & GPS metadata, encrypt/decrypt PDF passwords, inspect JWT claims, and sanitize files locally.',
    iconName: 'ShieldCheck',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
  },
  {
    id: 'workflows',
    name: 'Batch Workflows',
    tagline: 'Multi-File Automation',
    description: 'Batch convert, batch resize, batch watermark, test performance budgets, and execute automated multi-file pipelines.',
    iconName: 'Layers',
    color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400',
  },
];

// Map all tools into a single, deduplicated master list
const buildUnifiedToolsList = (): ToolDefinition[] => {
  const map = new Map<string, ToolDefinition>();

  // 1. General Tools
  TOOLS.forEach((tool) => {
    let cat: ToolCategory = tool.category;
    if (cat === 'utilities') cat = 'images';
    map.set(tool.slug, {
      ...tool,
      category: cat,
      hub: 'general',
      hubName: 'General Utility',
    });
  });

  // 2. File Conversion Hub Tools
  FILE_CONVERSION_TOOLS.forEach((fcTool) => {
    let cat: ToolCategory = 'converters';
    if (fcTool.category === 'workflows') cat = 'workflows';

    // Only add if slug doesn't collide, or enhance existing
    if (!map.has(fcTool.slug)) {
      map.set(fcTool.slug, {
        id: fcTool.id,
        slug: fcTool.slug,
        name: fcTool.title,
        category: cat,
        description: fcTool.description,
        iconName:
          fcTool.category === 'audio'
            ? 'Music'
            : fcTool.category === 'video'
            ? 'Video'
            : fcTool.category === 'archive'
            ? 'Archive'
            : fcTool.category === 'font'
            ? 'Type'
            : fcTool.category === 'spreadsheet'
            ? 'Table'
            : 'RefreshCw',
        supportedInputTypes: fcTool.acceptedExtensions,
        supportedOutputTypes: fcTool.outputFormats,
        privacyNote: fcTool.privacyNote,
        tags: ['converter', fcTool.category, ...fcTool.acceptedExtensions],
        maxFileSizeMB: Math.round(fcTool.maxRecommendedBytes / (1024 * 1024)),
        componentId: 'FileConvRunner',
        hub: 'fileconv',
        hubName: 'Converter Hub',
      });
    }
  });

  // 3. Image Studio Tools
  IMAGE_TOOLS.forEach((imgTool) => {
    let cat: ToolCategory = 'images';
    if (imgTool.category === 'convert') cat = 'converters';
    if (imgTool.category === 'metadata-privacy') cat = 'security';
    if (imgTool.category === 'batch-workflows') cat = 'workflows';
    if (imgTool.category === 'developer-assets') cat = 'generators';

    if (!map.has(imgTool.slug)) {
      map.set(imgTool.slug, {
        id: imgTool.id,
        slug: imgTool.slug,
        name: imgTool.title,
        category: cat,
        description: imgTool.shortDescription || imgTool.description,
        iconName: imgTool.iconName,
        supportedInputTypes: imgTool.acceptedTypes.map((t) =>
          t.replace('image/', '').replace('+xml', '')
        ),
        supportedOutputTypes: imgTool.outputTypes.map((t) =>
          t.replace('image/', '').replace('+xml', '')
        ),
        privacyNote: imgTool.privacyNote,
        tags: imgTool.tags,
        isPopular: imgTool.isPopular,
        componentId: 'ImageToolRunner',
        hub: 'image',
        hubName: 'Image Studio',
      });
    }
  });

  // 4. PDF Suite Tools
  PDF_TOOLS.forEach((pdfTool) => {
    let cat: ToolCategory = 'documents';
    if (pdfTool.category === 'security-privacy') cat = 'security';
    if (pdfTool.category === 'convert-to-pdf' || pdfTool.category === 'convert-from-pdf')
      cat = 'converters';

    if (!map.has(pdfTool.slug)) {
      map.set(pdfTool.slug, {
        id: pdfTool.id,
        slug: pdfTool.slug,
        name: pdfTool.title,
        category: cat,
        description: pdfTool.shortDescription || pdfTool.fullDescription,
        iconName: pdfTool.iconName,
        supportedInputTypes: pdfTool.supportedInputTypes,
        supportedOutputTypes: pdfTool.supportedOutputTypes,
        privacyNote: pdfTool.privacyNote,
        tags: pdfTool.tags,
        componentId: 'PdfToolRunner',
        hub: 'pdf',
        hubName: 'PDF Suite',
      });
    }
  });

  return Array.from(map.values());
};

export const ALL_UNIFIED_TOOLS: ToolDefinition[] = buildUnifiedToolsList();

export const getUnifiedToolsByCategory = (category: ToolCategory | 'all'): ToolDefinition[] => {
  if (category === 'all') return ALL_UNIFIED_TOOLS;
  return ALL_UNIFIED_TOOLS.filter((t) => t.category === category);
};

export const searchUnifiedTools = (query: string): ToolDefinition[] => {
  if (!query || !query.trim()) return ALL_UNIFIED_TOOLS;
  // Strip leading hashtag or search prefixes so searching '#pdf' or '#png' works immediately
  const cleanQuery = query.replace(/^[#\s]+/, '').toLowerCase().trim();
  if (!cleanQuery) return ALL_UNIFIED_TOOLS;
  
  // Try full phrase match first
  const exactMatches = ALL_UNIFIED_TOOLS.filter(
    (tool) =>
      tool.name.toLowerCase().includes(cleanQuery) ||
      tool.description.toLowerCase().includes(cleanQuery) ||
      tool.tags.some((tag) => tag.toLowerCase().replace(/^#/, '').includes(cleanQuery)) ||
      tool.supportedInputTypes.some((it) => it.toLowerCase().includes(cleanQuery)) ||
      tool.supportedOutputTypes.some((ot) => ot.toLowerCase().includes(cleanQuery)) ||
      (tool.hubName && tool.hubName.toLowerCase().includes(cleanQuery))
  );
  if (exactMatches.length > 0) return exactMatches;

  // Split query into terms if exact phrase yields nothing
  const terms = cleanQuery.split(/[\s,/\-\+]+/).map((t) => t.replace(/^#/, '')).filter(Boolean);
  if (terms.length <= 1) return exactMatches;

  return ALL_UNIFIED_TOOLS.filter((tool) => {
    // Return true if any term matches name, description, tags, or I/O
    return terms.some((term) => {
      return (
        tool.name.toLowerCase().includes(term) ||
        tool.description.toLowerCase().includes(term) ||
        tool.tags.some((tag) => tag.toLowerCase().replace(/^#/, '').includes(term)) ||
        tool.supportedInputTypes.some((it) => it.toLowerCase().includes(term)) ||
        tool.supportedOutputTypes.some((ot) => ot.toLowerCase().includes(term)) ||
        (tool.hub && tool.hub.toLowerCase().includes(term)) ||
        (tool.hubName && tool.hubName.toLowerCase().includes(term))
      );
    });
  });
};

export const getPopularUnifiedTools = (): ToolDefinition[] => {
  return ALL_UNIFIED_TOOLS.filter((t) => t.isPopular || t.isNew).slice(0, 9);
};
