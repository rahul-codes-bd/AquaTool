import QRCode from 'qrcode';

export interface QrCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface RegexMatchItem {
  match: string;
  index: number;
  groups: string[];
}

export interface RegexTestResult {
  isValid: boolean;
  error?: string;
  matches: RegexMatchItem[];
  matchCount: number;
}

export interface RandomNumberOptions {
  min: number;
  max: number;
  count: number;
  unique?: boolean;
  allowDuplicates?: boolean;
  sort?: 'none' | 'asc' | 'desc';
  decimals?: number;
}

export type RandomStringType = 'alphanumeric' | 'alpha' | 'numeric' | 'hex' | 'base64' | 'custom';

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  username: string;
  phone: string;
  jobTitle: string;
  department: string;
  company: string;
  city: string;
  country: string;
  avatarInitial: string;
}

export interface SlugOptions {
  lowercase?: boolean;
  separator?: string;
  removeAccents?: boolean;
  removeSpecialChars?: boolean;
  maxLength?: number;
  preserveNumbers?: boolean;
}

export type UsernameStyle = 'developer' | 'aesthetic' | 'gamer' | 'professional' | 'minimal' | 'fun';

export interface UsernameOptions {
  style?: UsernameStyle;
  count?: number;
  includeNumber?: boolean;
  separator?: string;
  prefix?: string;
  suffix?: string;
}

export type PaletteHarmony =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'monochromatic'
  | 'split-complementary'
  | 'random';

export interface PaletteColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  name: string;
  isDark: boolean;
  contrastWhite: number;
  contrastBlack: number;
  wcagWhite: string;
  wcagBlack: string;
}

export interface GradientColorStop {
  color: string;
  position: number; // 0 to 100
}

export interface GradientOptions {
  type: 'linear' | 'radial';
  angle?: number; // 0 to 360
  direction?: string; // 'to right', etc.
  stops: GradientColorStop[];
  shape?: 'circle' | 'ellipse';
}

export interface BoxShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset?: boolean;
}

export interface RobotsTxtOptions {
  allowAll: boolean;
  disallowPaths: string[];
  allowPaths?: string[];
  sitemapUrl?: string;
  crawlDelay?: number;
  blockAiBots?: boolean;
  customUserAgents?: Array<{ agent: string; allow?: string[]; disallow?: string[] }>;
}

