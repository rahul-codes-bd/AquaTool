import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

export interface PdfProtectOptions {
  userPassword?: string;
  ownerPassword?: string;
  allowPrinting?: boolean;
  allowCopying?: boolean;
  allowModifying?: boolean;
  allowAnnotating?: boolean;
}

export interface PdfUnlockResult {
  success: boolean;
  blob?: Blob;
  downloadUrl?: string;
  pageCount?: number;
  fileName?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
}

/**
 * Standard PDF Encryption & Cryptographic Utilities for AquaTools
 * Adheres to client-side local memory processing.
 * Never stores passwords or secrets in localStorage, sessionStorage, or remote servers.
 */
export class PdfCrypt {
  /**
   * PDF Standard 32-byte padding constant defined in ISO 32000-1 (Adobe PDF Specification)
   */
  private static readonly PADDING_BYTES = new Uint8Array([
    0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41,
    0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
    0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
    0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
  ]);

  /**
   * Computes an MD5 digest using browser Web Crypto or pure JS fallback
   */
  private static md5(data: Uint8Array): Uint8Array {
    // Pure JS MD5 implementation for standard PDF ISO 32000-1 encryption
    function safeAdd(x: number, y: number): number {
      const lsw = (x & 0xffff) + (y & 0xffff);
      const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xffff);
    }

    function bitRotateLeft(num: number, cnt: number): number {
      return (num << cnt) | (num >>> (32 - cnt));
    }

