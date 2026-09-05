export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';

export interface PasswordOptions {
  length: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  excludeSimilar?: boolean;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeAmbiguous?: boolean;
}

export interface EntropyResult {
  bits: number;
  entropyBits: number;
  score: number; // 0 - 4
  level: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  strength: string;
  color: string;
  crackTimeEstimate: string;
}

export interface DecodedJwt {
  header: any;
  payload: any;
  signature: string;
  isExpired?: boolean;
  issuedAt?: string;
  expiresAt?: string;
  notBefore?: string;
  algorithm?: string;
  keyId?: string;
  subject?: string;
  issuer?: string;
  audience?: string;
}

export interface ColorModel {
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
  rgbString: string;
  rgbaString: string;
  hslString: string;
  hslaString: string;
  h: number;
  s: number;
  l: number;
}

export interface UuidValidationResult {
  isValid: boolean;
  version?: number;
  variant?: string;
  error?: string;
}

export class CryptoTools {
  // --- Web Crypto UUID v4 ---
  static generateUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  static generateUuids(count = 10, uppercase = false, noHyphens = false): string[] {
    const list: string[] = [];
    const safeCount = Math.max(1, Math.min(1000, count));
    for (let i = 0; i < safeCount; i++) {
      let u = this.generateUuid();
      if (noHyphens) u = u.replace(/-/g, '');
      if (uppercase) u = u.toUpperCase();
      list.push(u);
    }
    return list;
  }

  static generateBulkUuids(count = 10, uppercase = false, noHyphens = false): string[] {
    return this.generateUuids(count, uppercase, noHyphens);
  }

  static validateUuid(uuid: string): UuidValidationResult {
    if (!uuid || typeof uuid !== 'string') {
      return { isValid: false, error: 'UUID input is empty.' };
    }

    const trimmed = uuid.trim();
    // Standard RFC 4122 format: 8-4-4-4-12
    const uuidRegex = /^([0-9a-fA-F]{8})-?([0-9a-fA-F]{4})-?([1-5][0-9a-fA-F]{3})-?([89abAB][0-9a-fA-F]{3})-?([0-9a-fA-F]{12})$/;
    const match = trimmed.match(uuidRegex);

    if (!match) {
      if (trimmed.replace(/-/g, '').length !== 32) {
        return { isValid: false, error: 'Malformed UUID: Must contain exactly 32 hexadecimal digits.' };
      }
      return { isValid: false, error: 'Malformed UUID: Does not conform to RFC 4122 format or variant bits.' };
    }

    const version = parseInt(match[3].charAt(0), 16);
    return {
      isValid: true,
      version,
      variant: 'RFC 4122 / DCE 1.1',
    };
  }

  // --- Entropy Calculator ---

  static calculateEntropy(password: string): EntropyResult {
    if (!password) {
      return {
        bits: 0,
        entropyBits: 0,
        score: 0,
        level: 'Weak',
        strength: 'Weak',
        color: '#ef4444',
        crackTimeEstimate: 'Instant',
      };
    }

    let pool = 0;
    if (/[a-z]/.test(password)) pool += 26;
    if (/[A-Z]/.test(password)) pool += 26;
    if (/[0-9]/.test(password)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(password)) pool += 33;
    if (pool === 0) pool = 10;

    const bits = Math.round(password.length * Math.log2(pool));

    let score = 0;
    let level: EntropyResult['level'] = 'Weak';
    let crackTimeEstimate = 'Instant';
    let color = '#ef4444';

    if (bits > 120) {
      score = 4;
      level = 'Very Strong';
      color = '#10b981';
      crackTimeEstimate = 'Centuries (Mathematically unfeasible)';
    } else if (bits > 80) {
      score = 3;
      level = 'Strong';
      color = '#06b6d4';
      crackTimeEstimate = 'Decades';
    } else if (bits > 55) {
      score = 2;
      level = 'Good';
      color = '#eab308';
      crackTimeEstimate = 'Months';
    } else if (bits > 35) {
      score = 1;
      level = 'Fair';
      color = '#f97316';
      crackTimeEstimate = 'Hours to Days';
    } else {
      score = 0;
      level = 'Weak';
      color = '#ef4444';
      crackTimeEstimate = 'Seconds / Instant';
    }

    return { bits, entropyBits: bits, score, level, strength: level, color, crackTimeEstimate };
  }

