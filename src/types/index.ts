export type ToolCategory =
  | 'converters'
  | 'documents'
  | 'developer'
  | 'generators'
  | 'utilities';

export interface CategoryMeta {
  id: ToolCategory;
  name: string;
  description: string;
  iconName: string;
  color: string;
}

export type InputType =
  | 'image'
  | 'svg'
  | 'pdf'
  | 'json'
  | 'csv'
  | 'xml'
  | 'markdown'
  | 'html'
  | 'css'
  | 'javascript'
  | 'text'
  | 'binary'
  | 'none';

export type OutputType =
  | 'image'
  | 'pdf'
  | 'json'
  | 'csv'
  | 'xml'
  | 'html'
  | 'css'
  | 'javascript'
  | 'text'
  | 'zip'
  | 'binary'
  | 'interactive';

export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  category: ToolCategory;
  description: string;
  longDescription?: string;
  iconName: string;
  supportedInputTypes: string[];
  supportedOutputTypes: string[];
  privacyNote: string;
  browserSupportNote: string;
  tags: string[];
  isPopular?: boolean;
  isNew?: boolean;
  maxFileSizeMB?: number;
  componentId: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  reducedMotion: 'system' | 'reduce' | 'no-preference';
  enableHistory: boolean;
  recentTools: string[];
  favoriteTools: string[];
  hasSeenWelcome: boolean;
}

export type AdSlotFormat =
  | 'horizontal-banner'
  | 'large-banner'
  | 'rectangle'
  | 'in-feed'
  | 'sidebar-rail';

export interface FeatureFlags {
  enableAds: boolean;
  adPreviewMode: boolean;
  enableTelemetry: false;
  enableExperimentalFeatures: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  durationMs?: number;
}

export interface ConversionResult {
  success: boolean;
  data?: any;
  blob?: Blob;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  previewUrl?: string;
  stats?: Record<string, string | number>;
  error?: string;
}
