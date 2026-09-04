// Production base URL for canonical tags, OpenGraph, and Sitemap generation.
// To configure your final production domain, you can:
// 1. Set the VITE_SITE_URL environment variable in your .env file or build settings (e.g. VITE_SITE_URL="https://yourdomain.com")
// 2. Set the SITE_URL environment variable during build time (e.g. SITE_URL="https://yourdomain.com")
// 3. Or replace the empty string fallback below with your production URL.
const getSiteUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SITE_URL) {
    const envUrl = import.meta.env.VITE_SITE_URL.replace(/\/$/, '');
    if (envUrl && envUrl !== 'https://aquatools.app' && !envUrl.includes('placeholder')) {
      return envUrl;
    }
  }
  if (typeof process !== 'undefined' && process.env && process.env.SITE_URL) {
    const procUrl = process.env.SITE_URL.replace(/\/$/, '');
    if (procUrl && procUrl !== 'https://aquatools.app' && !procUrl.includes('placeholder')) {
      return procUrl;
    }
  }
  // No real domain configured yet. Returns empty string to disable sitemap generation
  // and prevent injection of fake/placeholder domains in production SEO metadata.
  return '';
};

export const SITE_URL = getSiteUrl();

export const APP_CONFIG = {
  name: 'AquaTools',
  SITE_URL,
  tagline: 'Fast, private, client-side browser utilities',
  heroSubtitle: 'Convert, compress, generate, format, and inspect your files directly in your browser. Zero cloud uploads, zero tracking, 100% private.',
  version: '2.4.0',
  license: 'MIT',
  
  // Feature flags
  ENABLE_ADS: false,
  ENABLE_ANALYTICS: false,
  DEFAULT_ENABLE_HISTORY: false,
  
  // Storage keys
  STORAGE_KEYS: {
    PREFERENCES: 'aquatools_preferences_v1',
    THEME: 'aquatools_theme_mode',
    FAVORITES: 'aquatools_favorites_v1',
    RECENT_TOOLS: 'aquatools_recents_v1',
  },

  // Limits
  LIMITS: {
    MAX_IMAGE_SIZE_MB: 50,
    MAX_PDF_SIZE_MB: 100,
    MAX_TEXT_SIZE_MB: 10,
    MAX_GENERAL_FILE_SIZE_MB: 100,
    MAX_FAVORITES: 30,
    MAX_RECENTS: 10,
  },

  // Author & Links
  SUPPORT_EMAIL: 'support@aquatools.local',
  GITHUB_URL: 'https://github.com/aquatools/aquatools',
};
