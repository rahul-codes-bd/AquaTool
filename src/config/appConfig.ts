export const APP_CONFIG = {
  name: 'AquaTools',
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
