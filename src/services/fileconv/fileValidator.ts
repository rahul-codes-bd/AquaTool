export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

export const FileValidator = {
  validateFile: (file: File, maxBytes: number = 100 * 1024 * 1024): ValidationResult => {
    if (!file || file.size === 0) {
      return { valid: false, error: 'The selected file is empty or invalid.' };
    }

    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the recommended browser safety limit of ${(maxBytes / (1024 * 1024)).toFixed(1)} MB.`,
      };
    }

    return { valid: true };
  },

  sanitizeSvgText: (svgText: string): string => {
    if (typeof DOMParser === 'undefined') {
      // Fallback regex sanitization for Node test environment
      return svgText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');

    // Remove script tags and foreignObject
    const scripts = doc.querySelectorAll('script, foreignObject, iframe, object, embed');
    scripts.forEach((el) => el.remove());

    // Remove event handlers and javascript: URIs
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const val = attr.value.toLowerCase();
        if (name.startsWith('on') || val.includes('javascript:') || val.includes('data:text/html')) {
          el.removeAttribute(attr.name);
        }
      }
    });

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  },

  sanitizeHtmlText: (htmlText: string): string => {
    if (typeof DOMParser === 'undefined') {
      return htmlText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const unsafeElements = doc.querySelectorAll('script, iframe, object, embed, foreignObject');
    unsafeElements.forEach((el) => el.remove());

    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const val = attr.value.toLowerCase();
        if (name.startsWith('on') || val.includes('javascript:') || val.includes('data:text/html')) {
          el.removeAttribute(attr.name);
        }
      }
    });

    return doc.body ? doc.body.innerHTML : htmlText;
  },

  checkArchiveEntryPath: (entryPath: string): boolean => {
    // Prevent path traversal, absolute paths, null bytes, and encoded sequences
    const normalized = entryPath.toLowerCase();
    if (
      normalized.includes('..') ||
      normalized.includes('%2e%2e') ||
      normalized.startsWith('/') ||
      normalized.startsWith('\\') ||
      normalized.includes(':\\') ||
      normalized.includes('\0')
    ) {
      return false;
    }
    return true;
  },

  escapeHtml: (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  escapeFilename: (filename: string): string => {
    return filename.replace(/[/\\?%*:|"<>]/g, '_').trim();
  },
};
