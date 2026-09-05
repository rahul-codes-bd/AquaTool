import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { PdfEngine } from '../pdfEngine';
import { FileHandlerService } from '../fileHandler';
import JSZip from 'jszip';

describe('Browser Acceptance & File Integrity Test Suite', () => {
  describe('1. Valid File Conversions & Output Integrity', () => {
    it('creates valid PDF with correct %PDF- magic bytes and MIME type', async () => {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([600, 400]);
      pdfDoc.addPage([600, 400]);
      const pdfBytes = await pdfDoc.save();

      // Check %PDF- header (ASCII: 0x25, 0x50, 0x44, 0x46, 0x2D)
      const header = String.fromCharCode(...pdfBytes.slice(0, 5));
      expect(header).toBe('%PDF-');

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(500);
    });

    it('creates valid multi-file ZIP archive with correct PK magic bytes', async () => {
      const zip = new JSZip();
      zip.file('file1.txt', 'Hello World 1');
      zip.file('file2.txt', 'Hello World 2');

      const zipBytes = await zip.generateAsync({ type: 'uint8array' });
      // ZIP magic bytes: PK\x03\x04
      expect(zipBytes[0]).toBe(0x50); // 'P'
      expect(zipBytes[1]).toBe(0x4b); // 'K'
      expect(zipBytes[2]).toBe(0x03);
      expect(zipBytes[3]).toBe(0x04);

      // Verify unpackability
      const unzipped = await JSZip.loadAsync(zipBytes);
      expect(Object.keys(unzipped.files)).toContain('file1.txt');
      expect(Object.keys(unzipped.files)).toContain('file2.txt');
      const content = await unzipped.files['file1.txt'].async('text');
      expect(content).toBe('Hello World 1');
    });

    it('performs PDF page operations and verifies signature and page counts', async () => {
      // Create 3 page PDF
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([500, 500]);
      pdfDoc.addPage([500, 500]);
      pdfDoc.addPage([500, 500]);
      const bytes = await pdfDoc.save();
      const testFile = new File([bytes], 'three_pages.pdf', { type: 'application/pdf' });

      const sig = await PdfEngine.validatePdfSignature(testFile);
      expect(sig.isValid).toBe(true);

      const inspection = await PdfEngine.inspectPdf(testFile);
      expect(inspection.pageCount).toBe(3);
    });
  });

  describe('2. Empty, Malformed, and Corrupted Files', () => {
    it('gracefully rejects 0-byte empty files', async () => {
      const emptyBlob = new Blob([], { type: 'application/pdf' });
      const emptyFile = new File([emptyBlob], 'empty.pdf', { type: 'application/pdf' });

      const result = await FileHandlerService.validateFile(emptyFile, {
        accept: '.pdf, application/pdf',
        minSizeBytes: 1,
      });

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('FILE_EMPTY');
    });

    it('gracefully catches and reports corrupted malformed PDF files', async () => {
      const garbageBytes = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66]);
      const badBlob = new Blob([garbageBytes], { type: 'application/pdf' });
      const badFile = new File([badBlob], 'corrupted.pdf', { type: 'application/pdf' });

      const sig = await PdfEngine.validatePdfSignature(badFile);
      expect(sig.isValid).toBe(false);

      await expect(PdfEngine.inspectPdf(badFile)).rejects.toThrow();
    });

    it('sanitizes dangerous characters in filenames to prevent path traversal', () => {
      const dangerousNames = [
        '../../etc/passwd.pdf',
        '..\\..\\windows\\system32\\cmd.exe',
        '<script>alert(1)</script>.pdf',
        'test\0nullbyte.pdf',
      ];

      for (const name of dangerousNames) {
        const sanitized = FileHandlerService.sanitizeFileName(name);
        expect(sanitized).not.toContain('..');
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
        expect(sanitized).not.toContain('\0');
        expect(sanitized).not.toContain('/');
        expect(sanitized).not.toContain('\\');
      }
    });
  });
});
