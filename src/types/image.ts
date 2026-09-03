export type ImageToolCategory =
  | 'convert'
  | 'compress-optimize'
  | 'resize-crop'
  | 'edit-design'
  | 'background-object'
  | 'metadata-privacy'
  | 'ocr-scan'
  | 'color-accessibility'
  | 'batch-workflows'
  | 'developer-assets'
  | 'utilities';

export interface ImageCategoryMeta {
  id: ImageToolCategory;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
  accentColor: string;
  count?: number;
}

export type ImageToolStatus = 'ready' | 'beta' | 'coming-soon';

export interface ImageToolDefinition {
  id: string;
  slug: string;
  category: ImageToolCategory;
  title: string;
  description: string;
  shortDescription?: string;
  fullDescription?: string;
  iconName: string;
  acceptedTypes: string[];
  outputTypes: string[];
  runsLocally: boolean;
  status: ImageToolStatus;
  maxRecommendedSize: number; // in MB
  privacyNote: string;
  knownLimitations: string[];
  tags: string[];
  isPopular?: boolean;
  isNew?: boolean;
  load?: () => Promise<unknown>;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageCropBox {
  x: number;
  y: number;
  width: number;
  height: number;
  unit?: 'px' | '%';
}

export type ImageFitMode = 'contain' | 'cover' | 'fill' | 'inside' | 'outside';

export interface ImageProcessingConfig {
  format: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif' | 'image/bmp' | 'image/svg+xml' | 'image/x-icon' | string;
  quality?: number; // 0.01 - 1.0
  compressionMode?: 'quality' | 'target-size' | 'lossless';
  lossless?: boolean; // For formats supporting lossless mode like WebP / PNG
  targetSizeKb?: number; // Target size in KB for approximation
  targetSizeBytes?: number; // Target size in bytes for approximation
  stripMetadata?: boolean; // Strip EXIF & private camera metadata
  preserveTransparency?: boolean; // Preserve PNG/WebP alpha channel
  width?: number;
  height?: number;
  scalePercent?: number; // e.g. 50% = 0.5
  maintainAspectRatio?: boolean;
  fitMode?: ImageFitMode;
  backgroundColor?: string;
  cropBox?: ImageCropBox;
  rotationAngle?: number; // 0, 90, 180, 270
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  grayscale?: boolean;
  sepia?: boolean;
  invert?: boolean;
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  exposure?: number; // -100 to 100
  temperature?: number; // -100 to 100
  tint?: number; // -100 to 100
  blurRadius?: number; // 0 to 50
  pixelateSize?: number; // 0 to 40
  sharpen?: boolean;
  borderSize?: number; // 0 to 50
  borderColor?: string;
  borderRadius?: number; // 0 to 200
  shadowBlur?: number; // 0 to 50
  shadowColor?: string;
  customText?: string;
  customTextX?: number; // 0 to 100 percentage
  customTextY?: number; // 0 to 100 percentage
  customTextSize?: number;
  customTextColor?: string;
  shapeOverlay?: 'none' | 'rectangle' | 'circle' | 'star';
  drawingPaths?: Array<{ points: Array<{ x: number; y: number }>; color: string; size: number }>;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkPosition?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile';
}

export interface ImageStats {
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
  originalSize: number;
  newSize: number;
  compressionRatio: string;
  savingsPercent: number;
  format: string;
  mimeType: string;
  durationMs?: number;
  isDownscaledForSafety?: boolean;
  processedWithWorker?: boolean;
}

export interface ImageFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  dimensions?: ImageDimensions;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  resultBlob?: Blob;
  resultUrl?: string;
  resultFileName?: string;
  stats?: ImageStats;
  resultStats?: ImageStats;
  metadata?: ImageMetadataReport;
  palette?: PaletteExtractionResult;
  error?: string;
  customConfig?: Partial<ImageProcessingConfig>;
}

export interface ExifTagInfo {
  tag: string;
  name: string;
  value: string | number;
  category: 'camera' | 'location' | 'date' | 'technical' | 'author';
}

export interface PrivacyRiskItem {
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  remedy: string;
  canAutoFix: boolean;
}

export interface ImageMetadataReport {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  dimensions: ImageDimensions;
  aspectRatio: number;
  aspectRatioLabel: string;
  megapixels: number;
  colorSpace?: string;
  hasAlphaChannel: boolean;
  exifTags: ExifTagInfo[];
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    mapPreviewQuery?: string;
  };
  dateTimeOriginal?: string;
  cameraMake?: string;
  cameraModel?: string;
  software?: string;
  authorOrArtist?: string;
  privacyRiskLevel: 'none' | 'low' | 'medium' | 'high';
  privacyRisks: PrivacyRiskItem[];
}

export interface ColorSwatch {
  hex: string;
  rgb: string;
  hsl: string;
  r: number;
  g: number;
  b: number;
  luminance: number;
  isDark: boolean;
  percent: number;
  name?: string;
}

export interface PaletteExtractionResult {
  dominantColor: ColorSwatch;
  swatches: ColorSwatch[];
  hasAlpha: boolean;
  lightBackgroundSuitable: boolean;
  darkBackgroundSuitable: boolean;
}
