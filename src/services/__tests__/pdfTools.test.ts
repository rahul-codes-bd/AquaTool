import { describe, it, expect, vi } from 'vitest';
import { PdfTools } from '../pdfTools';
import { PDFDocument } from 'pdf-lib';

describe('Phase 6: PdfTools Service', () => {
  describe('PDF Header & Magic Bytes Validation', () => {
    it('identifies standard PDF-1.7 header signature', async () => {
      const headerStr = '%PDF-1.7\n%âãÏÓ\n1 0 obj\n<<>>\nendobj';
      const blob = new Blob([headerStr], { type: 'application/pdf' });
      const res = await PdfTools.validatePdfHeader(blob);
      expect(res.isValid).toBe(true);
      expect(res.version).toBe('PDF 1.7');
    });

    it('identifies standard PDF-1.4 header signature', async () => {
      const headerStr = '%PDF-1.4\n1 0 obj\n';
      const blob = new Blob([headerStr], { type: 'application/pdf' });
      const res = await PdfTools.validatePdfHeader(blob);
      expect(res.isValid).toBe(true);
      expect(res.version).toBe('PDF 1.4');
    });

    it('rejects files missing the %PDF- signature', async () => {
      const textBlob = new Blob(['Hello world, this is a plain text file pretending to be a PDF'], {
        type: 'application/pdf',
      });
      const res = await PdfTools.validatePdfHeader(textBlob);
      expect(res.isValid).toBe(false);
      expect(res.version).toBeUndefined();
    });

    it('rejects empty blobs', async () => {
      const emptyBlob = new Blob([], { type: 'application/pdf' });
      const res = await PdfTools.validatePdfHeader(emptyBlob);
      expect(res.isValid).toBe(false);
    });
  });

  describe('detectStandardSize', () => {
    it('detects A4 dimensions regardless of orientation', () => {
      expect(PdfTools.detectStandardSize(595.28, 841.89)).toBe('A4');
      expect(PdfTools.detectStandardSize(841.89, 595.28)).toBe('A4');
    });

    it('detects US Letter dimensions', () => {
      expect(PdfTools.detectStandardSize(612, 792)).toBe('US Letter');
      expect(PdfTools.detectStandardSize(792, 612)).toBe('US Letter');
    });

    it('detects US Legal dimensions', () => {
      expect(PdfTools.detectStandardSize(612, 1008)).toBe('US Legal');
    });

    it('detects Tabloid dimensions', () => {
      expect(PdfTools.detectStandardSize(792, 1224)).toBe('Tabloid (11×17")');
    });

    it('detects A3 dimensions', () => {
      expect(PdfTools.detectStandardSize(841.89, 1190.55)).toBe('A3');
    });

    it('detects square dimensions', () => {
      expect(PdfTools.detectStandardSize(500, 500)).toBe('Square');
    });

    it('returns custom dimensions for non-standard sizes', () => {
      const custom = PdfTools.detectStandardSize(300, 450);
      expect(custom).toContain('300');
      expect(custom).toContain('450');
    });
  });

  describe('parsePageRange', () => {
    it('parses discrete comma-separated numbers and hyphenated ranges', () => {
      const parsed = PdfTools.parsePageRange('1-3, 5, 8-10', 10);
      expect(parsed).toEqual([0, 1, 2, 4, 7, 8, 9]); // 0-based indices
    });

    it('parses "odd" preset', () => {
      const parsed = PdfTools.parsePageRange('odd', 6);
      expect(parsed).toEqual([0, 2, 4]); // 1, 3, 5
    });

    it('parses "even" preset', () => {
      const parsed = PdfTools.parsePageRange('even', 6);
      expect(parsed).toEqual([1, 3, 5]); // 2, 4, 6
    });

    it('parses "all" keyword', () => {
      const parsed = PdfTools.parsePageRange('all', 4);
      expect(parsed).toEqual([0, 1, 2, 3]);
    });

    it('deduplicates overlapping page numbers and sorts them', () => {
      const parsed = PdfTools.parsePageRange('3, 1-4, 2, 4', 5);
      expect(parsed).toEqual([0, 1, 2, 3]);
    });

    it('clamps out-of-range pages gracefully', () => {
      const parsed = PdfTools.parsePageRange('1-100', 5);
      expect(parsed).toEqual([0, 1, 2, 3, 4]);
    });

    it('returns empty array for invalid or out-of-bounds queries', () => {
      expect(PdfTools.parsePageRange('99, 100', 5)).toEqual([]);
      expect(PdfTools.parsePageRange('', 5)).toEqual([]);
      expect(PdfTools.parsePageRange('invalid', 5)).toEqual([]);
    });
  });

  describe('Metadata Inspection & Page Metrics', () => {
    it('correctly reads metadata and page details from generated PDF', async () => {
      const doc = await PDFDocument.create();
      doc.setTitle('AquaTools Test Document');
      doc.setAuthor('Aqua Developer');
      doc.setSubject('Testing Client-Side Processing');
      doc.setCreator('pdf-lib');
      doc.setProducer('AquaTools Suite');

      // Page 1: Portrait Letter (612 x 792)
      doc.addPage([612, 792]);
      // Page 2: Landscape A4 (842 x 595)
      doc.addPage([841.89, 595.28]);

      const pdfBytes = await doc.save();
      const file = new File([pdfBytes], 'test_document.pdf', { type: 'application/pdf' });

      const progressStages: string[] = [];
      const meta = await PdfTools.getPdfMetadata(file, (pct, msg) => {
        progressStages.push(msg);
      });

      expect(meta.pageCount).toBe(2);
      expect(meta.title).toBe('AquaTools Test Document');
      expect(meta.author).toBe('Aqua Developer');
      expect(meta.subject).toBe('Testing Client-Side Processing');
      expect(meta.creator).toBe('pdf-lib');
      expect(meta.isEncrypted).toBe(false);
      expect(meta.pages).toHaveLength(2);

      // Page 1 assertions
      expect(meta.pages[0].pageNumber).toBe(1);
      expect(meta.pages[0].standardSize).toBe('US Letter');
      expect(meta.pages[0].orientation).toBe('Portrait');

      // Page 2 assertions
      expect(meta.pages[1].pageNumber).toBe(2);
      expect(meta.pages[1].standardSize).toBe('A4');
      expect(meta.pages[1].orientation).toBe('Landscape');

      // Mixed flags
      expect(meta.hasMixedOrientations).toBe(true);
      expect(meta.hasMixedSizes).toBe(true);
      expect(progressStages.length).toBeGreaterThan(0);
    });

    it('rejects corrupt/malformed files with informative error', async () => {
      const malformed = new File(['%PDF-1.4\nBROKEN STREAM GARBAGE NOT VALID PDF'], 'broken.pdf', {
        type: 'application/pdf',
      });

      await expect(PdfTools.getPdfMetadata(malformed)).rejects.toThrow(/Failed to parse PDF document/);
    });

    it('rejects files without %PDF header', async () => {
      const nonPdf = new File(['Just plain text data'], 'not_pdf.txt', {
        type: 'text/plain',
      });

      await expect(PdfTools.getPdfMetadata(nonPdf)).rejects.toThrow(/Invalid or corrupted PDF file/);
    });
  });

  describe('Merge & Split Operations', () => {
    it('merges two separate PDFs into one document', async () => {
      // Create doc A (1 page)
      const docA = await PDFDocument.create();
      docA.addPage([612, 792]);
      const bytesA = await docA.save();
      const fileA = new File([bytesA], 'docA.pdf', { type: 'application/pdf' });

      // Create doc B (2 pages)
      const docB = await PDFDocument.create();
      docB.addPage([612, 792]);
      docB.addPage([612, 792]);
      const bytesB = await docB.save();
      const fileB = new File([bytesB], 'docB.pdf', { type: 'application/pdf' });

      // Mock URL.createObjectURL
      const mockUrl = 'blob:http://localhost/merged-test-url';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);

      const res = await PdfTools.mergePdfs([fileA, fileB]);
      expect(res.pageCount).toBe(3);
      expect(res.url).toBe(mockUrl);
      expect(res.blob).toBeInstanceOf(Blob);
      expect(res.fileSize).toBeGreaterThan(0);
    });

    it('rejects merge with fewer than 2 files', async () => {
      const doc = await PDFDocument.create();
      doc.addPage();
      const bytes = await doc.save();
      const file = new File([bytes], 'single.pdf', { type: 'application/pdf' });

      await expect(PdfTools.mergePdfs([file])).rejects.toThrow(/at least 2 PDF files/);
    });

    it('splits pages into a new combined PDF', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([612, 792]); // Page 1
      doc.addPage([612, 792]); // Page 2
      doc.addPage([612, 792]); // Page 3
      const bytes = await doc.save();
      const file = new File([bytes], 'source.pdf', { type: 'application/pdf' });

      const res = await PdfTools.splitPdf(file, '1, 3');
      expect(res.pageCount).toBe(2);
      expect(res.extractedPages).toEqual([1, 3]);
      expect(res.blob).toBeInstanceOf(Blob);
    });

    it('splits selected pages into individual PDFs bundled in a ZIP archive', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([612, 792]); // Page 1
      doc.addPage([612, 792]); // Page 2
      const bytes = await doc.save();
      const file = new File([bytes], 'multi.pdf', { type: 'application/pdf' });

      const res = await PdfTools.splitAllPagesToZip(file, [1, 2]);
      expect(res.isZip).toBe(true);
      expect(res.pageCount).toBe(2);
      expect(res.blob).toBeInstanceOf(Blob);
    });
  });

  describe('Memory Management & Utilities', () => {
    it('revokes blob URLs safely', () => {
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      PdfTools.revokeUrl('blob:http://localhost/test-blob');
      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/test-blob');

      // Does not call on non-blob URLs
      revokeSpy.mockClear();
      PdfTools.revokeUrl('https://example.com/file.pdf');
      expect(revokeSpy).not.toHaveBeenCalled();

      // Does not call on undefined
      PdfTools.revokeUrl(undefined);
      expect(revokeSpy).not.toHaveBeenCalled();
    });

    it('formats bytes nicely', () => {
      expect(PdfTools.formatBytes(0)).toBe('0 B');
      expect(PdfTools.formatBytes(1024)).toBe('1 KB');
      expect(PdfTools.formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });
  });
});