export interface SitemapItem {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

export interface OpenGraphOptions {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  siteName?: string;
  twitterHandle?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  locale?: string;
  author?: string;
}

export interface HtmlBoilerplateOptions {
  title: string;
  description: string;
  language?: string;
  author?: string;
  framework?: 'tailwind' | 'bootstrap' | 'pico' | 'water' | 'none';
  font?: 'jakarta' | 'inter' | 'roboto' | 'playfair' | 'fira' | 'system';
  cdnScripts?: 'alpine' | 'htmx' | 'react' | 'lucide' | 'none';
  includeOg?: boolean;
  includeFavicon?: boolean;
  darkModeTemplate?: boolean;
}

// Preset color names lookup helper
const COLOR_NAMES: Array<{ name: string; hex: string }> = [
  { name: 'Aqua Cyan', hex: '#06b6d4' },
  { name: 'Deep Sky', hex: '#0284c7' },
  { name: 'Ocean Blue', hex: '#1d4ed8' },
  { name: 'Teal Lagoon', hex: '#0d9488' },
  { name: 'Emerald Wave', hex: '#10b981' },
  { name: 'Indigo Depth', hex: '#4f46e5' },
  { name: 'Violet Mist', hex: '#7c3aed' },
  { name: 'Fuchsia Glow', hex: '#c026d3' },
  { name: 'Rose Petal', hex: '#f43f5e' },
  { name: 'Amber Sunset', hex: '#f59e0b' },
  { name: 'Coral Reef', hex: '#fb923c' },
  { name: 'Slate Gray', hex: '#64748b' },
  { name: 'Midnight Charcoal', hex: '#0f172a' },
  { name: 'Pure White', hex: '#ffffff' },
];

export class GeneratorTools {
  // --- QR Code Generator ---
  static async generateQrCode(
    text: string,
    options: QrCodeOptions = {}
  ): Promise<{ dataUrl: string; svgString: string }> {
    if (!text || !text.trim()) {
      throw new Error('QR code generation failed: Content cannot be empty.');
    }

    const opts: QRCode.QRCodeToDataURLOptions = {
      width: options.width || 300,
      margin: options.margin !== undefined ? options.margin : 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#ffffff',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    };

    try {
      const dataUrl = await QRCode.toDataURL(text, opts);
      const svgString = await QRCode.toString(text, {
        ...opts,
        type: 'svg',
      });

      return { dataUrl, svgString };
    } catch (err: any) {
      throw new Error(`QR code generation error: ${err.message || 'Data too large for selected error correction level'}`);
    }
  }

  static async generateQrCodeDataUrl(text: string, options: QrCodeOptions = {}): Promise<string> {
    const res = await this.generateQrCode(text, options);
    return res.dataUrl;
  }

  static async generateQrCodeSvg(text: string, options: QrCodeOptions = {}): Promise<string> {
    const res = await this.generateQrCode(text, options);
    return res.svgString;
  }

  // --- Regex Tester ---
  static testRegex(pattern: string, flags = 'g', text: string): RegexTestResult {
    if (!pattern) {
      return { isValid: true, matches: [], matchCount: 0 };
    }

    try {
      const re = new RegExp(pattern, flags);
      const matches: RegexMatchItem[] = [];

      if (flags.includes('g')) {
        let m: RegExpExecArray | null;
        let count = 0;
        while ((m = re.exec(text)) !== null && count < 1000) {
          matches.push({
            match: m[0],
            index: m.index,
            groups: m.slice(1),
          });
          count++;
          if (m[0].length === 0) re.lastIndex++;
        }
      } else {
        const m = re.exec(text);
        if (m) {
          matches.push({
            match: m[0],
            index: m.index,
            groups: m.slice(1),
          });
        }
      }

      return {
        isValid: true,
        matches,
        matchCount: matches.length,
      };
    } catch (err: any) {
      return {
        isValid: false,
        error: err.message || 'Invalid regular expression syntax',
        matches: [],
        matchCount: 0,
      };
    }
  }

  // --- 1. Random Data Generator ---
  static generateRandomNumbers(options: RandomNumberOptions): number[] {
    const { min, max, count, sort = 'none', decimals = 0 } = options;
    const allowDuplicates = options.unique !== undefined ? !options.unique : options.allowDuplicates ?? true;
    
    if (min > max) {
      throw new Error(`Min (${min}) cannot be greater than Max (${max}).`);
    }

    const isFloating = decimals > 0;
    const factor = Math.pow(10, decimals);
    const intMin = Math.round(min * factor);
    const intMax = Math.round(max * factor);
    const range = intMax - intMin + 1;

    if (!allowDuplicates && count > range) {
      throw new Error(`Cannot generate ${count} unique numbers in a range of size ${range}.`);
    }

    const result: number[] = [];
    const used = new Set<number>();

    while (result.length < count) {
      const randomBytes = new Uint32Array(1);
      crypto.getRandomValues(randomBytes);
      const rawVal = intMin + (randomBytes[0] % range);
      const val = isFloating ? parseFloat((rawVal / factor).toFixed(decimals)) : rawVal;

      if (allowDuplicates || !used.has(val)) {
        used.add(val);
        result.push(val);
      }
    }

    if (sort === 'asc') result.sort((a, b) => a - b);
    if (sort === 'desc') result.sort((a, b) => b - a);

    return result;
  }

  static generateRandomString(
    length = 16,
    type: RandomStringType = 'alphanumeric',
    customCharset = ''
  ): string {
    const safeLen = Math.max(1, Math.min(1024, length));
    let charset = '';
    switch (type) {
      case 'alpha':
        charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        break;
      case 'numeric':
        charset = '0123456789';
        break;
      case 'hex':
        charset = '0123456789abcdef';
        break;
      case 'base64':
        charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        break;
      case 'custom':
        charset = customCharset && customCharset.length > 0 ? customCharset : 'abcdefghijklmnopqrstuvwxyz';
        break;
      case 'alphanumeric':
      default:
        charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        break;
    }

    const randomBytes = new Uint32Array(safeLen);
    crypto.getRandomValues(randomBytes);
    let str = '';
    for (let i = 0; i < safeLen; i++) {
      str += charset[randomBytes[i] % charset.length];
    }
    return str;
  }

  static generateMockUsers(count = 5): MockUser[] {
    const firstNames = [
      'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Cameron', 'Avery',
      'Rowan', 'Quinn', 'Skyler', 'Dakota', 'Jesse', 'Kai', 'Reese', 'Finley',
      'Harper', 'Emerson', 'Peyton', 'Logan', 'Charlie', 'Kendall', 'Hayden', 'Sawyer'
    ];
    const lastNames = [
      'Vance', 'Sterling', 'Mercer', 'Chen', 'Sinclair', 'Nakamura', 'Patel', 'Novak',
      'Castillo', 'Lindqvist', 'O\'Connor', 'Dubois', 'Kowalski', 'Santos', 'Rousseau',
      'Holloway', 'Thorne', 'Barton', 'Navarro', 'Kim', 'Winter', 'Summers', 'Frost'
    ];
    const companies = [
      'NexusFlow Technologies', 'Apex Digital Systems', 'Solaria Cybernetics',
      'Vanguard Cloud Labs', 'AeroDynamics Interactive', 'Horizon Dataworks',
      'Beacon Softworks', 'Crestline Analytics', 'Helios Security Systems'
    ];
    const departments = ['Engineering', 'Design', 'Product', 'DevOps', 'Security', 'Marketing', 'Data Science', 'Operations'];
    const jobTitles = [
      'Principal Software Engineer', 'Senior UX Architect', 'Product Operations Manager',
      'Cloud Infrastructure Specialist', 'Security Compliance Analyst', 'Frontend Systems Architect',
      'Fullstack Developer', 'Data Platform Engineer', 'Engineering Manager'
    ];
    const cities = ['San Francisco', 'Seattle', 'New York', 'Austin', 'London', 'Berlin', 'Tokyo', 'Toronto', 'Sydney', 'Stockholm'];
    const countries = ['United States', 'United Kingdom', 'Germany', 'Japan', 'Canada', 'Australia', 'Sweden'];

    const safeCount = Math.max(1, Math.min(100, count));
    const users: MockUser[] = [];

    for (let i = 0; i < safeCount; i++) {
      const rand = new Uint32Array(8);
      crypto.getRandomValues(rand);

      const fName = firstNames[rand[0] % firstNames.length];
      const lName = lastNames[rand[1] % lastNames.length];
      const comp = companies[rand[2] % companies.length];
      const dept = departments[rand[3] % departments.length];
      const title = jobTitles[rand[4] % jobTitles.length];
      const city = cities[rand[5] % cities.length];
      const country = countries[rand[6] % countries.length];
      const domain = comp.toLowerCase().replace(/[^a-z]/g, '') + '.io';
      const userNum = (rand[7] % 900) + 100;
      const username = `${fName.toLowerCase()}_${lName.toLowerCase()}${rand[7] % 2 === 0 ? '' : userNum}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}@${domain}`;
      const phone = `+1 (${(rand[0] % 800) + 200}) ${(rand[1] % 899) + 100}-${(rand[2] % 8999) + 1000}`;
      
      const uuidBytes = new Uint8Array(16);
      crypto.getRandomValues(uuidBytes);
      uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x40;
      uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80;
      const hex = Array.from(uuidBytes, (b) => b.toString(16).padStart(2, '0')).join('');
      const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;

      users.push({
        id,
        firstName: fName,
        lastName: lName,
        fullName: `${fName} ${lName}`,
        email,
        username,
        phone,
        jobTitle: title,
        department: dept,
        company: comp,
        city,
        country,
        avatarInitial: fName.charAt(0) + lName.charAt(0),
      });
    }

    return users;
  }

  static shuffleList<T>(items: T[]): T[] {
    const list = [...items];
    const n = list.length;
    if (n <= 1) return list;

    const randomBytes = new Uint32Array(n);
    crypto.getRandomValues(randomBytes);

    for (let i = n - 1; i > 0; i--) {
      const j = randomBytes[i] % (i + 1);
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  static pickRandomItems<T>(items: T[], count = 1): T[] {
    if (items.length === 0) return [];
    const shuffled = this.shuffleList(items);
    return shuffled.slice(0, Math.min(count, items.length));
  }

  static generateLoremIpsum(type: 'paragraphs' | 'sentences' | 'words' = 'paragraphs', count = 3): string {
    const words = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation',
      'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis',
      'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum',
      'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non',
      'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
    ];

    if (type === 'words') {
      const list: string[] = [];
      for (let i = 0; i < count * 25; i++) {
        list.push(words[Math.floor(Math.random() * words.length)]);
      }
      return list.join(' ');
    }

    const paragraphs: string[] = [];
    const paragraphCount = type === 'sentences' ? 1 : count;
    for (let p = 0; p < paragraphCount; p++) {
      const sentenceCount = type === 'sentences' ? count : (4 + Math.floor(Math.random() * 3));
      const pSentences: string[] = [];
      for (let s = 0; s < sentenceCount; s++) {
        const wordCount = 8 + Math.floor(Math.random() * 10);
        const sWords: string[] = [];
        for (let w = 0; w < wordCount; w++) {
          sWords.push(words[Math.floor(Math.random() * words.length)]);
        }
        const sentence = sWords.join(' ');
        pSentences.push(sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.');
      }
      paragraphs.push(pSentences.join(' '));
    }

    return paragraphs.join('\n\n');
  }

  // --- 2. URL Slug Generator ---
  static generateSlug(text: string, options: SlugOptions = {}): string {
    if (!text || typeof text !== 'string') return '';

    const {
      lowercase = true,
      separator = '-',
      removeAccents = true,
      removeSpecialChars = true,
      maxLength,
      preserveNumbers = true,
    } = options;

    let processed = text.trim();

    // 1. Remove accents/diacritics using Unicode Normalization Form D
    if (removeAccents) {
      processed = processed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // 2. Case folding
    if (lowercase) {
      processed = processed.toLowerCase();
    }

    // 3. Remove non-word/special chars
    if (removeSpecialChars) {
      if (preserveNumbers) {
        // Replace whitespace and symbols with separator
        processed = processed.replace(/[^\w\s-]/g, '');
      } else {
        processed = processed.replace(/[^a-zA-Z\s-]/g, '');
      }
    }

    // 4. Replace whitespace or existing separators with target separator
    const sepEscaped = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    processed = processed
      .replace(/[\s_]+/g, separator)
      .replace(new RegExp(`${sepEscaped}+`, 'g'), separator);

    // 5. Trim leading/trailing separators
    processed = processed
      .replace(new RegExp(`^${sepEscaped}+`), '')
      .replace(new RegExp(`${sepEscaped}+$`), '');

    // 6. Max length trim
    if (maxLength && maxLength > 0 && processed.length > maxLength) {
      processed = processed.slice(0, maxLength);
      // Clean up any trailing separator created by slicing
      processed = processed.replace(new RegExp(`${sepEscaped}+$`), '');
    }

    return processed;
  }

  static slugify(text: string, options?: SlugOptions): string {
    return this.generateSlug(text, options);
  }

  // --- 3. Username Generator ---
  static generateUsernames(options: UsernameOptions = {}): string[] {
    const {
      style = 'developer',
      count = 10,
      includeNumber = true,
      separator = '_',
      prefix = '',
      suffix = '',
    } = options;

    const safeCount = Math.max(1, Math.min(50, count));

    const STYLE_VOCABULARIES: Record<UsernameStyle, { adjectives: string[]; nouns: string[] }> = {
      developer: {
        adjectives: ['cyber', 'binary', 'async', 'quantum', 'null', 'void', 'syntax', 'hex', 'logic', 'stack', 'pixel', 'turbo', 'crypto', 'root', 'byte'],
        nouns: ['coder', 'dev', 'ninja', 'hacker', 'kernel', 'daemon', 'vector', 'compiler', 'matrix', 'router', 'packet', 'terminal', 'socket', 'bot'],
      },
      aesthetic: {
        adjectives: ['velvet', 'lunar', 'ethereal', 'solar', 'mystic', 'cosmic', 'aurora', 'golden', 'crystal', 'serene', 'azure', 'zenith', 'radiant', 'gentle'],
        nouns: ['breeze', 'echo', 'whisper', 'lagoon', 'meadow', 'petal', 'horizon', 'starlight', 'wave', 'cloud', 'bloom', 'harbor', 'frost', 'nebula'],
      },
      gamer: {
        adjectives: ['shadow', 'hyper', 'apex', 'vortex', 'savage', 'omega', 'venom', 'blaze', 'stealth', 'phantom', 'rogue', 'thunder', 'fatal', 'lethal'],
        nouns: ['strike', 'blade', 'sniper', 'hunter', 'slayer', 'warrior', 'titan', 'reaper', 'knight', 'assassin', 'legend', 'glitch', 'boss', 'pulse'],
      },
      professional: {
        adjectives: ['strategic', 'premier', 'global', 'summit', 'clarity', 'beacon', 'core', 'direct', 'prime', 'elevate', 'focus', 'vanguard', 'optima'],
        nouns: ['advisor', 'analyst', 'partner', 'leader', 'innovator', 'strategist', 'founder', 'consultant', 'expert', 'director', 'specialist'],
      },
      minimal: {
        adjectives: ['zen', 'pure', 'calm', 'soft', 'neo', 'raw', 'air', 'mono', 'clean', 'arc', 'dot', 'sky'],
        nouns: ['form', 'space', 'line', 'point', 'mark', 'tone', 'grid', 'flow', 'wave', 'mesh', 'sync'],
      },
      fun: {
        adjectives: ['funky', 'bouncy', 'cosmic', 'snappy', 'wobbly', 'cheeky', 'zesty', 'peppy', 'quirky', 'dizzy', 'sparky', 'bubbly'],
        nouns: ['waffle', 'badger', 'penguin', 'otter', 'muffin', 'noodle', 'pickle', 'panda', 'toad', 'banana', 'koala', 'gecko'],
      },
    };

    const vocab = STYLE_VOCABULARIES[style] || STYLE_VOCABULARIES.developer;
    const usernames: string[] = [];

    for (let i = 0; i < safeCount; i++) {
      const randBytes = new Uint32Array(4);
      crypto.getRandomValues(randBytes);

      const adj = vocab.adjectives[randBytes[0] % vocab.adjectives.length];
      const noun = vocab.nouns[randBytes[1] % vocab.nouns.length];
      const num = (randBytes[2] % 900) + 100;

      let name = `${adj}${separator}${noun}`;

      if (includeNumber) {
        name = `${name}${separator ? separator : ''}${num}`;
      }

      if (prefix) {
        name = `${prefix}${separator ? separator : ''}${name}`;
      }

      if (suffix) {
        name = `${name}${separator ? separator : ''}${suffix}`;
      }

      usernames.push(name.toLowerCase());
    }

    return usernames;
  }

  // --- 4. Color Palette Generator ---
  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace(/^#/, '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  static rgbToHex(r: number, g: number, b: number): string {
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    if (s === 0) {
      const v = Math.round(l * 255);
      return { r: v, g: v, b: v };
    }

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h / 360 + 1 / 3);
    const g = hue2rgb(p, q, h / 360);
    const b = hue2rgb(p, q, h / 360 - 1 / 3);

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  static calculateLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  static calculateContrastRatio(hex1: string, hex2: string): number {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);
    const lum1 = this.calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);
    return Math.round(ratio * 100) / 100;
  }

  static createPaletteColor(hex: string): PaletteColor {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const contrastWhite = this.calculateContrastRatio(hex, '#ffffff');
    const contrastBlack = this.calculateContrastRatio(hex, '#000000');
    const isDark = hsl.l < 55;

    // Find nearest named color
    let nearestName = 'Color';
    let minDistance = Infinity;
    for (const item of COLOR_NAMES) {
      const itemRgb = this.hexToRgb(item.hex);
      const dist = Math.pow(rgb.r - itemRgb.r, 2) + Math.pow(rgb.g - itemRgb.g, 2) + Math.pow(rgb.b - itemRgb.b, 2);
      if (dist < minDistance) {
        minDistance = dist;
        nearestName = item.name;
      }
    }

    return {
      hex: hex.toLowerCase(),
      rgb,
      hsl,
      name: nearestName,
      isDark,
      contrastWhite,
      contrastBlack,
      wcagWhite: contrastWhite >= 4.5 ? 'AA Pass' : contrastWhite >= 3.0 ? 'AA Large' : 'Fail',
      wcagBlack: contrastBlack >= 4.5 ? 'AA Pass' : contrastBlack >= 3.0 ? 'AA Large' : 'Fail',
    };
  }

  static generatePalette(options: {
    harmony?: PaletteHarmony;
    baseColor?: string;
    lockedColors?: Array<string | null>;
  } = {}): PaletteColor[] {
    const { harmony = 'complementary', lockedColors = [] } = options;

    let baseHsl = { h: 195, s: 85, l: 45 };
    if (options.baseColor) {
      const rgb = this.hexToRgb(options.baseColor);
      baseHsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    } else {
      const rand = new Uint32Array(3);
      crypto.getRandomValues(rand);
      baseHsl = {
        h: rand[0] % 360,
        s: 60 + (rand[1] % 35),
        l: 35 + (rand[2] % 30),
      };
    }

    const hues: number[] = [];
    const h = baseHsl.h;

    switch (harmony) {
      case 'complementary':
        hues.push(h, (h + 30) % 360, (h + 180) % 360, (h + 210) % 360, (h + 150) % 360);
        break;
      case 'analogous':
        hues.push((h - 40 + 360) % 360, (h - 20 + 360) % 360, h, (h + 20) % 360, (h + 40) % 360);
        break;
      case 'triadic':
        hues.push(h, (h + 120) % 360, (h + 240) % 360, (h + 60) % 360, (h + 180) % 360);
        break;
      case 'tetradic':
        hues.push(h, (h + 90) % 360, (h + 180) % 360, (h + 270) % 360, (h + 45) % 360);
        break;
      case 'monochromatic':
        hues.push(h, h, h, h, h);
        break;
      case 'split-complementary':
        hues.push(h, (h + 150) % 360, (h + 210) % 360, (h + 30) % 360, (h - 30 + 360) % 360);
        break;
      case 'random':
      default: {
        const randH = new Uint32Array(5);
        crypto.getRandomValues(randH);
        hues.push(h, randH[0] % 360, randH[1] % 360, randH[2] % 360, randH[3] % 360);
        break;
      }
    }

    const lightnessSteps = [
      Math.min(85, baseHsl.l + 30),
      Math.min(75, baseHsl.l + 15),
      baseHsl.l,
      Math.max(25, baseHsl.l - 15),
      Math.max(12, baseHsl.l - 30),
    ];

    const result: PaletteColor[] = [];
    for (let i = 0; i < 5; i++) {
      if (lockedColors[i]) {
        result.push(this.createPaletteColor(lockedColors[i]!));
      } else {
        const sat = harmony === 'monochromatic' ? Math.max(20, baseHsl.s - i * 12) : baseHsl.s;
        const lig = harmony === 'monochromatic' ? lightnessSteps[i] : (baseHsl.l + (i % 2 === 0 ? 10 : -10));
        const rgb = this.hslToRgb(hues[i], sat, Math.max(15, Math.min(85, lig)));
        const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
        result.push(this.createPaletteColor(hex));
      }
    }

    return result;
  }

  static exportPaletteAsCss(palette: PaletteColor[]): string {
    const lines = [':root {'];
    palette.forEach((c, idx) => {
      lines.push(`  --color-${idx + 1}: ${c.hex}; /* ${c.name} */`);
      lines.push(`  --color-${idx + 1}-rgb: ${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b};`);
    });
    lines.push('}');
    return lines.join('\n');
  }

  static exportPaletteAsJson(palette: PaletteColor[]): string {
    return JSON.stringify(
      palette.map((c, i) => ({
        index: i + 1,
        name: c.name,
        hex: c.hex,
        rgb: c.rgb,
        hsl: c.hsl,
        contrastWithWhite: c.contrastWhite,
        contrastWithBlack: c.contrastBlack,
      })),
      null,
      2
    );
  }

  static exportPaletteAsTailwind(palette: PaletteColor[]): string {
    return `// tailwind.config.js theme extension
module.exports = {
  theme: {
    extend: {
      colors: {
        palette: {
${palette.map((c, i) => `          '${(i + 1) * 100}': '${c.hex}', // ${c.name}`).join('\n')}
        }
      }
    }
  }
};`;
  }

  // --- 5. Gradient Generator ---
  static generateGradientCss(options: GradientOptions): string {
    const { type, angle = 90, stops, shape = 'circle' } = options;
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopString = sortedStops.map((s) => `${s.color} ${s.position}%`).join(', ');

    if (type === 'radial') {
      return `radial-gradient(${shape} at center, ${stopString})`;
    }
    return `linear-gradient(${angle}deg, ${stopString})`;
  }

  // --- 6. CSS Shadow Generator ---
  static generateBoxShadowCss(layers: BoxShadowLayer[]): string {
    if (layers.length === 0) return 'box-shadow: none;';
    const layerStrings = layers.map((l) => {
      const insetStr = l.inset ? 'inset ' : '';
      return `${insetStr}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`;
    });
    return `box-shadow: ${layerStrings.join(', ')};`;
  }

  static generateTextShadowCss(options: { x: number; y: number; blur: number; color: string }): string {
    return `text-shadow: ${options.x}px ${options.y}px ${options.blur}px ${options.color};`;
  }

  // --- 7. Robots.txt Generator ---
  static generateRobotsTxt(options: RobotsTxtOptions): string {
    const lines: string[] = [
      '# robots.txt generated by AquaTools',
      '# Verification Disclaimer: Verify crawler rules before deployment.',
    ];

    if (options.blockAiBots) {
      lines.push('');
      lines.push('# Block common AI scraping bots and LLM training spiders');
      const aiBots = ['GPTBot', 'ChatGPT-User', 'CCBot', 'Google-Extended', 'anthropic-ai', 'ClaudeBot', 'Bytespider'];
      aiBots.forEach((bot) => {
        lines.push(`User-agent: ${bot}`);
        lines.push('Disallow: /');
      });
      lines.push('');
    }

    lines.push('User-agent: *');
    if (options.allowAll) {
      lines.push('Allow: /');
    }

    if (options.allowPaths && options.allowPaths.length > 0) {
      options.allowPaths.forEach((p) => {
        if (p.trim()) lines.push(`Allow: ${p.trim()}`);
      });
    }

    if (options.disallowPaths && options.disallowPaths.length > 0) {
      options.disallowPaths.forEach((p) => {
        if (p.trim()) lines.push(`Disallow: ${p.trim()}`);
      });
    }

    if (options.crawlDelay && options.crawlDelay > 0) {
      lines.push(`Crawl-delay: ${options.crawlDelay}`);
    }

    if (options.sitemapUrl && options.sitemapUrl.trim()) {
      lines.push(`Sitemap: ${options.sitemapUrl.trim()}`);
    }

    return lines.join('\n');
  }

  // --- 8. Sitemap.xml Generator ---
  static generateSitemapXml(
    options: { domain: string; paths: string[] } | SitemapItem[]
  ): string {
    const escapeXml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    let items: string[] = [];
    if (Array.isArray(options)) {
      items = options
        .filter((u) => u.loc.trim().length > 0)
        .map((u) => {
          return `  <url>
    <loc>${escapeXml(u.loc.trim())}</loc>${u.lastmod ? `\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : ''}${
            u.changefreq ? `\n    <changefreq>${escapeXml(u.changefreq)}</changefreq>` : ''
          }${u.priority ? `\n    <priority>${escapeXml(u.priority)}</priority>` : ''}
  </url>`;
        });
    } else {
      const base = options.domain.replace(/\/+$/, '');
      items = options.paths
        .filter((p) => p.trim().length > 0)
        .map((p) => {
          const path = p.startsWith('/') ? p : `/${p}`;
          return `  <url>\n    <loc>${escapeXml(`${base}${path}`)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
        });
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.join('\n')}
</urlset>`;
  }

  // --- 9. Open Graph Generator ---
  static generateOpenGraphTags(meta: OpenGraphOptions): string {
    const siteName = meta.siteName || 'AquaTools';
    const type = meta.type || 'website';
    const locale = meta.locale || 'en_US';

    return `<!-- Primary HTML Meta Tags -->
<title>${meta.title}</title>
<meta name="title" content="${meta.title}">
<meta name="description" content="${meta.description}">
${meta.author ? `<meta name="author" content="${meta.author}">` : ''}

<!-- Open Graph / Facebook / LinkedIn -->
<meta property="og:type" content="${type}">
<meta property="og:url" content="${meta.url}">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:image" content="${meta.imageUrl}">
<meta property="og:site_name" content="${siteName}">
<meta property="og:locale" content="${locale}">

<!-- Twitter / X Card -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${meta.url}">
<meta property="twitter:title" content="${meta.title}">
<meta property="twitter:description" content="${meta.description}">
<meta property="twitter:image" content="${meta.imageUrl}">
${meta.twitterHandle ? `<meta property="twitter:site" content="${meta.twitterHandle}">\n<meta property="twitter:creator" content="${meta.twitterHandle}">` : ''}`;
  }

  // --- 10. HTML Boilerplate Generator ---
  static generateHtmlBoilerplate(options: HtmlBoilerplateOptions): string {
    const {
      title,
      description,
      language = 'en',
      author,
      framework = 'tailwind',
      font = 'jakarta',
      cdnScripts = 'none',
      includeOg = true,
      includeFavicon = true,
      darkModeTemplate = true,
    } = options;

    let fontLink = '';
    let fontFamilyCss = '';
    switch (font) {
      case 'jakarta':
        fontLink = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">`;
        fontFamilyCss = 'font-family: \'Plus Jakarta Sans\', sans-serif;';
        break;
      case 'inter':
        fontLink = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`;
        fontFamilyCss = 'font-family: \'Inter\', sans-serif;';
        break;
      case 'roboto':
        fontLink = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">`;
        fontFamilyCss = 'font-family: \'Roboto\', sans-serif;';
        break;
      case 'playfair':
        fontLink = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500&display=swap" rel="stylesheet">`;
        fontFamilyCss = 'font-family: \'Playfair Display\', serif;';
        break;
      case 'fira':
        fontLink = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&display=swap" rel="stylesheet">`;
        fontFamilyCss = 'font-family: \'Fira Code\', monospace;';
        break;
      case 'system':
      default:
        fontFamilyCss = 'font-family: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;';
        break;
    }

    let frameworkLink = '';
    if (framework === 'tailwind') {
      frameworkLink = '  <!-- Tailwind CSS CDN -->\n  <script src="https://cdn.tailwindcss.com"></script>';
    } else if (framework === 'bootstrap') {
      frameworkLink = '  <!-- Bootstrap 5 CDN -->\n  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">';
    } else if (framework === 'pico') {
      frameworkLink = '  <!-- Pico.css CDN -->\n  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">';
    } else if (framework === 'water') {
      frameworkLink = '  <!-- Water.css CDN -->\n  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">';
    }

    let scriptTag = '';
    if (cdnScripts === 'alpine') {
      scriptTag = '  <!-- Alpine.js CDN -->\n  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>';
    } else if (cdnScripts === 'htmx') {
      scriptTag = '  <!-- HTMX CDN -->\n  <script src="https://unpkg.com/htmx.org@1.9.12"></script>';
    } else if (cdnScripts === 'lucide') {
      scriptTag = '  <!-- Lucide Icons -->\n  <script src="https://unpkg.com/lucide@latest"></script>\n  <script>document.addEventListener("DOMContentLoaded", () => lucide.createIcons());</script>';
    } else if (cdnScripts === 'react') {
      scriptTag = `  <!-- React & Babel CDNs (Prototyping) -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`;
    }

    const faviconSnippet = includeFavicon
      ? `  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`
      : '';

    const ogSnippet = includeOg
      ? `  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title || 'New Web Project'}">
  <meta property="og:description" content="${description || 'Scaffolded with AquaTools boilerplate generator.'}">`
      : '';

    const bgClass = darkModeTemplate ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900';
    const btnClass = framework === 'tailwind'
      ? 'px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg transition'
      : '';

    return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'New Web Project'}</title>
  <meta name="description" content="${description || 'Scaffolded with AquaTools boilerplate generator.'}">
  ${author ? `<meta name="author" content="${author}">` : ''}
${ogSnippet ? `${ogSnippet}\n` : ''}${faviconSnippet ? `${faviconSnippet}\n` : ''}${frameworkLink ? `${frameworkLink}\n` : ''}${fontLink ? `${fontLink}\n` : ''}${scriptTag ? `${scriptTag}\n` : ''}
  <style>
    body {
      ${fontFamilyCss}
      margin: 0;
      min-height: 100vh;
    }
  </style>
</head>
<body class="${bgClass} flex flex-col items-center justify-center p-6">
  <main style="max-width: 640px; text-align: center; padding: 2rem;">
    <h1 style="font-size: 2.5rem; margin-bottom: 0.75rem; font-weight: 700;">${title || 'Hello, World!'}</h1>
    <p style="font-size: 1.125rem; opacity: 0.85; margin-bottom: 1.5rem; line-height: 1.6;">
      ${description || 'Welcome to your newly scaffolded application.'}
    </p>
    <button class="${btnClass}">
      Get Started
    </button>
  </main>
</body>
</html>`;
  }
}
