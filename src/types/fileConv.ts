export type ConversionCategory =
  | 'universal'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'audio'
  | 'video'
  | 'ebook'
  | 'archive'
  | 'font'
  | 'developer'
  | 'web'
  | 'workflows';

export type ProcessingMode = 'browser' | 'wasm' | 'hybrid' | 'coming-soon';
export type ToolStatus = 'ready' | 'beta' | 'coming-soon';

export interface FileConversionTool {
  id: string;
  slug: string;
  category: ConversionCategory;
  title: string;
  description: string;
  acceptedMimeTypes: string[];
  acceptedExtensions: string[];
  outputFormats: string[];
  processingMode: ProcessingMode;
  status: ToolStatus;
  maxRecommendedBytes: number;
  privacyNote: string;
  knownLimitations: string[];
  load: () => Promise<unknown>;
}

export interface ConversionQueueItem {
  id: string;
  file: File;
  sourceFormat: string;
  targetFormat: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'cancelled';
  progress: number;
  resultBlob?: Blob;
  resultUrl?: string;
  resultFilename?: string;
  error?: string;
  report?: ConversionReportData;
}

export interface ConversionReportData {
  sourceFormat: string;
  outputFormat: string;
  sourceSizeBytes: number;
  outputSizeBytes: number;
  reductionPercentage: number;
  durationMs: number;
  warnings: string[];
  metadataPreserved: boolean;
  processingMode: ProcessingMode;
}

export type UseCasePreset = 'web' | 'mobile' | 'print' | 'email' | 'archive' | 'social';