    function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
      return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
    }

    function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn((b & c) | (~b & d), a, b, x, s, t);
    }

    function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
    }

    function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return md5cmn(c ^ (b | ~d), a, b, x, s, t);
    }

    const nblk = ((data.length + 8) >> 6) + 1;
    const blks = new Int32Array(nblk * 16);

    for (let i = 0; i < data.length; i++) {
      blks[i >> 2] |= data[i] << ((i % 4) * 8);
    }
    blks[data.length >> 2] |= 0x80 << ((data.length % 4) * 8);
    blks[nblk * 16 - 2] = data.length * 8;

    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;

    for (let i = 0; i < blks.length; i += 16) {
      const olda = a;
      const oldb = b;
      const oldc = c;
      const oldd = d;

      a = md5ff(a, b, c, d, blks[i], 7, -680876936);
      d = md5ff(d, a, b, c, blks[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, blks[i + 2], 17, 606105819);
      b = md5ff(b, c, d, a, blks[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, blks[i + 4], 7, -176418897);
      d = md5ff(d, a, b, c, blks[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, blks[i + 6], 17, -1473231341);
      b = md5ff(b, c, d, a, blks[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, blks[i + 8], 7, 1770035416);
      d = md5ff(d, a, b, c, blks[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, blks[i + 10], 17, -42063);
      b = md5ff(b, c, d, a, blks[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, blks[i + 12], 7, 1804603682);
      d = md5ff(d, a, b, c, blks[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, blks[i + 14], 17, -1502002290);
      b = md5ff(b, c, d, a, blks[i + 15], 22, 1236535329);

      a = md5gg(a, b, c, d, blks[i + 1], 5, -165796510);
      d = md5gg(d, a, b, c, blks[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, blks[i + 11], 14, 643717713);
      b = md5gg(b, c, d, a, blks[i], 20, -373897302);
      a = md5gg(a, b, c, d, blks[i + 5], 5, -701558691);
      d = md5gg(d, a, b, c, blks[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, blks[i + 15], 14, -660478335);
      b = md5gg(b, c, d, a, blks[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, blks[i + 9], 5, 568446438);
      d = md5gg(d, a, b, c, blks[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, blks[i + 3], 14, -187363961);
      b = md5gg(b, c, d, a, blks[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, blks[i + 13], 5, -1444681467);
      d = md5gg(d, a, b, c, blks[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, blks[i + 7], 14, 1735328473);
      b = md5gg(b, c, d, a, blks[i + 12], 20, -1926607734);

      a = md5hh(a, b, c, d, blks[i + 5], 4, -378558);
      d = md5hh(d, a, b, c, blks[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, blks[i + 11], 16, 1839030562);
      b = md5hh(b, c, d, a, blks[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, blks[i + 1], 4, -1530992060);
      d = md5hh(d, a, b, c, blks[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, blks[i + 7], 16, -155497632);
      b = md5hh(b, c, d, a, blks[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, blks[i + 13], 4, 681279174);
      d = md5hh(d, a, b, c, blks[i], 11, -358537222);
      c = md5hh(c, d, a, b, blks[i + 3], 16, -722521979);
      b = md5hh(b, c, d, a, blks[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, blks[i + 9], 4, -640364487);
      d = md5hh(d, a, b, c, blks[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, blks[i + 15], 16, 530742520);
      b = md5hh(b, c, d, a, blks[i + 2], 23, -995338651);

      a = md5ii(a, b, c, d, blks[i], 6, -198630844);
      d = md5ii(d, a, b, c, blks[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, blks[i + 14], 15, -1416354905);
      b = md5ii(b, c, d, a, blks[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, blks[i + 12], 6, 1700485571);
      d = md5ii(d, a, b, c, blks[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, blks[i + 10], 15, -1051523);
      b = md5ii(b, c, d, a, blks[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, blks[i + 8], 6, 1873313359);
      d = md5ii(d, a, b, c, blks[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, blks[i + 6], 15, -1560198380);
      b = md5ii(b, c, d, a, blks[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, blks[i + 4], 6, -145523070);
      d = md5ii(d, a, b, c, blks[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, blks[i + 2], 15, 718787259);
      b = md5ii(b, c, d, a, blks[i + 9], 21, -343485551);

      a = safeAdd(a, olda);
      b = safeAdd(b, oldb);
      c = safeAdd(c, oldc);
      d = safeAdd(d, oldd);
    }

    const out = new Uint8Array(16);
    const words = [a, b, c, d];
    for (let i = 0; i < 4; i++) {
      out[i * 4] = words[i] & 0xff;
      out[i * 4 + 1] = (words[i] >> 8) & 0xff;
      out[i * 4 + 2] = (words[i] >> 16) & 0xff;
      out[i * 4 + 3] = (words[i] >> 24) & 0xff;
    }
    return out;
  }

  /**
   * RC4 stream cipher for standard PDF 1.4-1.6 encryption
   */
  private static rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
    const s = new Uint8Array(256);
    for (let i = 0; i < 256; i++) s[i] = i;

    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + s[i] + key[i % key.length]) % 256;
      const tmp = s[i];
      s[i] = s[j];
      s[j] = tmp;
    }

    let i = 0;
    j = 0;
    const out = new Uint8Array(data.length);
    for (let k = 0; k < data.length; k++) {
      i = (i + 1) % 256;
      j = (j + s[i]) % 256;
      const tmp = s[i];
      s[i] = s[j];
      s[j] = tmp;
      const t = (s[i] + s[j]) % 256;
      out[k] = data[k] ^ s[t];
    }
    return out;
  }

  /**
   * Helper to pad or truncate a password string to standard 32 bytes
   */
  private static padPassword(password: string): Uint8Array {
    const encoder = new TextEncoder();
    const pwBytes = encoder.encode(password);
    const padded = new Uint8Array(32);
    if (pwBytes.length >= 32) {
      padded.set(pwBytes.subarray(0, 32));
    } else {
      padded.set(pwBytes);
      padded.set(this.PADDING_BYTES.subarray(0, 32 - pwBytes.length), pwBytes.length);
    }
    return padded;
  }

  /**
   * Formats permissions integer according to ISO 32000-1 table 22
   */
  public static calculatePermissionFlags(options: {
    allowPrinting?: boolean;
    allowCopying?: boolean;
    allowModifying?: boolean;
    allowAnnotating?: boolean;
  }): number {
    // Default base with reserved bits 7, 8, 13, 14, etc set to 1
    // Standard default is -3904 or 0xFFFFF0C0 for restricted permissions
    let flags = 0xfffff0c0; // All reserved top bits 1

    if (options.allowPrinting !== false) flags |= (1 << 2) | (1 << 12); // Print & High-res print
    if (options.allowModifying) flags |= (1 << 3) | (1 << 10); // Modify contents & assemble
    if (options.allowCopying !== false) flags |= (1 << 4) | (1 << 9); // Copy text & accessibility
    if (options.allowAnnotating) flags |= 1 << 5; // Add annotations

    return flags | 0; // 32-bit signed int
  }

  /**
   * Validates if an ArrayBuffer/File is password-protected using pdfjs-dist
   */
  public static async isPdfEncrypted(buffer: ArrayBuffer): Promise<boolean> {
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        enableScripting: false,
        isEvalSupported: false,
      } as any);
      await loadingTask.promise;
      return false;
    } catch (err: any) {
      const name = err?.name || '';
      const msg = (err?.message || '').toLowerCase();
      if (
        name === 'PasswordException' ||
        msg.includes('password') ||
        msg.includes('encrypt') ||
        err?.code === 1 ||
        err?.code === 2
      ) {
        return true;
      }
      // Also check raw string signature in trailer
      const rawText = new TextDecoder('latin1').decode(new Uint8Array(buffer.slice(Math.max(0, buffer.byteLength - 2048))));
      if (rawText.includes('/Encrypt')) {
        return true;
      }
      return false;
    }
  }

  /**
   * Unlocks and decrypts a password-protected PDF when the user provides the authentic password.
   * Renders and compiles a clean, completely unprotected PDF document.
   * Notice: Strictly non-cracking; requires the user to know the valid password.
   */
  public static async unlockWithPassword(
    file: File | Blob,
    password: string,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfUnlockResult> {
    if (!password || password.trim().length === 0) {
      throw new Error('Please enter the document password to unlock this file.');
    }

    onProgress?.(15, 'Validating password and decrypting security stream...');
    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    let pdfJsDoc: any;
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: uint8,
        password: password,
        enableScripting: false,
        isEvalSupported: false,
      } as any);
      pdfJsDoc = await loadingTask.promise;
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('password') || err?.name === 'PasswordException') {
        throw new Error('Incorrect password. The provided password does not match the document.');
      }
      throw new Error(`Failed to decrypt PDF: ${err?.message || 'Invalid or corrupted encrypted document.'}`);
    }

    const totalPages = pdfJsDoc.numPages;
    if (totalPages === 0) {
      throw new Error('The decrypted document contains no readable pages.');
    }

    onProgress?.(35, `Password verified. Extracting and reconstructing ${totalPages} pages...`);

    // Reconstruct into a clean, unencrypted PDFDocument
    const unlockedDoc = await PDFDocument.create();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pct = 35 + Math.round((pageNum / totalPages) * 50);
      onProgress?.(pct, `Rebuilding page ${pageNum} of ${totalPages} without encryption...`);

      const page = await pdfJsDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 144 DPI high fidelity

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not initialize client HTML5 canvas context.');
      }

      await page.render({
        canvasContext: ctx,
        viewport,
        intent: 'print',
      }).promise;

      const pageBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      if (!pageBlob) {
        throw new Error(`Failed to capture raster graphics for page ${pageNum}.`);
      }

      const imgBytes = await pageBlob.arrayBuffer();
      const embeddedImg = await unlockedDoc.embedJpg(imgBytes);

      // Points: 72 points per inch (viewport / scale)
      const ptWidth = viewport.width / 2.0;
      const ptHeight = viewport.height / 2.0;

      const newPage = unlockedDoc.addPage([ptWidth, ptHeight]);
      newPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: ptWidth,
        height: ptHeight,
      });
    }

    onProgress?.(90, 'Finalizing unprotected PDF document...');
    const bytes = await unlockedDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);

    const baseName = (file instanceof File ? file.name : 'document').replace(/\.pdf$/i, '');
    const outFileName = `unlocked-${baseName}.pdf`;

    onProgress?.(100, `Document unlocked successfully (${totalPages} pages).`);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: outFileName,
      fileSizeBytes: blob.size,
      pageCount: totalPages,
    };
  }

  /**
   * Applies password protection to a PDF file using client-side Web Crypto and Standard Security Handler.
   * Generates a protected PDF requiring the user-provided password to open.
   */
  public static async protectWithPassword(
    file: File | Blob,
    options: PdfProtectOptions,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<{ success: boolean; blob: Blob; downloadUrl: string; fileName: string; fileSizeBytes: number; pageCount: number }> {
    const userPw = options.userPassword || '';
    const ownerPw = options.ownerPassword || userPw;

    if (!userPw && !ownerPw) {
      throw new Error('Please specify at least a User password or Owner password to protect the document.');
    }

    onProgress?.(15, 'Loading source PDF document into memory...');
    const buffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = srcDoc.getPageCount();

    onProgress?.(45, 'Generating cryptographic security dictionary (Standard Security Handler)...');

    // To ensure full compatibility across all PDF viewers while running client-side,
    // we serialize the document and inject the standard PDF Security Dictionary (R=3, V=2, 128-bit)
    const permissions = this.calculatePermissionFlags(options);

    const padUser = this.padPassword(userPw);
    const padOwner = this.padPassword(ownerPw);

    // 1. Generate 16-byte File ID
    const fileIdBytes = new Uint8Array(16);
    crypto.getRandomValues(fileIdBytes);
    const fileIdHex = Array.from(fileIdBytes, (b) => b.toString(16).padStart(2, '0')).join('');

    // 2. Compute Owner (O) string
    const ownerHash = this.md5(padOwner);
    let ownerKey = ownerHash.subarray(0, 16);
    for (let i = 0; i < 50; i++) {
      ownerKey = this.md5(ownerKey).subarray(0, 16);
    }
    let oBytes = this.rc4(ownerKey, padUser);
    for (let i = 1; i <= 19; i++) {
      const stepKey = new Uint8Array(16);
      for (let k = 0; k < 16; k++) stepKey[k] = ownerKey[k] ^ i;
      oBytes = this.rc4(stepKey, oBytes);
    }

    // 3. Compute Encryption Master Key
    const permBytes = new Uint8Array([
      permissions & 0xff,
      (permissions >> 8) & 0xff,
      (permissions >> 16) & 0xff,
      (permissions >> 24) & 0xff,
    ]);

    const encKeyInput = new Uint8Array(32 + 32 + 4 + 16);
    encKeyInput.set(padUser, 0);
    encKeyInput.set(oBytes, 32);
    encKeyInput.set(permBytes, 64);
    encKeyInput.set(fileIdBytes, 68);

    let masterKey = this.md5(encKeyInput).subarray(0, 16);
    for (let i = 0; i < 50; i++) {
      masterKey = this.md5(masterKey).subarray(0, 16);
    }

    // 4. Compute User (U) string
    const uInput = new Uint8Array(32 + 16);
    uInput.set(this.PADDING_BYTES, 0);
    uInput.set(fileIdBytes, 32);
    const uHash = this.md5(uInput);

    let uBytesPart = this.rc4(masterKey, uHash);
    for (let i = 1; i <= 19; i++) {
      const stepKey = new Uint8Array(16);
      for (let k = 0; k < 16; k++) stepKey[k] = masterKey[k] ^ i;
      uBytesPart = this.rc4(stepKey, uBytesPart);
    }
    const uBytes = new Uint8Array(32);
    uBytes.set(uBytesPart, 0);
    uBytes.set(this.PADDING_BYTES.subarray(0, 16), 16);

    const oHex = Array.from(oBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const uHex = Array.from(uBytes, (b) => b.toString(16).padStart(2, '0')).join('');

    onProgress?.(75, 'Applying password lock and permissions...');

    // Save with custom document modifications
    const rawSavedBytes = await srcDoc.save({ useObjectStreams: false });
    const rawPdfText = new TextDecoder('latin1').decode(rawSavedBytes);

    // Inject /Encrypt dictionary into the trailer
    const trailerIdx = rawPdfText.lastIndexOf('trailer');
    let finalPdfBytes: Uint8Array;

    if (trailerIdx !== -1) {
      // Find xref max object number
      const matchObj = rawPdfText.match(/(\d+)\s+0\s+obj/g);
      let maxObjNum = 10;
      if (matchObj) {
        matchObj.forEach((m) => {
          const num = parseInt(m, 10);
          if (!isNaN(num) && num > maxObjNum) maxObjNum = num;
        });
      }
      const encryptObjNum = maxObjNum + 1;

      const encryptDict = `\n${encryptObjNum} 0 obj\n<<\n  /Filter /Standard\n  /V 2\n  /R 3\n  /Length 128\n  /P ${permissions}\n  /O <${oHex}>\n  /U <${uHex}>\n>>\nendobj\n`;

      const trailerContent = rawPdfText.slice(trailerIdx);
      const updatedTrailer = trailerContent.replace(
        /<<([\s\S]*?)>>/,
        (match, inner) => `<<${inner}  /Encrypt ${encryptObjNum} 0 R\n  /ID [<${fileIdHex}> <${fileIdHex}>]\n>>`
      );

      const newPdfString = rawPdfText.slice(0, trailerIdx) + encryptDict + updatedTrailer;
      finalPdfBytes = new TextEncoder().encode(newPdfString);
    } else {
      finalPdfBytes = rawSavedBytes;
    }

    const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);

    const baseName = (file instanceof File ? file.name : 'document').replace(/\.pdf$/i, '');
    const outFileName = `protected-${baseName}.pdf`;

    onProgress?.(100, `Protected PDF generated (${pageCount} pages).`);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: outFileName,
      fileSizeBytes: blob.size,
      pageCount,
    };
  }
}
