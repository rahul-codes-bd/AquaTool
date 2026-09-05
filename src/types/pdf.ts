export type PdfToolCategory =
  | 'create'
  | 'edit'
  | 'organize'
  | 'optimize-repair'
  | 'security-privacy'
  | 'view-compare'
  | 'convert-to-pdf'
  | 'convert-from-pdf'
  | 'image-conversion';

export type PdfSupportLevel = 'ready' | 'beta' | 'coming-soon';

export interface PdfCategoryMeta {
  id: PdfToolCategory;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
  accentColor: string;
  toolCount?: number;
}

export interface PdfToolDefinition {
  id: string;
  slug: string;
  category: PdfToolCategory;
  title: string;
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  supportedInputTypes: string[];
  supportedOutputTypes: string[];
  browserSupportLevel: PdfSupportLevel;
  localProcessing: boolean;
  maxRecommendedFileSizeMB: number;
  requiredCapability: string;
  privacyNote: string;
  knownLimitations?: string[];
  tags: string[];
  isPopular?: boolean;
  isNew?: boolean;
  implementationStatus: 'implemented' | 'stub-ready' | 'coming-soon';
}

export interface PdfPageMetric {
  pageIndex: number;
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  widthMm: number;
  heightMm: number;
  widthInches: number;
  heightInches: number;
  orientation: 'Portrait' | 'Landscape' | 'Square';
  rotation: number;
  standardSize: string;
}

export interface PdfDocumentSummary {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date | string;
  modificationDate?: Date | string;
  pdfVersion?: string;
  isEncrypted: boolean;
  encryptionError?: string;
  fileSizeBytes: number;
  pages: PdfPageMetric[];
  hasMixedOrientations: boolean;
  hasMixedSizes: boolean;
}

export interface PdfPageOperation {
  pageIndex: number; // 0-based
  action: 'keep' | 'delete' | 'rotate' | 'duplicate';
  rotationAngle?: 0 | 90 | 180 | 270;
  newPosition?: number;
}

export interface PdfWatermarkConfig {
  text: string;
  fontSize: number;
  opacity: number; // 0 to 1
  rotationDegrees: number;
  colorHex: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  targetPages?: 'all' | 'odd' | 'even' | number[];
}

export interface PdfPageNumberConfig {
  format: 'page' | 'page-of-total' | 'roman' | 'custom';
  customTemplate?: string; // e.g. "Page {n} of {total}"
  fontSize: number;
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
  colorHex: string;
  marginPt: number;
  startNumber: number;
  targetPages?: 'all' | 'odd' | 'even' | number[];
}

export interface PdfMetadataUpdateConfig {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
}

export interface PdfImageToPdfConfig {
  pageSize: 'A4' | 'US-Letter' | 'Fit-Image' | 'A3' | 'A5';
  orientation: 'auto' | 'portrait' | 'landscape';
  marginPt: number;
  imageQuality?: number;
}

export interface PdfEngineResult {
  success: boolean;
  blob?: Blob;
  downloadUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  pageCount?: number;
  error?: string;
  warning?: string;
  executionTimeMs?: number;
}

export interface PdfValidationOptions {
  maxFileSizeMB?: number;
  requireValidSignature?: boolean;
  allowEmpty?: boolean;
  allowedExtensions?: string[];
  checkPasswordProtected?: boolean;
}

export interface PdfValidationResult {
  isValid: boolean;
  errorCode?: 'EMPTY_FILE' | 'INVALID_SIGNATURE' | 'FILE_TOO_LARGE' | 'INVALID_EXTENSION' | 'CORRUPTED' | 'PASSWORD_PROTECTED' | 'UNKNOWN';
  errorMessage?: string;
  warningMessage?: string;
  detectedVersion?: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  fileName: string;
}

export type PdfFormFieldType = 'text' | 'checkbox' | 'dropdown' | 'radio' | 'button' | 'unknown';

