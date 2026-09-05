export const en = {
  common: {
    appName: 'AquaTools',
    tagline: 'Private, Local Browser Utilities',
    convert: 'Convert',
    compress: 'Compress',
    format: 'Format',
    generate: 'Generate',
    inspect: 'Inspect',
    download: 'Download',
    downloadAll: 'Download All (ZIP)',
    copy: 'Copy to Clipboard',
    copied: 'Copied!',
    reset: 'Reset',
    clear: 'Clear',
    process: 'Process',
    processing: 'Processing locally...',
    dragAndDrop: 'Drag and drop your file here, or click to browse',
    pasteSupport: 'You can also paste text directly using Ctrl+V / ⌘V',
    orBrowse: 'or choose a file from your computer',
    fileSizeLimit: 'Maximum file size: {size}MB',
    supportedFormats: 'Supported formats: {formats}',
    privacyBadge: 'Runs 100% locally in your browser',
    privacyBadgeTooltip: 'Your files are never transmitted to any external server or stored remotely.',
    comingSoon: 'Coming soon',
    comingSoonDesc: 'This feature is currently under active development.',
    backToHome: 'Back to Home',
    exploreAllTools: 'Explore All Tools',
    searchPlaceholder: 'What do you want to convert, format, or generate? (Press / to search)',
    noResults: 'No tools found matching your search.',
    clearAllData: 'Clear All Local Data',
    favorites: 'Favorites',
    recents: 'Recently Used',
    popular: 'Popular Utilities',
    categories: 'Categories',
    settings: 'Settings',
    privacy: 'Privacy Promise',
    security: 'Security',
    about: 'About',
    contact: 'Contact & Feedback',
    terms: 'Terms of Use',
    allRightsReserved: 'All processing takes place on your device. Zero cloud uploads.',
    adPlaceholder: 'Advertisement Placeholder (Disabled by default)',
    toggleTheme: 'Toggle Theme',
    dark: 'Dark Mode',
    light: 'Light Mode',
    system: 'System Default',
    success: 'Operation completed successfully!',
    error: 'An error occurred during processing.',
    warning: 'Warning',
    notice: 'Notice',
    statusReady: 'Ready',
    statusProcessing: 'Processing in memory...',
    statusDone: 'Completed',
    statusError: 'Error',
  },
  categories: {
    converters: {
      name: 'File Converters',
      description: 'Convert images, SVG, JSON, CSV, Markdown, Base64, and code formats without uploading.',
    },
    documents: {
      name: 'Document & PDF',
      description: 'Merge, split, count pages, and inspect PDF metadata locally using WebAssembly and pure JS.',
    },
    developer: {
      name: 'Developer & Text',
      description: 'Cryptographic hashes, JWT decoding, UUIDs, passwords, regex testing, diffing, and formatting.',
    },
    generators: {
      name: 'Generators',
      description: 'Create QR codes, favicons, robots.txt, sitemaps, CSS gradients, color palettes, and mock data.',
    },
    utilities: {
      name: 'Image & Utilities',
      description: 'Crop images, pick colors, inspect file signatures, and calculate text statistics.',
    },
  },
  privacyPage: {
    title: 'Privacy by Architecture',
    subtitle: 'Zero cloud dependencies, zero telemetry, and zero file transfers by design.',
    guarantee1Title: '100% Local Execution',
    guarantee1Desc: 'Every single byte of your files, images, PDFs, and text stays inside your browser tab memory. We do not operate conversion servers.',
    guarantee2Title: 'No Account, No Tracking',
    guarantee2Desc: 'AquaTools requires no sign-up, no email address, no authentication tokens, and includes zero third-party advertising or analytics trackers.',
    guarantee3Title: 'Instant Memory Cleanup',
    guarantee3Desc: 'Object URLs and canvas bitmaps are explicitly freed and garbage collected. No file contents are ever stored in persistent browser storage.',
    guarantee4Title: 'Transparent Open Source Approach',
    guarantee4Desc: 'All algorithms leverage standard W3C Web APIs (Canvas2D, Web Crypto, Blob, FileReader) and audited pure JavaScript libraries.',
  },
  securityPage: {
    title: 'Security Architecture',
    subtitle: 'Defense in depth for browser-based file manipulation.',
    cryptoTitle: 'Cryptographically Secure Randomness',
    cryptoDesc: 'All password and UUID generators strictly use window.crypto.getRandomValues() and SubtleCrypto, not Math.random().',
    jwtTitle: 'Safe Offline JWT Decoding',
    jwtDesc: 'The JWT decoder only reads token claims locally for developer inspection. It does NOT assert cryptographic verification without explicit key validation.',
    cspTitle: 'Safe Code Isolation',
    cspDesc: 'We do not run eval() or inject untrusted HTML. Markdown and SVG rendering are sandboxed to protect against XSS vectors.',
  },
  settingsPage: {
    title: 'Preferences & Local Storage',
    themeSetting: 'Theme Preference',
    historySetting: 'Enable Local Tool History',
    historyDesc: 'Save a list of the last 10 tools you visited in your browser (Disabled by default). No file data is ever stored.',
    clearDataBtn: 'Wipe All Local Storage & Preferences',
    clearDataConfirm: 'Are you sure you want to clear all AquaTools preferences and bookmarks?',
    clearedSuccess: 'Local preferences cleared successfully.',
  },
};

export type TranslationKey = typeof en;

export function t(path: string, params?: Record<string, string | number>): string {
  const keys = path.split('.');
  let current: any = en;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return path;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  let result = current;
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
    });
  }

  return result;
}
