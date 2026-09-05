import * as Diff from 'diff';
import { FileValidator } from './fileconv/fileValidator';

export interface XmlValidationResult {
  isValid: boolean;
  error?: string;
}

export interface JsonValidationResult {
  isValid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

export interface DuplicateRemovalResult {
  result: string;
  originalCount: number;
  uniqueCount: number;
  duplicatesRemoved: number;
}

export class TextTools {
  // --- JSON Validation, Formatting & Minification ---
  static validateJson(code: string): JsonValidationResult {
    if (!code || !code.trim()) {
      return { isValid: false, error: 'Input is empty.' };
    }
    try {
      JSON.parse(code);
      return { isValid: true };
    } catch (err: any) {
      const msg = err.message || 'Malformed JSON syntax';
      let line: number | undefined;
      let column: number | undefined;
      const match = msg.match(/line (\d+) column (\d+)/i) || msg.match(/position (\d+)/i);
      if (match && match[1] && match[2]) {
        line = parseInt(match[1], 10);
        column = parseInt(match[2], 10);
      }
      return { isValid: false, error: msg, line, column };
    }
  }

  static formatJson(code: string, indent = 2): string {
    if (!code || !code.trim()) {
      throw new Error('JSON formatting failed: Input is empty.');
    }
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, indent);
    } catch (err: any) {
      throw new Error(`Malformed JSON syntax: ${err.message}`);
    }
  }

  static minifyJson(code: string): string {
    if (!code || !code.trim()) {
      throw new Error('JSON minification failed: Input is empty.');
    }
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed);
    } catch (err: any) {
      throw new Error(`Malformed JSON syntax: ${err.message}`);
    }
  }

  // --- JSON <-> CSV ---
  static jsonToCsv(jsonString: string, delimiter = ','): string {
    if (!jsonString || !jsonString.trim()) {
      throw new Error('JSON to CSV conversion failed: Input is empty.');
    }
    let raw: any;
    try {
      raw = JSON.parse(jsonString);
    } catch (err: any) {
      throw new Error(`Malformed JSON input: ${err.message}`);
    }

    if (raw === null || typeof raw !== 'object') {
      throw new Error('JSON structure must be an array of objects or an object with key-value pairs.');
    }

    const array = Array.isArray(raw) ? raw : [raw];
    if (array.length === 0) return '';

    // Collect all unique keys
    const headers = Array.from(
      new Set(
        array.flatMap((item) => (typeof item === 'object' && item !== null ? Object.keys(item) : []))
      )
    );

    if (headers.length === 0) {
      throw new Error('JSON structure must contain objects with key-value pairs.');
    }

    const escapeValue = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerRow = headers.map((h) => escapeValue(h)).join(delimiter);
    const dataRows = array.map((row) => {
      return headers.map((header) => escapeValue(row ? row[header] : '')).join(delimiter);
    });

    return [headerRow, ...dataRows].join('\n');
  }

  static csvToJson(csvString: string, delimiter = ','): string {
    if (!csvString || !csvString.trim()) {
      return '[]';
    }

    // Robust CSV parser supporting quoted cells with escaped quotes and embedded commas/newlines
    const parseCsvRows = (text: string, delim: string): string[][] => {
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let insideQuotes = false;
      let i = 0;

      while (i < text.length) {
        const char = text[i];

        if (char === '"') {
          if (insideQuotes && text[i + 1] === '"') {
            currentField += '"';
            i += 2;
            continue;
          } else {
            insideQuotes = !insideQuotes;
            i++;
            continue;
          }
        }

        if (!insideQuotes && char === delim) {
          currentRow.push(currentField);
          currentField = '';
          i++;
          continue;
        }

        if (!insideQuotes && (char === '\n' || char === '\r')) {
          if (char === '\r' && text[i + 1] === '\n') {
            i++;
          }
          currentRow.push(currentField);
          currentField = '';
          // Only push if row has content or we already have rows
          if (currentRow.length > 1 || currentRow[0] !== '') {
            rows.push(currentRow);
          }
          currentRow = [];
          i++;
          continue;
        }

        currentField += char;
        i++;
      }

      if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField);
        if (currentRow.length > 1 || currentRow[0] !== '') {
          rows.push(currentRow);
        }
      }

      return rows;
    };

    const rows = parseCsvRows(csvString, delimiter);
    if (rows.length === 0) return '[]';

    const headers = rows[0].map((h) => h.trim());
    if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
      return '[]';
    }

    const items = rows.slice(1).map((values) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        let val: any = values[idx] !== undefined ? values[idx].trim() : '';
        // Auto-cast booleans and numbers safely
        if (val.toLowerCase() === 'true') val = true;
        else if (val.toLowerCase() === 'false') val = false;
        else if (val.toLowerCase() === 'null') val = null;
        else if (val !== '' && !isNaN(Number(val)) && !/^\s*$/.test(val)) {
          val = Number(val);
        }
        obj[h] = val;
      });
      return obj;
    });

    return JSON.stringify(items, null, 2);
  }

  // --- XML Validation, Formatting & Minification ---
  static validateXml(xml: string): XmlValidationResult {
    if (!xml || !xml.trim()) {
      return { isValid: false, error: 'XML string is empty.' };
    }

    // Pure client-safe XML syntax check
    let clean = xml.replace(/<\?[\s\S]*?\?>/g, ''); // XML declaration
    clean = clean.replace(/<!--[\s\S]*?-->/g, ''); // Comments
    clean = clean.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, ''); // CDATA
    clean = clean.replace(/<!DOCTYPE[\s\S]*?>/g, ''); // Doctype

    if (!clean.trim()) {
      return { isValid: false, error: 'XML contains no element tags.' };
    }

    const tagRegex = /<\/?([a-zA-Z0-9_:\.-]+)(?:\s+[^>]*?)?(\/?)>/g;
    const stack: string[] = [];
    let match: RegExpExecArray | null;
    let foundRoot = false;
    let rootClosed = false;

    // Check for unclosed tag brackets like "<tag" without ">"
    const openBrackets = (xml.match(/</g) || []).length;
    const closeBrackets = (xml.match(/>/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return { isValid: false, error: 'Unbalanced tag brackets: missing < or > in XML.' };
    }

    while ((match = tagRegex.exec(clean)) !== null) {
      const fullTag = match[0];
      const tagName = match[1];
      const isSelfClosing = match[2] === '/' || fullTag.endsWith('/>');
      const isClosing = fullTag.startsWith('</');

      if (!foundRoot && !isClosing) {
        foundRoot = true;
      } else if (rootClosed && !isClosing) {
        return { isValid: false, error: 'Multiple root elements found. XML must have exactly one root element.' };
      }

      if (isSelfClosing) {
        continue;
      }

      if (isClosing) {
        if (stack.length === 0) {
          return { isValid: false, error: `Unexpected closing tag </${tagName}> without matching open tag.` };
        }
        const last = stack.pop();
        if (last !== tagName) {
          return { isValid: false, error: `Mismatched closing tag: expected </${last}>, but found </${tagName}>.` };
        }
        if (stack.length === 0 && foundRoot) {
          rootClosed = true;
        }
      } else {
        stack.push(tagName);
      }
    }

    if (!foundRoot) {
      return { isValid: false, error: 'No valid XML root element detected.' };
    }

    if (stack.length > 0) {
      return { isValid: false, error: `Unclosed tag: <${stack[stack.length - 1]}> was never closed.` };
    }

    return { isValid: true };
  }

  static formatXml(xml: string, indentSize = 2): string {
    const validation = this.validateXml(xml);
    if (!validation.isValid) {
      throw new Error(`Malformed XML: ${validation.error}`);
    }

    const tab = ' '.repeat(indentSize);
    let formatted = '';
    let indent = 0;

    // Normalize spacing between tags
    const clean = xml.replace(/>\s*</g, '><').trim();
    const tagRegex = /(<[^>]+>)/g;
    const parts = clean.split(tagRegex).filter((p) => p.trim().length > 0);

    parts.forEach((part) => {
      if (part.startsWith('<?') || part.startsWith('<!DOCTYPE')) {
        formatted += part + '\n';
      } else if (part.startsWith('<!--') || part.startsWith('<![CDATA[')) {
        formatted += tab.repeat(indent) + part + '\n';
      } else if (part.startsWith('</')) {
        indent = Math.max(0, indent - 1);
        formatted += tab.repeat(indent) + part + '\n';
      } else if (part.startsWith('<') && part.endsWith('/>')) {
        formatted += tab.repeat(indent) + part + '\n';
      } else if (part.startsWith('<')) {
        formatted += tab.repeat(indent) + part + '\n';
        indent++;
      } else {
        // Text node
        formatted = formatted.trimEnd();
        formatted += part;
      }
    });

    return formatted.trim();
  }

  static minifyXml(xml: string): string {
    const validation = this.validateXml(xml);
    if (!validation.isValid) {
      throw new Error(`Malformed XML: ${validation.error}`);
    }
    return xml
      .replace(/<!--[\s\S]*?-->/g, '') // remove comments
      .replace(/>\s+</g, '><')
      .trim();
  }

  // --- HTML / CSS / JS ---
  static formatHtml(html: string): string {
    if (!html || !html.trim()) return '';
    let formatted = '';
    let pad = 0;
    const tokens = html.replace(/>\s*</g, '><').split(/(?=[<])/);
    tokens.forEach((token) => {
      let indent = 0;
      if (token.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (token.match(/^<\/\w/)) {
        if (pad !== 0) pad -= 1;
      } else if (token.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }
      formatted += '  '.repeat(pad) + token + '\n';
      pad += indent;
    });
    return formatted.trim();
  }

  static minifyHtml(html: string): string {
    return html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .replace(/> </g, '><')
      .trim();
  }

  static formatCss(css: string): string {
    return css
      .replace(/\s*\{\s*/g, ' {\n  ')
      .replace(/\s*;\s*/g, ';\n  ')
      .replace(/\s*\}\s*/g, '\n}\n\n')
      .replace(/\n  \n/g, '\n')
      .trim();
  }

  static minifyCss(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .trim();
  }

  static minifyJs(js: string): string {
    return js
      .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1')
      .replace(/^\s+|\s+$/gm, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  // --- Markdown to HTML (Client-safe with XSS Sanitization) ---
  static markdownToHtml(md: string): string {
    if (!md || !md.trim()) return '';

    // Step 1: Pre-sanitize dangerous script/iframe tags
    let clean = md
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:[^"'\s)]*/gi, '#');

    // Step 2: Code blocks
    clean = clean.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<pre class="bg-slate-900 text-cyan-300 p-4 rounded-xl my-3 overflow-x-auto text-xs font-mono border border-slate-800"><div class="text-[10px] text-slate-500 font-bold uppercase mb-1">${lang || 'code'}</div><code>${escapedCode}</code></pre>`;
    });

    // Step 3: Inline code
    clean = clean.replace(/`([^`]+)`/g, (_, c) => {
      const esc = c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<code class="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">${esc}</code>`;
    });

    // Step 4: Tables
    clean = clean.replace(
      /(^\|[^\n]+\|\r?\n\|[-:| ]+\|\r?\n(?:\|[^\n]+\|\r?\n?)+)/gm,
      (tableText) => {
        const rows = tableText.trim().split(/\r?\n/);
        if (rows.length < 2) return tableText;
        const headers = rows[0]
          .split('|')
          .slice(1, -1)
          .map((h) => `<th class="border border-slate-700 bg-slate-800 px-3 py-1.5 text-left font-semibold text-slate-200">${h.trim()}</th>`)
          .join('');
        const bodyRows = rows
          .slice(2)
          .map((r) => {
            const cells = r
              .split('|')
              .slice(1, -1)
              .map((c) => `<td class="border border-slate-800 px-3 py-1 text-slate-300">${c.trim()}</td>`)
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');
        return `<div class="overflow-x-auto my-3"><table class="w-full border-collapse border border-slate-700 text-xs"><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
      }
    );

    // Step 5: Headings
    clean = clean
      .replace(/^###### (.*$)/gim, '<h6 class="text-xs font-bold my-2 text-slate-300">$1</h6>')
      .replace(/^##### (.*$)/gim, '<h5 class="text-sm font-bold my-2 text-slate-200">$1</h5>')
      .replace(/^#### (.*$)/gim, '<h4 class="text-base font-bold my-2 text-cyan-400">$1</h4>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold my-3 text-cyan-300">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold my-3 text-cyan-200 border-b border-slate-800 pb-1">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-4 text-cyan-100 border-b border-slate-700 pb-2">$1</h1>');

    // Step 6: Blockquotes
    clean = clean.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-cyan-500 pl-4 py-1.5 my-2 italic text-slate-300 bg-cyan-950/20 rounded-r">$1</blockquote>');

    // Step 7: Checkbox task lists
    clean = clean.replace(/^- \[x\] (.*$)/gim, '<li class="list-none flex items-center gap-2 text-cyan-300"><input type="checkbox" checked disabled class="rounded accent-cyan-400" /> <span>$1</span></li>');
    clean = clean.replace(/^- \[ \] (.*$)/gim, '<li class="list-none flex items-center gap-2 text-slate-400"><input type="checkbox" disabled class="rounded" /> <span>$1</span></li>');

    // Step 8: Lists
    clean = clean.replace(/^[\*\-] (.*$)/gim, '<li class="ml-4 list-disc text-slate-300 my-0.5">$1</li>');
    clean = clean.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-slate-300 my-0.5">$1</li>');

    // Step 9: Text styling
    clean = clean
      .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-slate-100">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic text-slate-200">$1</em>')
      .replace(/~~(.*?)~~/gim, '<del class="line-through text-slate-500">$1</del>');

    // Step 10: Links & Images
    clean = clean.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="max-w-full rounded-xl my-3 border border-slate-800" />');
    clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 underline hover:text-cyan-300">$1</a>');

    // Step 11: Horizontal rules
    clean = clean.replace(/^(?:---|\*\*\*|___)$/gim, '<hr class="border-slate-800 my-4" />');

    // Step 12: Paragraphs / breaks
    clean = clean.replace(/\n\n/g, '<br class="my-2" />');

    // Step 13: Strict XSS sanitization (removes scripts, iframes, on* handlers, dangerous protocols)
    return FileValidator.sanitizeHtmlText(clean);
  }

  // --- Base64 & URL ---
  static textToBase64(str: string): string {
    if (typeof str !== 'string') {
      throw new Error('Input must be a string.');
    }
    // UTF-8 safe base64 encode using TextEncoder
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  static base64ToText(b64: string): string {
    if (typeof b64 !== 'string') {
      throw new Error('Input must be a string.');
    }
    const sanitized = b64.replace(/\s+/g, '');
    if (!sanitized) return '';

    // Validate standard Base64 characters and padding
    if (!/^[A-Za-z0-9+/=]+$/.test(sanitized)) {
      throw new Error('Invalid Base64 sequence: String contains invalid characters.');
    }

    try {
      const binary = atob(sanitized);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (err: any) {
      throw new Error(`Malformed Base64 input: ${err.message || 'Invalid byte encoding'}`);
    }
  }

  static async fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file into Base64 data.'));
      reader.readAsDataURL(file);
    });
  }

  static urlEncode(str: string, componentOnly = true): string {
    if (typeof str !== 'string') return '';
    return componentOnly ? encodeURIComponent(str) : encodeURI(str);
  }

  static urlDecode(str: string, componentOnly = true): string {
    if (typeof str !== 'string') return '';
    try {
      return componentOnly ? decodeURIComponent(str) : decodeURI(str);
    } catch (err: any) {
      throw new Error(`Malformed URI sequence: ${err.message || 'Invalid percent-encoded character'}`);
    }
  }

  static parseQueryParams(urlOrQuery: string): { key: string; value: string }[] {
    if (!urlOrQuery || !urlOrQuery.trim()) return [];
    try {
      let queryStr = urlOrQuery;
      if (queryStr.includes('?')) {
        queryStr = queryStr.split('?')[1];
      }
      if (queryStr.includes('#')) {
        queryStr = queryStr.split('#')[0];
      }
      const params = new URLSearchParams(queryStr);
      const list: { key: string; value: string }[] = [];
      params.forEach((value, key) => {
        list.push({ key, value });
      });
      return list;
    } catch {
      return [];
    }
  }

  // --- Text Utilities ---
  static getTextStats(text: string) {
    if (!text) {
      return {
        characters: 0,
        charactersWithoutSpaces: 0,
        words: 0,
        sentences: 0,
        lines: 0,
        readingTimeMinutes: 0,
      };
    }
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim() ? text.split(/[.!?]+/).filter(Boolean).length : 0;
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
    const readingTimeMin = Math.ceil(words / 200);

    return {
      characters: chars,
      charactersWithoutSpaces: charsNoSpaces,
      words,
      sentences,
      lines,
      readingTimeMinutes: readingTimeMin,
    };
  }

  static convertCase(
    text: string,
    type: 'upper' | 'lower' | 'title' | 'camel' | 'kebab' | 'snake' | 'pascal' | 'constant' | 'sentence'
  ): string {
    if (!text) return '';
    switch (type) {
      case 'upper':
        return text.toUpperCase();
      case 'lower':
        return text.toLowerCase();
      case 'title':
        return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
      case 'sentence':
        return text
          .toLowerCase()
          .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
      case 'camel': {
        const words = text
          .replace(/[^a-zA-Z0-9]+/g, ' ')
          .trim()
          .split(/\s+/);
        if (words.length === 0 || (words.length === 1 && words[0] === '')) return '';
        return words[0].toLowerCase() + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      }
      case 'pascal': {
        const camel = this.convertCase(text, 'camel');
        return camel ? camel.charAt(0).toUpperCase() + camel.slice(1) : '';
      }
      case 'kebab':
        return text
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      case 'snake':
        return text
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
      case 'constant':
        return this.convertCase(text, 'snake').toUpperCase();
      default:
        return text;
    }
  }

  static cleanWhitespace(
    text: string,
    options: {
      trimLines?: boolean;
      collapseSpaces?: boolean;
      removeEmptyLines?: boolean;
      normalizeLineEndings?: boolean;
    }
  ): string {
    if (!text) return '';
    let result = text;

    if (options.normalizeLineEndings) {
      result = result.replace(/\r\n|\r/g, '\n');
    }
    if (options.collapseSpaces) {
      result = result.replace(/[ \t]+/g, ' ');
    }
    if (options.trimLines) {
      result = result
        .split('\n')
        .map((l) => l.trim())
        .join('\n');
    }
    if (options.removeEmptyLines) {
      result = result
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .join('\n');
    }
    return result;
  }

  static sortLines(
    text: string,
    orderOrOptions: 'asc' | 'desc' | 'random' | {
      order?: 'asc' | 'desc' | 'natural' | 'lengthAsc' | 'lengthDesc' | 'random';
      caseSensitive?: boolean;
      ignoreEmpty?: boolean;
    } = 'asc',
    caseSensitiveLegacy = false
  ): string {
    if (!text) return '';
    const order = typeof orderOrOptions === 'string' ? orderOrOptions : orderOrOptions.order || 'asc';
    const caseSensitive = typeof orderOrOptions === 'object' ? !!orderOrOptions.caseSensitive : caseSensitiveLegacy;
    const ignoreEmpty = typeof orderOrOptions === 'object' && !!orderOrOptions.ignoreEmpty;

    let lines = text.split(/\r?\n/);
    if (ignoreEmpty) {
      lines = lines.filter((l) => l.trim().length > 0);
    }

    if (order === 'random') {
      return [...lines].sort(() => Math.random() - 0.5).join('\n');
    }

    if (order === 'lengthAsc') {
      return [...lines].sort((a, b) => a.length - b.length).join('\n');
    }

    if (order === 'lengthDesc') {
      return [...lines].sort((a, b) => b.length - a.length).join('\n');
    }

    return [...lines]
      .sort((a, b) => {
        const strA = caseSensitive ? a : a.toLowerCase();
        const strB = caseSensitive ? b : b.toLowerCase();
        if (order === 'natural') {
          return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
        }
        return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      })
      .join('\n');
  }

  static removeDuplicateLines(
    text: string,
    optionsOrCaseSensitive?: boolean | { caseSensitive?: boolean; trimBeforeCompare?: boolean }
  ): string {
    const res = this.removeDuplicateLinesWithStats(text, optionsOrCaseSensitive);
    return res.result;
  }

  static removeDuplicateLinesWithStats(
    text: string,
    optionsOrCaseSensitive?: boolean | { caseSensitive?: boolean; trimBeforeCompare?: boolean }
  ): DuplicateRemovalResult {
    if (!text) {
      return { result: '', originalCount: 0, uniqueCount: 0, duplicatesRemoved: 0 };
    }

    const caseSensitive =
      typeof optionsOrCaseSensitive === 'boolean'
        ? optionsOrCaseSensitive
        : !!optionsOrCaseSensitive?.caseSensitive;
    const trimBeforeCompare =
      typeof optionsOrCaseSensitive === 'object' ? !!optionsOrCaseSensitive.trimBeforeCompare : false;

    const lines = text.split(/\r?\n/);
    const seen = new Set<string>();
    const unique: string[] = [];

    lines.forEach((line) => {
      let key = trimBeforeCompare ? line.trim() : line;
      if (!caseSensitive) key = key.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(line);
      }
    });

    return {
      result: unique.join('\n'),
      originalCount: lines.length,
      uniqueCount: unique.length,
      duplicatesRemoved: lines.length - unique.length,
    };
  }

  static computeDiff(originalText: string, modifiedText: string) {
    return Diff.diffLines(originalText, modifiedText);
  }
}

