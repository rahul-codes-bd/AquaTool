import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FileHandlerService,
  ObjectUrlManager,
  FileValidationOptions,
} from '../fileHandler';

describe('FileHandlerService', () => {
  // Helper to create mock File in memory
  const createMockFile = (
    name: string,
    sizeBytes: number,
    type: string,
    contentBytes?: Uint8Array
  ): File => {
    let buffer: ArrayBuffer;
    if (contentBytes) {
      buffer = contentBytes.buffer.slice(
        contentBytes.byteOffset,
        contentBytes.byteOffset + contentBytes.byteLength
      );
    } else {
      buffer = new Uint8Array(sizeBytes).buffer;
    }
    const blob = new Blob([buffer], { type });
    return new File([blob], name, { type });
  };

  describe('Valid Inputs', () => {
    it('accepts a valid text file within size limits', async () => {
      const file = createMockFile('notes.txt', 1024, 'text/plain');
      const result = await FileHandlerService.validateFile(file, {
        accept: '.txt, text/plain',
        maxSizeBytes: 5 * 1024 * 1024,
      });

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeUndefined();
      expect(result.sanitizedName).toBe('notes.txt');
    });

    it('accepts a valid PNG image matching magic bytes', async () => {
      // PNG header: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const file = createMockFile('diagram.png', pngHeader.length, 'image/png', pngHeader);

      const result = await FileHandlerService.validateFile(file, {
        accept: 'image/*',
        checkMagicBytes: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeUndefined();
    });

    it('accepts a valid PDF file matching %PDF magic bytes', async () => {
      // %PDF header: 0x25, 0x50, 0x44, 0x46
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
      const file = createMockFile('report.pdf', pdfHeader.length, 'application/pdf', pdfHeader);

      const result = await FileHandlerService.validateFile(file, {
        accept: '.pdf',
        checkMagicBytes: true,
      });

      expect(result.isValid).toBe(true);
    });

    it('validates multiple valid files in batch', async () => {
      const f1 = createMockFile('doc1.txt', 500, 'text/plain');
      const f2 = createMockFile('doc2.txt', 1200, 'text/plain');

      const batch = await FileHandlerService.validateFiles([f1, f2], {
        accept: '.txt',
        maxFiles: 5,
      });

      expect(batch.validFiles.length).toBe(2);
      expect(batch.errors.length).toBe(0);
      expect(batch.totalValidBytes).toBe(1700);
    });
  });

  describe('Invalid Inputs (Format & MIME)', () => {
    it('rejects a file with disallowed extension', async () => {
      const file = createMockFile('malicious.exe', 2048, 'application/x-msdownload');
      const result = await FileHandlerService.validateFile(file, {
        accept: '.png, .jpg, .pdf',
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_EXTENSION');
      expect(result.errorMessage).toContain('File format for "malicious.exe" is not supported');
    });

    it('rejects a file with disallowed MIME type', async () => {
      const file = createMockFile('script.js', 1024, 'application/javascript');
      const result = await FileHandlerService.validateFile(file, {
        accept: 'image/*',
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_EXTENSION');
    });

    it('rejects batch when exceeding maxFiles count', async () => {
      const files = [
        createMockFile('a.txt', 10, 'text/plain'),
        createMockFile('b.txt', 10, 'text/plain'),
        createMockFile('c.txt', 10, 'text/plain'),
      ];

      const batch = await FileHandlerService.validateFiles(files, {
        maxFiles: 2,
      });

      expect(batch.validFiles.length).toBe(0);
      expect(batch.errors[0]).toContain('Maximum 2 files can be processed at once');
    });
  });

  describe('Oversized Inputs', () => {
    it('rejects files exceeding configurable maxSizeBytes', async () => {
      const maxBytes = 2 * 1024 * 1024; // 2MB
      const oversizedBytes = 3 * 1024 * 1024; // 3MB
      const file = createMockFile('huge_dataset.csv', oversizedBytes, 'text/csv');

      const result = await FileHandlerService.validateFile(file, {
        maxSizeBytes: maxBytes,
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
      expect(result.errorMessage).toContain('exceeds the maximum allowed limit of 2 MB');
    });

    it('rejects files smaller than minSizeBytes', async () => {
      const file = createMockFile('short.txt', 5, 'text/plain');
      const result = await FileHandlerService.validateFile(file, {
        minSizeBytes: 100,
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('FILE_TOO_SMALL');
      expect(result.errorMessage).toContain('smaller than the minimum required size');
    });
  });

  describe('Empty Inputs', () => {
    it('rejects zero-byte empty files by default', async () => {
      const emptyFile = createMockFile('empty.txt', 0, 'text/plain');
      const result = await FileHandlerService.validateFile(emptyFile);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('FILE_EMPTY');
      expect(result.errorMessage).toContain('completely empty (0 Bytes)');
    });

    it('permits zero-byte files when allowEmpty is explicitly enabled', async () => {
      const emptyFile = createMockFile('empty.txt', 0, 'text/plain');
      const result = await FileHandlerService.validateFile(emptyFile, {
        allowEmpty: true,
        minSizeBytes: 0,
      });

      expect(result.isValid).toBe(true);
    });
  });

  describe('Malformed Inputs (Header & Magic Bytes Mismatch)', () => {
    it('rejects a fake PDF whose magic bytes do not start with %PDF', async () => {
      // Random bytes pretending to be a PDF
      const corruptedBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
      const file = createMockFile('corrupted.pdf', corruptedBytes.length, 'application/pdf', corruptedBytes);

      const result = await FileHandlerService.validateFile(file, {
        accept: '.pdf',
        checkMagicBytes: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('MALFORMED_FILE');
      expect(result.errorMessage).toContain('corrupted or not a valid PDF binary');
    });

    it('rejects a fake PNG image whose header bytes are invalid', async () => {
      const corruptedBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38]); // actually GIF bytes named .png
      const file = createMockFile('fake.png', corruptedBytes.length, 'image/png', corruptedBytes);

      const result = await FileHandlerService.validateFile(file, {
        accept: '.png',
        checkMagicBytes: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('MALFORMED_FILE');
      expect(result.errorMessage).toContain('corrupted or not a valid PNG binary');
    });
  });

  describe('Safe Filename Sanitization', () => {
    it('removes directory traversal sequences', () => {
      expect(FileHandlerService.sanitizeFileName('../../etc/passwd.txt')).toBe('passwd.txt');
      expect(FileHandlerService.sanitizeFileName('..\\..\\Windows\\System32\\cmd.exe')).toBe('cmd.exe');
    });

    it('sanitizes illegal OS characters', () => {
      expect(FileHandlerService.sanitizeFileName('my<bad>:file"name|test?.png')).toBe(
        'my_bad_file_name_test_.png'
      );
    });

    it('strips control characters and null bytes', () => {
      const malicious = `report\x00\x1f\x07.pdf`;
      expect(FileHandlerService.sanitizeFileName(malicious)).toBe('report.pdf');
    });

    it('handles empty strings with fallback', () => {
      expect(FileHandlerService.sanitizeFileName('', 'default_name.txt')).toBe('default_name.txt');
      expect(FileHandlerService.sanitizeFileName('   ', 'fallback')).toBe('fallback');
    });

    it('safely truncates excessively long filenames while preserving extension', () => {
      const longName = 'a'.repeat(300) + '.pdf';
      const sanitized = FileHandlerService.sanitizeFileName(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized.endsWith('.pdf')).toBe(true);
    });
  });

  describe('Format Bytes Utility', () => {
    it('formats 0 bytes', () => {
      expect(FileHandlerService.formatBytes(0)).toBe('0 Bytes');
    });

    it('formats bytes, KB, and MB accurately', () => {
      expect(FileHandlerService.formatBytes(512)).toBe('512 Bytes');
      expect(FileHandlerService.formatBytes(1024)).toBe('1 KB');
      expect(FileHandlerService.formatBytes(1048576)).toBe('1 MB');
      expect(FileHandlerService.formatBytes(1073741824)).toBe('1 GB');
    });
  });
});

describe('ObjectUrlManager', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL in jsdom / node environment
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn((blob: Blob) => `blob:http://localhost/${Math.random()}`);
    } else {
      vi.spyOn(globalThis.URL, 'createObjectURL').mockImplementation(() => `blob:http://localhost/${Math.random()}`);
    }
    if (!globalThis.URL.revokeObjectURL) {
      globalThis.URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(() => {});
    }
  });

  it('tracks created object URLs and revokes all on cleanup', () => {
    const manager = new ObjectUrlManager();
    const blob1 = new Blob(['hello'], { type: 'text/plain' });
    const blob2 = new Blob(['world'], { type: 'text/plain' });

    const url1 = manager.createSafeUrl(blob1);
    const url2 = manager.createSafeUrl(blob2);

    expect(manager.count).toBe(2);
    expect(url1).toContain('blob:');

    manager.revokeSafeUrl(url1);
    expect(manager.count).toBe(1);

    manager.revokeAll();
    expect(manager.count).toBe(0);
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
  });
});
