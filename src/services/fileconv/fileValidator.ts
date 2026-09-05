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
    if (!svgText || typeof svgText !== 'string') return '';

    if (typeof DOMParser === 'undefined') {
      // Robust regex sanitization fallback for non-DOM / test environments
      return svgText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<(?:foreignObject|iframe|object|embed)\b[^<]*(?:(?!<\/(?:foreignObject|iframe|object|embed)>)<[^<]*)*<\/(?:foreignObject|iframe|object|embed)>/gi, '')
        .replace(/<(?:foreignObject|iframe|object|embed)\b[^>]*\/?>/gi, '')
        .replace(/\son[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
        .replace(/(?:href|xlink:href|src)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'href="#"')
        .replace(/(?:href|xlink:href|src)\s*=\s*(?:'data:text\/html[^']*'|"data:text\/html[^"]*"|data:text\/html[^\s>]+)/gi, 'href="#"');
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');

      // Remove script tags, foreignObject, iframe, object, embed
      const unsafeElements = doc.querySelectorAll('script, foreignObject, iframe, object, embed');
      unsafeElements.forEach((el) => el.remove());

      // Remove event handlers and dangerous protocol URIs
      const allElements = doc.querySelectorAll('*');
      allElements.forEach((el) => {
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          const val = attr.value.trim().toLowerCase().replace(/[\x00-\x20\s]/g, '');
          if (
            name.startsWith('on') ||
            val.startsWith('javascript:') ||
            val.startsWith('vbscript:') ||
            val.startsWith('data:text/html')
          ) {
            el.removeAttribute(attr.name);
          }
        }
      });

      const serializer = new XMLSerializer();
      return serializer.serializeToString(doc);
    } catch {
      // Fallback if XML parsing encounters fatal syntax error
      return svgText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\son[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
    }
  },

  sanitizeHtmlText: (htmlText: string): string => {
    if (!htmlText || typeof htmlText !== 'string') return '';

    if (typeof DOMParser === 'undefined') {
      return htmlText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        .replace(/<(?:meta|base|form|foreignObject)\b[^>]*\/?>/gi, '')
        .replace(/\son[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
        .replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, 'href="#"')
        .replace(/href\s*=\s*(?:'data:text\/html[^']*'|"data:text\/html[^"]*"|data:text\/html[^\s>]+)/gi, 'href="#"');
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      // Strip dangerous tags completely
      const unsafeElements = doc.querySelectorAll(
        'script, iframe, object, embed, foreignObject, meta, base, form, applet, link[rel="import"]'
      );
      unsafeElements.forEach((el) => el.remove());

      const allElements = doc.querySelectorAll('*');
      allElements.forEach((el) => {
        // Strip event handlers and script protocols
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          const val = attr.value.trim().toLowerCase().replace(/[\x00-\x20\s]/g, '');
          if (
            name.startsWith('on') ||
            val.startsWith('javascript:') ||
            val.startsWith('vbscript:') ||
            val.startsWith('data:text/html')
          ) {
            el.removeAttribute(attr.name);
          }
        }

        // Validate links
        if (el.tagName === 'A') {
          const href = el.getAttribute('href');
          if (href) {
            const cleanedHref = href.trim().toLowerCase().replace(/[\x00-\x20\s]/g, '');
            if (
              cleanedHref.startsWith('javascript:') ||
              cleanedHref.startsWith('vbscript:') ||
              cleanedHref.startsWith('data:') ||
              cleanedHref.startsWith('file:')
            ) {
              el.setAttribute('href', '#');
            }
          }
        }

        // Validate image sources
        if (el.tagName === 'IMG') {
          const src = el.getAttribute('src');
          if (src) {
            const cleanedSrc = src.trim().toLowerCase().replace(/[\x00-\x20\s]/g, '');
            if (
              cleanedSrc.startsWith('javascript:') ||
              cleanedSrc.startsWith('vbscript:') ||
              (cleanedSrc.startsWith('data:') && !cleanedSrc.startsWith('data:image/'))
            ) {
              el.removeAttribute('src');
            }
          }
        }
      });

      return doc.body ? doc.body.innerHTML : htmlText;
    } catch {
      return htmlText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\son[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
    }
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