  // --- Web Crypto Password & Passphrase ---
  static generatePassword(options: PasswordOptions): {
    password: string;
    entropyBits: number;
    strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  } {
    let charset = '';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const useUpper = options.uppercase ?? options.includeUppercase ?? true;
    const useLower = options.lowercase ?? options.includeLowercase ?? true;
    const useNumbers = options.numbers ?? options.includeNumbers ?? true;
    const useSymbols = options.symbols ?? options.includeSymbols ?? true;
    const excludeSimilar = options.excludeSimilar ?? options.excludeAmbiguous ?? false;

    if (useUpper) charset += upper;
    if (useLower) charset += lower;
    if (useNumbers) charset += nums;
    if (useSymbols) charset += syms;

    if (excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }

    if (!charset) charset = lower + nums;

    const length = Math.max(4, Math.min(128, options.length));
    const randomBytes = new Uint32Array(length);
    crypto.getRandomValues(randomBytes);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }

    const entropy = this.calculateEntropy(password);
    let strength: 'weak' | 'moderate' | 'strong' | 'very_strong' = 'weak';
    if (entropy.bits >= 128) strength = 'very_strong';
    else if (entropy.bits >= 80) strength = 'strong';
    else if (entropy.bits >= 50) strength = 'moderate';

    return { password, entropyBits: entropy.bits, strength };
  }

  static generatePassphrase(
    options: number | { wordCount?: number; separator?: string; includeNumber?: boolean; capitalize?: boolean } = 4
  ): string {
    const wordCount = typeof options === 'number' ? options : options.wordCount || 4;
    const separator = typeof options === 'number' ? '-' : options.separator || '-';
    const includeNumber = typeof options === 'object' && !!options.includeNumber;
    const capitalize = typeof options === 'object' && !!options.capitalize;

    const wordList = [
      'ocean', 'crystal', 'breeze', 'harbor', 'island', 'azure', 'coral', 'current',
      'dolphin', 'lagoon', 'marina', 'pebble', 'ripple', 'stream', 'tide', 'wave',
      'anchor', 'beacon', 'cascade', 'delta', 'flow', 'glacier', 'haven', 'jetty',
      'kelp', 'lighthouse', 'mist', 'nautical', 'oasis', 'pacific', 'quartz', 'reef',
      'sail', 'torrent', 'undertow', 'vapor', 'waterfall', 'zenith', 'aurora', 'cliff',
      'canyon', 'forest', 'meadow', 'mountain', 'summit', 'valley', 'timber', 'badger',
      'falcon', 'hummingbird', 'leopard', 'panther', 'sparrow', 'swallow', 'lynx', 'otter',
      'amber', 'citrine', 'diamond', 'emerald', 'garnet', 'jasper', 'malachite', 'onyx',
      'opal', 'ruby', 'sapphire', 'topaz', 'turquoise', 'prism', 'nebula', 'starlight',
      'comet', 'meteor', 'galaxy', 'pulsar', 'cosmos', 'horizon', 'solstice', 'equinox',
      'orbit', 'eclipse', 'matrix', 'circuit', 'quantum', 'cipher', 'vector', 'vertex'
    ];

    const randomBytes = new Uint32Array(wordCount);
    crypto.getRandomValues(randomBytes);

    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      let w = wordList[randomBytes[i] % wordList.length];
      if (capitalize) {
        w = w.charAt(0).toUpperCase() + w.slice(1);
      }
      words.push(w);
    }

    if (includeNumber) {
      const numByte = new Uint8Array(1);
      crypto.getRandomValues(numByte);
      words.push(String(numByte[0] % 100));
    }

    return words.join(separator);
  }

  static generatePin(length = 6): string {
    const safeLen = Math.max(4, Math.min(16, length));
    const bytes = new Uint8Array(safeLen);
    crypto.getRandomValues(bytes);
    let pin = '';
    for (let i = 0; i < safeLen; i++) {
      pin += String(bytes[i] % 10);
    }
    return pin;
  }

  // --- Web Crypto Hashes ---
  static async computeHash(
    input: string | ArrayBuffer,
    algorithm: HashAlgorithm = 'SHA-256'
  ): Promise<string> {
    const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  static async hashText(text: string, algorithm: HashAlgorithm = 'SHA-256'): Promise<string> {
    return this.computeHash(text, algorithm);
  }

  static async hashFile(file: File, algorithm: HashAlgorithm = 'SHA-256'): Promise<string> {
    const buffer = await file.arrayBuffer();
    return this.computeHash(buffer, algorithm);
  }

  // --- Local JWT Decoder ---
  static decodeJwt(token: string): DecodedJwt {
    if (!token || !token.trim()) {
      throw new Error('JWT token is empty. Please provide a valid token.');
    }

    const trimmed = token.trim();
    const parts = trimmed.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT structure: A valid JWT consists of exactly three parts (header, payload, signature) separated by dots.');
    }

    const decodePart = (str: string, partName: string) => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }

      let binary: string;
      try {
        binary = atob(base64);
      } catch (err: any) {
        throw new Error(`Malformed JWT ${partName}: Invalid base64url characters (${err.message || 'decoding failed'}).`);
      }

      let jsonStr: string;
      try {
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        jsonStr = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } catch {
        jsonStr = binary;
      }

      try {
        return JSON.parse(jsonStr);
      } catch (err: any) {
        throw new Error(`Malformed JWT ${partName}: Segment decoded successfully but contains invalid JSON syntax.`);
      }
    };

    const header = decodePart(parts[0], 'header');
    const payload = decodePart(parts[1], 'payload');
    const signature = parts[2];

    let isExpired: boolean | undefined;
    let expiresAt: string | undefined;
    let issuedAt: string | undefined;
    let notBefore: string | undefined;

    if (payload && typeof payload === 'object') {
      if (typeof payload.exp === 'number') {
        const expDate = new Date(payload.exp * 1000);
        expiresAt = expDate.toISOString();
        isExpired = expDate.getTime() < Date.now();
      }

      if (typeof payload.iat === 'number') {
        issuedAt = new Date(payload.iat * 1000).toISOString();
      }

      if (typeof payload.nbf === 'number') {
        notBefore = new Date(payload.nbf * 1000).toISOString();
      }
    }

    return {
      header,
      payload,
      signature,
      isExpired,
      issuedAt,
      expiresAt,
      notBefore,
      algorithm: header?.alg,
      keyId: header?.kid,
      subject: payload?.sub,
      issuer: payload?.iss,
      audience: payload?.aud,
    };
  }

  // --- Timestamp Converter ---
  static parseTimestamp(input: string | number): {
    unixSeconds: number;
    unixMilliseconds: number;
    isoUtc: string;
    localFormatted: string;
    relativeTime: string;
    dayOfWeek: string;
    timezoneOffset: string;
  } {
    if (input === '' || input === null || input === undefined) {
      throw new Error('Invalid timestamp: Input is empty.');
    }

    let date: Date;
    const strInput = String(input).trim();
    const num = Number(strInput);

    if (!isNaN(num) && strInput.length > 0 && !/^\s*$/.test(strInput)) {
      // Unix timestamp in seconds vs milliseconds
      // 10 digits or less -> seconds, 11+ digits -> milliseconds
      date = num < 10000000000 ? new Date(num * 1000) : new Date(num);
    } else {
      date = new Date(strInput);
    }

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date or timestamp: "${input}". Provide a numeric Unix epoch (e.g. 1714567890) or a valid ISO/date string.`);
    }

    const unixMs = date.getTime();
    const unixSec = Math.floor(unixMs / 1000);
    const diffSec = Math.round((Date.now() - unixMs) / 1000);

    let relative = '';
    if (Math.abs(diffSec) < 60) relative = 'Just now';
    else if (diffSec > 0) relative = `${Math.floor(diffSec / 60)} minutes ago`;
    else relative = `in ${Math.floor(-diffSec / 60)} minutes`;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[date.getUTCDay()];

    const offsetMinutes = -date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const timezoneOffset = `UTC${offsetMinutes >= 0 ? '+' : '-'}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

    return {
      unixSeconds: unixSec,
      unixMilliseconds: unixMs,
      isoUtc: date.toISOString(),
      localFormatted: date.toLocaleString(),
      relativeTime: relative,
      dayOfWeek,
      timezoneOffset,
    };
  }

  // --- Color Converter ---
  static hexToRgb(hex: string): { r: number; g: number; b: number; a?: number } | null {
    if (!hex || typeof hex !== 'string') return null;
    const cleaned = hex.trim().replace(/^#/, '');

    if (!/^[0-9a-fA-F]+$/.test(cleaned)) return null;

    if (cleaned.length === 3) {
      return {
        r: parseInt(cleaned[0] + cleaned[0], 16),
        g: parseInt(cleaned[1] + cleaned[1], 16),
        b: parseInt(cleaned[2] + cleaned[2], 16),
        a: 1,
      };
    }
    if (cleaned.length === 4) {
      return {
        r: parseInt(cleaned[0] + cleaned[0], 16),
        g: parseInt(cleaned[1] + cleaned[1], 16),
        b: parseInt(cleaned[2] + cleaned[2], 16),
        a: Math.round((parseInt(cleaned[3] + cleaned[3], 16) / 255) * 100) / 100,
      };
    }
    if (cleaned.length === 6) {
      return {
        r: parseInt(cleaned.substring(0, 2), 16),
        g: parseInt(cleaned.substring(2, 4), 16),
        b: parseInt(cleaned.substring(4, 6), 16),
        a: 1,
      };
    }
    if (cleaned.length === 8) {
      return {
        r: parseInt(cleaned.substring(0, 2), 16),
        g: parseInt(cleaned.substring(2, 4), 16),
        b: parseInt(cleaned.substring(4, 6), 16),
        a: Math.round((parseInt(cleaned.substring(6, 8), 16) / 255) * 100) / 100,
      };
    }
    return null;
  }

  static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r = Math.max(0, Math.min(255, r)) / 255;
    g = Math.max(0, Math.min(255, g)) / 255;
    b = Math.max(0, Math.min(255, b)) / 255;
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

  static parseColor(input: string): ColorModel | null {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();

    // Try HEX
    if (trimmed.startsWith('#') || /^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
      const hexRgb = this.hexToRgb(trimmed);
      if (hexRgb) {
        const hsl = this.rgbToHsl(hexRgb.r, hexRgb.g, hexRgb.b);
        const alpha = hexRgb.a ?? 1;
        const normHex = `#${hexRgb.r.toString(16).padStart(2, '0')}${hexRgb.g.toString(16).padStart(2, '0')}${hexRgb.b.toString(16).padStart(2, '0')}`.toUpperCase();
        return {
          r: hexRgb.r,
          g: hexRgb.g,
          b: hexRgb.b,
          a: alpha,
          hex: normHex,
          rgbString: `rgb(${hexRgb.r}, ${hexRgb.g}, ${hexRgb.b})`,
          rgbaString: `rgba(${hexRgb.r}, ${hexRgb.g}, ${hexRgb.b}, ${alpha})`,
          hslString: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
          hslaString: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`,
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
        };
      }
    }

    // Try rgb(...) or rgba(...)
    const rgbMatch = trimmed.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/i);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      const a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;

      if (r <= 255 && g <= 255 && b <= 255 && a >= 0 && a <= 1) {
        const hsl = this.rgbToHsl(r, g, b);
        const normHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
        return {
          r,
          g,
          b,
          a,
          hex: normHex,
          rgbString: `rgb(${r}, ${g}, ${b})`,
          rgbaString: `rgba(${r}, ${g}, ${b}, ${a})`,
          hslString: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
          hslaString: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`,
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
        };
      }
    }

    // Try hsl(...) or hsla(...)
    const hslMatch = trimmed.match(/^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*([\d.]+))?\s*\)$/i);
    if (hslMatch) {
      const h = parseInt(hslMatch[1], 10);
      const s = parseInt(hslMatch[2], 10);
      const l = parseInt(hslMatch[3], 10);
      const a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1;

      if (h <= 360 && s <= 100 && l <= 100 && a >= 0 && a <= 1) {
        // HSL to RGB
        const hNorm = h / 360;
        const sNorm = s / 100;
        const lNorm = l / 100;
        let rNorm = lNorm;
        let gNorm = lNorm;
        let bNorm = lNorm;

        if (sNorm !== 0) {
          const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
          };
          const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
          const p = 2 * lNorm - q;
          rNorm = hue2rgb(p, q, hNorm + 1 / 3);
          gNorm = hue2rgb(p, q, hNorm);
          bNorm = hue2rgb(p, q, hNorm - 1 / 3);
        }

        const r = Math.round(rNorm * 255);
        const g = Math.round(gNorm * 255);
        const b = Math.round(bNorm * 255);
        const normHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();

        return {
          r,
          g,
          b,
          a,
          hex: normHex,
          rgbString: `rgb(${r}, ${g}, ${b})`,
          rgbaString: `rgba(${r}, ${g}, ${b}, ${a})`,
          hslString: `hsl(${h}, ${s}%, ${l}%)`,
          hslaString: `hsla(${h}, ${s}%, ${l}%, ${a})`,
          h,
          s,
          l,
        };
      }
    }

    return null;
  }
}
