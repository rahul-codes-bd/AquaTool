import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PDFDocument, rgb } from 'pdf-lib';
import { PdfEngine } from '../pdfEngine';
import {
  PdfWatermarkConfig,
  PdfPageNumberConfig,
  PdfMetadataUpdateConfig,
  PdfImageToPdfConfig,
} from '../../types/pdf';

describe('PdfEngine (Phase A Architecture & Engine)', () => {
  beforeEach(() => {
    PdfEngine.cleanupAllTrackedUrls();
  });

  afterEach(() => {
    PdfEngine.cleanupAllTrackedUrls();
  });

  // Helper to create a sample in-memory PDF
  async function createSamplePdf(pageCount = 3, title = 'Test Doc'): Promise<File> {
    const doc = await PDFDocument.create();
    doc.setTitle(title);
    doc.setAuthor('AquaTools Tester');

    for (let i = 0; i < pageCount; i++) {
      // A4 page: 595.28 x 841.89
      const page = doc.addPage([595.28, 841.89]);
      page.drawText(`Sample Page ${i + 1}`, {
        x: 50,
        y: 800,
        size: 24,
        color: rgb(0, 0.5, 0.8),
      });
    }

    const bytes = await doc.save();
    return new File([bytes], `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`, {
      type: 'application/pdf',
    });
  }

  describe('1. File Signature & Dimension Validation', () => {
    it('validates a correct PDF signature', async () => {
      const file = await createSamplePdf(1);
      const res = await PdfEngine.validatePdfSignature(file);
      expect(res.isValid).toBe(true);
      expect(res.version).toContain('PDF');
    });

    it('rejects invalid or non-PDF files', async () => {
      const fakeFile = new File(['Hello World plain text'], 'plain.txt', { type: 'text/plain' });
      const res = await PdfEngine.validatePdfSignature(fakeFile);
      expect(res.isValid).toBe(false);
    });

    it('detects standard paper dimensions accurately', () => {
      expect(PdfEngine.detectStandardPageSize(595.28, 841.89)).toBe('A4');
      expect(PdfEngine.detectStandardPageSize(612, 792)).toBe('US Letter');
      expect(PdfEngine.detectStandardPageSize(612, 1008)).toBe('US Legal');
      expect(PdfEngine.detectStandardPageSize(841.89, 1190.55)).toBe('A3');
      expect(PdfEngine.detectStandardPageSize(419.53, 595.28)).toBe('A5');
      expect(PdfEngine.detectStandardPageSize(500, 500)).toBe('Square');
      expect(PdfEngine.detectStandardPageSize(300, 600)).toBe('300 × 600 pt');
    });

    it('parses flexible page ranges', () => {
      expect(PdfEngine.parsePageRanges('all', 5)).toEqual([0, 1, 2, 3, 4]);
      expect(PdfEngine.parsePageRanges('odd', 5)).toEqual([0, 2, 4]);
      expect(PdfEngine.parsePageRanges('even', 5)).toEqual([1, 3]);
      expect(PdfEngine.parsePageRanges('1, 3, 5', 5)).toEqual([0, 2, 4]);
      expect(PdfEngine.parsePageRanges('2-4', 5)).toEqual([1, 2, 3]);
      expect(PdfEngine.parsePageRanges('1-2, 4-5', 5)).toEqual([0, 1, 3, 4]);
    });
  });

  describe('2. PDF Inspection & Metadata Extraction', () => {
    it('extracts metadata and page metrics from a valid PDF', async () => {
      const file = await createSamplePdf(3, 'Aqua Architecture Spec');
      const summary = await PdfEngine.inspectPdf(file);

      expect(summary.pageCount).toBe(3);
      expect(summary.title).toBe('Aqua Architecture Spec');
      expect(summary.author).toBe('AquaTools Tester');
      expect(summary.isEncrypted).toBe(false);
      expect(summary.pages.length).toBe(3);
      expect(summary.pages[0].standardSize).toBe('A4');
      expect(summary.pages[0].orientation).toBe('Portrait');
    });

    it('throws when inspecting an empty file', async () => {
      const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
      await expect(PdfEngine.inspectPdf(emptyFile)).rejects.toThrow('empty');
    });
  });

  describe('3. PDF Merging', () => {
    it('merges multiple PDF files into one single document', async () => {
      const doc1 = await createSamplePdf(2, 'Doc 1');
      const doc2 = await createSamplePdf(3, 'Doc 2');

      const result = await PdfEngine.mergePdfs([doc1, doc2]);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(5);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.downloadUrl).toBeDefined();

      // Inspect merged output
      const mergedSummary = await PdfEngine.inspectPdf(result.blob!);
      expect(mergedSummary.pageCount).toBe(5);
    });

    it('fails when less than 2 files are supplied to merge', async () => {
      const doc1 = await createSamplePdf(1, 'Doc 1');
      await expect(PdfEngine.mergePdfs([doc1])).rejects.toThrow('at least 2');
    });
  });

  describe('4. Page Manipulation (Rearrange, Rotate, Delete)', () => {
    it('rearranges and rotates pages according to a page plan', async () => {
      const file = await createSamplePdf(4, 'Reorder Test');

      // Plan: Take page 3 (index 2) rotated 90 deg, and page 1 (index 0) rotated 0 deg
      const result = await PdfEngine.manipulatePages(file, [
        { originalIndex: 2, rotationDelta: 90 },
        { originalIndex: 0, rotationDelta: 0 },
      ]);

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(2);

      const inspection = await PdfEngine.inspectPdf(result.blob!);
      expect(inspection.pageCount).toBe(2);
      expect(inspection.pages[0].rotation).toBe(90);
      expect(inspection.pages[1].rotation).toBe(0);
    });
  });

  describe('5. Watermarking', () => {
    it('stamps text watermarks onto PDF pages', async () => {
      const file = await createSamplePdf(2, 'Watermark Test');
      const config: PdfWatermarkConfig = {
        text: 'CONFIDENTIAL',
        fontSize: 32,
        opacity: 0.4,
        rotationDegrees: 45,
        colorHex: '#ff0000',
        position: 'center',
        targetPages: 'all',
      };

      const result = await PdfEngine.addWatermark(file, config);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(2);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob!.size).toBeGreaterThan(0);
    });
  });

  describe('6. Page Numbering', () => {
    it('adds dynamic page numbers in footer position', async () => {
      const file = await createSamplePdf(3, 'Numbering Test');
      const config: PdfPageNumberConfig = {
        format: 'page-of-total',
        fontSize: 10,
        position: 'bottom-center',
        colorHex: '#333333',
        marginPt: 30,
        startNumber: 1,
        targetPages: 'all',
      };

      const result = await PdfEngine.addPageNumbers(file, config);
      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(3);
      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe('7. Metadata Updating', () => {
    it('updates title, author, subject and keywords properties', async () => {
      const file = await createSamplePdf(1, 'Original Title');
      const updateConfig: PdfMetadataUpdateConfig = {
        title: 'New Secure Aqua Title',
        author: 'Aqua Specialist',
        subject: 'PDF Engine Phase A',
        keywords: 'privacy, browser, fast',
      };

      const result = await PdfEngine.updateMetadata(file, updateConfig);
      expect(result.success).toBe(true);

      const inspectResult = await PdfEngine.inspectPdf(result.blob!);
      expect(inspectResult.title).toBe('New Secure Aqua Title');
      expect(inspectResult.author).toBe('Aqua Specialist');
      expect(inspectResult.subject).toBe('PDF Engine Phase A');
      expect(inspectResult.keywords).toContain('privacy');
    });
  });

  describe('8. Memory & URL Lifecycle Cleanup', () => {
    it('tracks and safely cleans up all active object URLs', () => {
      const dummyBlob = new Blob(['sample data'], { type: 'application/pdf' });
      const url1 = PdfEngine.createTrackedUrl(dummyBlob);
      const url2 = PdfEngine.createTrackedUrl(dummyBlob);

      expect(typeof url1).toBe('string');
      expect(typeof url2).toBe('string');

      // Cleanup single URL
      PdfEngine.revokeUrl(url1);

      // Cleanup all
      expect(() => PdfEngine.cleanupAllTrackedUrls()).not.toThrow();
    });
  });

  describe('9. Compression & Stream Optimization', () => {
    it('executes lossless compaction on a PDF document', async () => {
      const file = await createSamplePdf(3, 'Compression Target');
      const result = await PdfEngine.compressPdf(file, {
        mode: 'lossless-structural',
        targetDpi: 150,
        imageQuality: 0.8,
        grayscale: false,
        stripMetadata: true,
        cleanUnusedObjects: true,
      });

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(3);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.savingsPct).toBeDefined();
      expect(result.compressedSize).toBeDefined();
    });

    it('web-optimizes a PDF object hierarchy', async () => {
      const file = await createSamplePdf(2, 'Web Optimize Target');
      const result = await PdfEngine.optimizeWebStreams(file, {
        cleanObjectStreams: true,
        deflateStreams: true,
        removeUnusedResources: true,
        sortPageTree: true,
      });

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(2);
      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe('10. PDF/A Archival Preservation', () => {
    it('standardizes a document with XMP metadata and sRGB OutputIntent', async () => {
      const file = await createSamplePdf(2, 'Archival Doc');
      const result = await PdfEngine.prepareArchivalPdf(file, {
        standard: 'PDF/A-1b',
        colorProfile: 'sRGB',
        stripJavaScript: true,
        stripMultimedia: true,
      });

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(2);
      expect(result.blob).toBeInstanceOf(Blob);

      const inspection = await PdfEngine.inspectPdf(result.blob!);
      expect(inspection.pageCount).toBe(2);
    });
  });

  describe('11. N-Up & Spread Halving', () => {
    it('composites 2 pages per sheet (2-Up)', async () => {
      const file = await createSamplePdf(4, 'N-Up Target');
      const result = await PdfEngine.pagesPerSheet(file, {
        count: 2,
        orientation: 'landscape',
        pageSize: 'a4',
        addBorder: true,
        marginPt: 15,
        spacingPt: 10,
        pageOrder: 'ltr',
      });

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(2); // 4 pages packed 2-up -> 2 output pages
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('halves 2-page horizontal spreads into separate single pages', async () => {
      // Create a 2-page wide spread (e.g. 1190 x 841 pt)
      const doc = await PDFDocument.create();
      const page = doc.addPage([1190.55, 841.89]);
      page.drawText('Left Spread', { x: 100, y: 400, size: 20 });
      page.drawText('Right Spread', { x: 700, y: 400, size: 20 });
      const bytes = await doc.save();
      const spreadFile = new File([bytes], 'spread.pdf', { type: 'application/pdf' });

      const result = await PdfEngine.halvePages(spreadFile, {
        direction: 'vertical',
        pageRange: 'all',
      });

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(2); // 1 wide page split in half -> 2 portrait pages
    });
  });

  describe('12. Corrupted PDF Diagnostics & Salvage', () => {
    it('repairs valid and slightly damaged PDF structures', async () => {
      const file = await createSamplePdf(2, 'Repair Candidate');
      const result = await PdfEngine.repairPdf(file);

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(2);
      expect(result.diagnostic.recoveredPages).toBe(2);
      expect(result.diagnostic.repairsApplied.length).toBeGreaterThan(0);
    });
  });

  describe('13. Bookmarks & Table of Contents', () => {
    it('embeds outline bookmarks and prepends TOC page', async () => {
      const file = await createSamplePdf(3, 'TOC Document');
      const result = await PdfEngine.generateTocPdf(
        file,
        [
          { id: '1', title: 'Chapter 1: Intro', pageNumber: 1, level: 0 },
          { id: '2', title: 'Chapter 2: Architecture', pageNumber: 2, level: 0 },
          { id: '3', title: 'Section 2.1: Details', pageNumber: 3, level: 1 },
        ]
      );

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(4); // 3 original + 1 prepended TOC page
    });
  });
});