export interface PdfFormFieldInfo {
  name: string;
  type: PdfFormFieldType;
  value: any;
  options?: string[];
  isReadOnly?: boolean;
  isRequired?: boolean;
  pageIndex?: number;
}

export interface PdfNewFormField {
  id: string;
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'button';
  label?: string;
  pageIndex: number;
  x: number; // pt
  y: number; // pt
  width: number; // pt
  height: number; // pt
  defaultValue?: string | boolean;
  options?: string[]; // for dropdown/radio
  isRequired?: boolean;
  isMultiline?: boolean;
}

export type PdfAnnotationType =
  | 'text'
  | 'highlight'
  | 'draw'
  | 'rect'
  | 'circle'
  | 'arrow'
  | 'stamp'
  | 'strike'
  | 'note';

export interface PdfAnnotationItem {
  id: string;
  type: PdfAnnotationType;
  pageIndex: number; // 0-based
  x: number; // pt
  y: number; // pt
  width?: number; // pt
  height?: number; // pt
  text?: string;
  color?: string; // hex
  opacity?: number; // 0..1
  strokeWidth?: number;
  points?: Array<{ x: number; y: number }>;
  stampType?: 'APPROVED' | 'CONFIDENTIAL' | 'DRAFT' | 'VOID' | 'COMPLETED' | 'REVISED' | 'CUSTOM';
  fontSize?: number;
  fontFamily?: string;
}

export interface PdfBookmarkItem {
  id: string;
  title: string;
  pageNumber: number; // 1-based
  level?: number; // 0, 1, 2
  children?: PdfBookmarkItem[];
}

export interface PdfNUpConfig {
  count: 2 | 4 | 6 | 9 | 16;
  pageSize: 'original' | 'a4' | 'letter' | 'a3';
  orientation: 'auto' | 'portrait' | 'landscape';
  addBorder: boolean;
  marginPt: number;
  spacingPt: number;
  pageOrder: 'ltr' | 'ttb';
}

export interface PdfHalveConfig {
  direction: 'vertical' | 'horizontal';
  pageRange: string;
}

export interface PdfOverlayConfig {
  mode: 'overlay' | 'underlay';
  opacity: number; // 0.1 to 1.0
  scale: number; // 0.1 to 2.0
  offsetX: number; // pt
  offsetY: number; // pt
  repeatFirstOverlayPage: boolean;
  targetPages: string;
}

export interface PdfCompressConfig {
  mode: 'recommended' | 'extreme' | 'low' | 'lossless-structural' | 'custom';
  targetDpi: number; // e.g. 72, 120, 150, 200
  imageQuality: number; // 0.1 to 1.0
  grayscale: boolean;
  stripMetadata: boolean;
  cleanUnusedObjects: boolean;
}

export interface PdfExtractedImage {
  id: string;
  pageIndex: number;
  pageNumber: number;
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp';
  blob: Blob;
  dataUrl: string;
  sizeBytes: number;
  name: string;
}

export interface PdfRepairDiagnostic {
  isRecoverable: boolean;
  healthStatus: 'HEALTHY' | 'REPAIRED' | 'DEGRADED' | 'UNRECOVERABLE';
  recoveredPages: number;
  totalPagesEstimated: number;
  issuesDetected: string[];
  repairsApplied: string[];
  binaryHeaderFound: boolean;
  trailerRepaired: boolean;
  xrefRebuilt: boolean;
}

export interface PdfArchivalConfig {
  standard: 'PDF/A-1b' | 'PDF/A-2b' | 'PDF/A-3b';
  colorProfile: 'sRGB' | 'CMYK';
  title?: string;
  creator?: string;
  stripJavaScript: boolean;
  stripMultimedia: boolean;
}

export interface PdfWebOptimizeConfig {
  cleanObjectStreams: boolean;
  deflateStreams: boolean;
  removeUnusedResources: boolean;
  sortPageTree: boolean;
}

