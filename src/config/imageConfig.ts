export const IMAGE_CONFIG = {
  name: 'AquaTools Image Studio',
  version: '2.0.0',
  description: '100% Client-Side, Privacy-First Image Tools & Processing Suite',

  // Feature Flags (Strict zero telemetry & disabled ads by default)
  ENABLE_ADS: false,
  ENABLE_ANALYTICS: false,
  ENABLE_WORKER_OFFLOAD: true,
  ENABLE_EXPERIMENTAL_AVIF: true,

  // Memory & Safety Limits
  MAX_SAFE_FILE_SIZE_MB: 50,
  MAX_RECOMMENDED_BATCH_FILES: 50,
  MAX_SAFE_DIMENSION_PX: 8192,
  MAX_SAFE_PIXEL_BUDGET: 36000000, // 36 Megapixels to prevent browser tab crashing
  MAX_PREVIEW_DIMENSION_PX: 2048,

  // Supported Input Formats
  SUPPORTED_INPUT_MIME_TYPES: [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/avif',
    'image/svg+xml',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/heic',
    'image/heif',
  ],

  SUPPORTED_INPUT_EXTENSIONS: [
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.avif',
    '.svg',
    '.gif',
    '.bmp',
    '.tiff',
    '.tif',
    '.ico',
    '.heic',
    '.heif',
  ],

  // Export Formats and MIME mapping
  EXPORT_FORMATS: [
    { id: 'image/png', label: 'PNG (.png)', extension: 'png', lossless: true, supportsAlpha: true, defaultQuality: 1.0 },
    { id: 'image/jpeg', label: 'JPEG (.jpg)', extension: 'jpg', lossless: false, supportsAlpha: false, defaultQuality: 0.88 },
    { id: 'image/webp', label: 'WebP (.webp)', extension: 'webp', lossless: false, supportsAlpha: true, defaultQuality: 0.85 },
    { id: 'image/avif', label: 'AVIF (.avif)', extension: 'avif', lossless: false, supportsAlpha: true, defaultQuality: 0.80 },
    { id: 'image/bmp', label: 'BMP (.bmp)', extension: 'bmp', lossless: true, supportsAlpha: false, defaultQuality: 1.0 },
    { id: 'image/x-icon', label: 'ICO Favicon (.ico)', extension: 'ico', lossless: true, supportsAlpha: true, defaultQuality: 1.0 },
    { id: 'image/svg+xml', label: 'SVG (.svg)', extension: 'svg', lossless: true, supportsAlpha: true, defaultQuality: 1.0 },
  ],

  // Preset Resolution Options
  RESOLUTION_PRESETS: [
    { label: 'Original', value: 'original' },
    { label: 'Full HD (1920×1080)', width: 1920, height: 1080 },
    { label: '4K UHD (3840×2160)', width: 3840, height: 2160 },
    { label: 'Square Avatar (512×512)', width: 512, height: 512 },
    { label: 'Instagram Square (1080×1080)', width: 1080, height: 1080 },
    { label: 'Instagram Story (1080×1920)', width: 1080, height: 1920 },
    { label: 'OpenGraph Banner (1200×630)', width: 1200, height: 630 },
    { label: 'Favicon High-Res (256×256)', width: 256, height: 256 },
    { label: 'Favicon Standard (32×32)', width: 32, height: 32 },
  ],

  // Standard Aspect Ratio Presets
  ASPECT_RATIOS: [
    { label: 'Freeform', value: 'free', ratio: null },
    { label: '1:1 Square', value: '1:1', ratio: 1 },
    { label: '16:9 Widescreen', value: '16:9', ratio: 16 / 9 },
    { label: '9:16 Vertical Story', value: '9:16', ratio: 9 / 16 },
    { label: '4:3 Standard Photo', value: '4:3', ratio: 4 / 3 },
    { label: '3:2 Classic 35mm', value: '3:2', ratio: 3 / 2 },
    { label: '2:3 Vertical Portrait', value: '2:3', ratio: 2 / 3 },
    { label: '21:9 Ultrawide Cinematic', value: '21:9', ratio: 21 / 9 },
  ],

  // Quality Profiles
  QUALITY_PRESETS: [
    { label: 'Maximum (100%)', quality: 1.0, desc: 'Pristine quality, zero artifacts' },
    { label: 'High (90%)', quality: 0.9, desc: 'Excellent fidelity, balanced file size' },
    { label: 'Web Optimized (80%)', quality: 0.8, desc: 'Recommended for websites & loading speed' },
    { label: 'Medium (65%)', quality: 0.65, desc: 'High compression for messaging or email' },
    { label: 'Extreme (45%)', quality: 0.45, desc: 'Maximum byte reduction' },
  ],

  // Target Size Approximation Presets
  TARGET_SIZE_PRESETS: [
    { label: '50 KB', valueKb: 50 },
    { label: '100 KB', valueKb: 100 },
    { label: '200 KB', valueKb: 200 },
    { label: '500 KB', valueKb: 500 },
    { label: '1 MB', valueKb: 1024 },
    { label: '2 MB', valueKb: 2048 },
  ],

  TARGET_SIZE_DISCLAIMER:
    'Target size is an approximation based on progressive client-side entropy and quantization heuristics. Exact byte sizes cannot be guaranteed due to container metadata, compression boundaries, and image complexity.',
};
