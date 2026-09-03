import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFButton,
} from 'pdf-lib';
import JSZip from 'jszip';
import {
  PdfDocumentSummary,
  PdfPageMetric,
  PdfWatermarkConfig,
  PdfPageNumberConfig,
  PdfMetadataUpdateConfig,
  PdfImageToPdfConfig,
  PdfEngineResult,
  PdfFormFieldInfo,
  PdfNewFormField,
  PdfAnnotationItem,
  PdfBookmarkItem,
  PdfNUpConfig,
  PdfHalveConfig,
  PdfOverlayConfig,
} from '../types/pdf';
import { PdfRenderer } from './pdfRenderer';
import { PdfCrypt, PdfProtectOptions } from './pdfCrypt';


export class PdfEngine {
  private static readonly LARGE_FILE_THRESHOLD_BYTES = 50 * 1024 * 1024; // 50 MB
  private static activeUrls = new Set<string>();

  /**
   * Validates if raw bytes start with standard PDF header '%PDF-'
   */
  static async validatePdfSignature(data: ArrayBuffer | Blob | File): Promise<{ isValid: boolean; version?: string }> {
    try {
      let slice: ArrayBuffer;
      if (data instanceof Blob) {
        slice = await data.slice(0, 1024).arrayBuffer();
      } else {
        slice = data.slice(0, Math.min(1024, data.byteLength));
      }
      const text = new TextDecoder('latin1').decode(slice);
      const match = text.match(/%PDF-([0-9\.]+)/);
      if (match) {
        return { isValid: true, version: `PDF ${match[1]}` };
      }
      return { isValid: false };
    } catch {
      return { isValid: false };
    }
  }

  /**
   * Detects standard international paper sizes based on point dimensions (1 pt = 1/72 inch)
   */
  static detectStandardPageSize(widthPt: number, heightPt: number): string {
    const [short, long] = widthPt < heightPt ? [widthPt, heightPt] : [heightPt, widthPt];

    if (Math.abs(short - 595.28) <= 6 && Math.abs(long - 841.89) <= 6) return 'A4';
    if (Math.abs(short - 612) <= 6 && Math.abs(long - 792) <= 6) return 'US Letter';
    if (Math.abs(short - 612) <= 6 && Math.abs(long - 1008) <= 6) return 'US Legal';
    if (Math.abs(short - 792) <= 6 && Math.abs(long - 1224) <= 6) return 'Tabloid (11×17")';
    if (Math.abs(short - 841.89) <= 6 && Math.abs(long - 1190.55) <= 6) return 'A3';
    if (Math.abs(short - 419.53) <= 6 && Math.abs(long - 595.28) <= 6) return 'A5';
    if (Math.abs(short - 522) <= 6 && Math.abs(long - 756) <= 6) return 'Executive';
    if (Math.abs(short - long) <= 3) return 'Square';

    return `${Math.round(widthPt)} × ${Math.round(heightPt)} pt`;
  }

  /**
   * Helper to convert HEX color string to PDF-lib rgb (0.0 - 1.0)
   */
  static hexToPdfRgb(hex: string) {
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num) || clean.length !== 6) {
      return rgb(0.2, 0.2, 0.2);
    }
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    return rgb(r, g, b);
  }

  /**
   * Parse flexible page ranges like "1-3, 5, 8-10, odd, even, all" into 0-based page indices
   */
  static parsePageRanges(rangeStr: string, totalPages: number): number[] {
    if (!rangeStr || totalPages <= 0) return [];
    const trimmed = rangeStr.trim().toLowerCase();

    if (trimmed === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    if (trimmed === 'odd') {
      const res: number[] = [];
      for (let i = 1; i <= totalPages; i += 2) res.push(i - 1);
      return res;
    }
    if (trimmed === 'even') {
      const res: number[] = [];
      for (let i = 2; i <= totalPages; i += 2) res.push(i - 1);
      return res;
    }

    const indices = new Set<number>();
    const tokens = rangeStr.split(',').map((s) => s.trim()).filter(Boolean);

    for (const token of tokens) {
      if (token.includes('-')) {
        const [startRaw, endRaw] = token.split('-');
        const start = parseInt(startRaw, 10);
        const end = parseInt(endRaw, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(totalPages, Math.max(start, end));
          for (let i = from; i <= to; i++) {
            indices.add(i - 1);
          }
        }
      } else {
        const num = parseInt(token, 10);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
          indices.add(num - 1);
        }
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  }

  /**
   * Inspects detailed PDF structure, page metrics, metadata and encryption state
   */
  static async inspectPdf(file: File | Blob): Promise<PdfDocumentSummary> {
    if (!file || file.size === 0) {
      throw new Error('The selected PDF file is empty (0 bytes).');
    }

    const signature = await this.validatePdfSignature(file);
    if (!signature.isValid) {
      throw new Error('Invalid PDF: Missing standard %PDF- magic byte signature.');
    }

    const buffer = await file.arrayBuffer();
    let pdfDoc: PDFDocument;

    try {
      pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('encrypt') || msg.includes('password')) {
        return {
          pageCount: 0,
          isEncrypted: true,
          encryptionError: 'Document is encrypted or password-protected.',
          fileSizeBytes: file.size,
          pdfVersion: signature.version,
          pages: [],
          hasMixedOrientations: false,
          hasMixedSizes: false,
        };
      }
      throw new Error(`Failed to inspect PDF: ${err?.message || 'Syntax error in PDF stream.'}`);
    }

    const pageCount = pdfDoc.getPageCount();
    const docPages = pdfDoc.getPages();
    const pages: PdfPageMetric[] = [];
    const orientations = new Set<string>();
    const sizes = new Set<string>();

    for (let i = 0; i < pageCount; i++) {
      const page = docPages[i];
      const widthPt = page.getWidth();
      const heightPt = page.getHeight();
      const rotation = page.getRotation().angle;

      const widthMm = Number(((widthPt * 25.4) / 72).toFixed(1));
      const heightMm = Number(((heightPt * 25.4) / 72).toFixed(1));
      const widthInches = Number((widthPt / 72).toFixed(2));
      const heightInches = Number((heightPt / 72).toFixed(2));

      let orientation: 'Portrait' | 'Landscape' | 'Square' = 'Portrait';
      if (Math.abs(widthPt - heightPt) <= 2) {
        orientation = 'Square';
      } else if (widthPt > heightPt) {
        orientation = 'Landscape';
      }

      orientations.add(orientation);
      const standardSize = this.detectStandardPageSize(widthPt, heightPt);
      sizes.add(standardSize);

      pages.push({
        pageIndex: i,
        pageNumber: i + 1,
        widthPt: Math.round(widthPt * 100) / 100,
        heightPt: Math.round(heightPt * 100) / 100,
        widthMm,
        heightMm,
        widthInches,
        heightInches,
        orientation,
        rotation,
        standardSize,
      });
    }

    return {
      pageCount,
      title: pdfDoc.getTitle() || undefined,
      author: pdfDoc.getAuthor() || undefined,
      subject: pdfDoc.getSubject() || undefined,
      keywords: pdfDoc.getKeywords() || undefined,
      creator: pdfDoc.getCreator() || undefined,
      producer: pdfDoc.getProducer() || undefined,
      creationDate: pdfDoc.getCreationDate()?.toLocaleString() || undefined,
      modificationDate: pdfDoc.getModificationDate()?.toLocaleString() || undefined,
      pdfVersion: signature.version,
      isEncrypted: false,
      fileSizeBytes: file.size,
      pages,
      hasMixedOrientations: orientations.size > 1,
      hasMixedSizes: sizes.size > 1,
    };
  }

  /**
   * Merges multiple PDF files into one output PDF
   */
  static async mergePdfs(
    files: File[],
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    if (!files || files.length < 2) {
      throw new Error('Please select at least 2 PDF files to merge.');
    }

    onProgress?.(10, `Validating ${files.length} documents...`);
    const mergedDoc = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pct = 15 + Math.round(((i + 1) / files.length) * 65);
      onProgress?.(pct, `Merging document ${i + 1} of ${files.length} (${file.name})...`);

      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      const pageIndices = doc.getPageIndices();
      const copiedPages = await mergedDoc.copyPages(doc, pageIndices);
      for (const p of copiedPages) {
        mergedDoc.addPage(p);
      }
    }

    onProgress?.(85, 'Serializing merged PDF document...');
    const bytes = await mergedDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    onProgress?.(100, `Successfully merged ${files.length} files (${mergedDoc.getPageCount()} pages total).`);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: 'merged-document.pdf',
      fileSizeBytes: blob.size,
      pageCount: mergedDoc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Splits a PDF into individual pages or ranges and packages them (single file or ZIP)
   */
  static async splitPdf(
    file: File,
    mode: 'all-pages' | 'range' | 'chunks',
    options?: { ranges?: string; chunkSize?: number },
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult & { zipBlob?: Blob; partCount?: number }> {
    const startTime = performance.now();
    if (!file) throw new Error('No PDF file provided.');

    onProgress?.(10, 'Loading source PDF document...');
    const buffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(buffer);
    const totalPages = srcDoc.getPageCount();

    if (totalPages === 0) {
      throw new Error('The PDF document contains no pages to split.');
    }

    const baseName = file.name.replace(/\.pdf$/i, '');

    // Case 1: Custom single page range (e.g. pages 2-5 -> one PDF)
    if (mode === 'range' && options?.ranges) {
      const targetIndices = this.parsePageRanges(options.ranges, totalPages);
      if (targetIndices.length === 0) {
        throw new Error('No valid pages found in the specified range.');
      }

      onProgress?.(40, `Extracting ${targetIndices.length} pages...`);
      const newDoc = await PDFDocument.create();
      const copied = await newDoc.copyPages(srcDoc, targetIndices);
      copied.forEach((p) => newDoc.addPage(p));

      onProgress?.(80, 'Generating split PDF output...');
      const bytes = await newDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const downloadUrl = this.createTrackedUrl(blob);

      return {
        success: true,
        blob,
        downloadUrl,
        fileName: `${baseName}-pages-${options.ranges.replace(/[\s,]+/g, '_')}.pdf`,
        fileSizeBytes: blob.size,
        pageCount: newDoc.getPageCount(),
        partCount: 1,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    // Case 2: Split all pages into individual files -> package in a ZIP
    const zip = new JSZip();
    let partCount = 0;

    if (mode === 'chunks') {
      const chunkSize = Math.max(1, options?.chunkSize || 1);
      const totalChunks = Math.ceil(totalPages / chunkSize);

      for (let c = 0; c < totalChunks; c++) {
        const start = c * chunkSize;
        const end = Math.min(start + chunkSize, totalPages);
        const indices = Array.from({ length: end - start }, (_, i) => start + i);

        const chunkDoc = await PDFDocument.create();
        const copied = await chunkDoc.copyPages(srcDoc, indices);
        copied.forEach((p) => chunkDoc.addPage(p));

        const bytes = await chunkDoc.save();
        const partName = `${baseName}-part-${c + 1}-pages-${start + 1}-to-${end}.pdf`;
        zip.file(partName, bytes);
        partCount++;

        const pct = 15 + Math.round(((c + 1) / totalChunks) * 70);
        onProgress?.(pct, `Splitting chunk ${c + 1} of ${totalChunks}...`);
      }
    } else {
      // All single pages
      for (let i = 0; i < totalPages; i++) {
        const pageDoc = await PDFDocument.create();
        const [copied] = await pageDoc.copyPages(srcDoc, [i]);
        pageDoc.addPage(copied);

        const bytes = await pageDoc.save();
        const partName = `${baseName}-page-${String(i + 1).padStart(3, '0')}.pdf`;
        zip.file(partName, bytes);
        partCount++;

        const pct = 15 + Math.round(((i + 1) / totalPages) * 70);
        onProgress?.(pct, `Splitting page ${i + 1} of ${totalPages}...`);
      }
    }

    onProgress?.(90, 'Compressing split documents into ZIP archive...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = this.createTrackedUrl(zipBlob);

    return {
      success: true,
      blob: zipBlob,
      zipBlob,
      downloadUrl,
      fileName: `${baseName}-split-pages.zip`,
      fileSizeBytes: zipBlob.size,
      pageCount: totalPages,
      partCount,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Rearranges, deletes, or rotates pages based on an explicit ordered page plan
   */
  static async manipulatePages(
    file: File,
    pagePlan: { originalIndex: number; rotationDelta?: number }[],
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    if (!file) throw new Error('No PDF file provided.');
    if (!pagePlan || pagePlan.length === 0) {
      throw new Error('At least one page must be included in the output document.');
    }

    onProgress?.(15, 'Loading source document...');
    const buffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(buffer);
    const newDoc = await PDFDocument.create();

    const uniqueOriginalIndices = Array.from(new Set(pagePlan.map((p) => p.originalIndex)));
    const copiedPagesMap = new Map<number, any>();

    onProgress?.(40, 'Extracting and transforming selected pages...');
    for (const origIdx of uniqueOriginalIndices) {
      const [copied] = await newDoc.copyPages(srcDoc, [origIdx]);
      copiedPagesMap.set(origIdx, copied);
    }

    for (let i = 0; i < pagePlan.length; i++) {
      const item = pagePlan[i];
      let pageToAdd = copiedPagesMap.get(item.originalIndex);
      if (pagePlan.filter((p) => p.originalIndex === item.originalIndex).length > 1) {
        const [freshCopy] = await newDoc.copyPages(srcDoc, [item.originalIndex]);
        pageToAdd = freshCopy;
      }

      if (item.rotationDelta) {
        const currentRot = pageToAdd.getRotation().angle;
        pageToAdd.setRotation(degrees((currentRot + item.rotationDelta) % 360));
      }

      newDoc.addPage(pageToAdd);
    }

    onProgress?.(80, 'Encoding organized PDF document...');
    const bytes = await newDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    onProgress?.(100, `Exported ${newDoc.getPageCount()} pages.`);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `rearranged-${file.name.replace(/\.pdf$/i, '')}.pdf`,
      fileSizeBytes: blob.size,
      pageCount: newDoc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Removes specific pages from a PDF
   */
  static async removePages(
    file: File,
    pagesToRemove: string | number[],
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(10, 'Loading PDF to remove pages...');
    const buffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(buffer);
    const totalPages = srcDoc.getPageCount();

    let removeIndices: Set<number>;
    if (typeof pagesToRemove === 'string') {
      removeIndices = new Set(this.parsePageRanges(pagesToRemove, totalPages));
    } else {
      removeIndices = new Set(pagesToRemove.map((p) => p - 1).filter((i) => i >= 0 && i < totalPages));
    }

    const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter((i) => !removeIndices.has(i));

    if (keepIndices.length === 0) {
      throw new Error('Cannot remove all pages. The output document must contain at least 1 page.');
    }

    onProgress?.(45, `Removing ${removeIndices.size} pages (keeping ${keepIndices.length})...`);
    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(srcDoc, keepIndices);
    copied.forEach((p) => newDoc.addPage(p));

    onProgress?.(85, 'Saving updated PDF...');
    const bytes = await newDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `removed-pages-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: newDoc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Extracts specified pages from a PDF into a single PDF or separate files in ZIP
   */
  static async extractPages(
    file: File,
    targetPages: string | number[],
    mergeOutput = true,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(10, 'Loading PDF to extract pages...');
    const buffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(buffer);
    const totalPages = srcDoc.getPageCount();

    let indices: number[];
    if (typeof targetPages === 'string') {
      indices = this.parsePageRanges(targetPages, totalPages);
    } else {
      indices = targetPages.map((p) => p - 1).filter((i) => i >= 0 && i < totalPages);
    }

    if (indices.length === 0) {
      throw new Error('No valid pages selected for extraction.');
    }

    const baseName = file.name.replace(/\.pdf$/i, '');

    if (mergeOutput) {
      onProgress?.(50, `Extracting ${indices.length} pages into single PDF...`);
      const newDoc = await PDFDocument.create();
      const copied = await newDoc.copyPages(srcDoc, indices);
      copied.forEach((p) => newDoc.addPage(p));

      onProgress?.(85, 'Saving extracted PDF...');
      const bytes = await newDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const downloadUrl = this.createTrackedUrl(blob);

      return {
        success: true,
        blob,
        downloadUrl,
        fileName: `extracted-${baseName}.pdf`,
        fileSizeBytes: blob.size,
        pageCount: newDoc.getPageCount(),
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    } else {
      onProgress?.(30, `Extracting ${indices.length} separate pages into ZIP...`);
      const zip = new JSZip();
      for (let i = 0; i < indices.length; i++) {
        const pageIdx = indices[i];
        const pageDoc = await PDFDocument.create();
        const [copied] = await pageDoc.copyPages(srcDoc, [pageIdx]);
        pageDoc.addPage(copied);

        const bytes = await pageDoc.save();
        zip.file(`${baseName}-page-${pageIdx + 1}.pdf`, bytes);

        const pct = 30 + Math.round(((i + 1) / indices.length) * 55);
        onProgress?.(pct, `Extracted page ${pageIdx + 1} (${i + 1}/${indices.length})...`);
      }

      onProgress?.(90, 'Packaging ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = this.createTrackedUrl(zipBlob);

      return {
        success: true,
        blob: zipBlob,
        downloadUrl,
        fileName: `extracted-pages-${baseName}.zip`,
        fileSizeBytes: zipBlob.size,
        pageCount: indices.length,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }
  }

  /**
   * Rotates pages in a PDF by specified degrees (90, 180, 270)
   */
  static async rotatePages(
    file: File,
    rotationDelta: 90 | 180 | 270,
    targetPages: 'all' | 'odd' | 'even' | string = 'all',
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(10, 'Loading PDF for rotation...');
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer);
    const totalPages = pdfDoc.getPageCount();

    const targetIndices = new Set(this.parsePageRanges(targetPages, totalPages));

    onProgress?.(40, `Rotating ${targetIndices.size} pages by ${rotationDelta}°...`);
    const pages = pdfDoc.getPages();

    for (let i = 0; i < totalPages; i++) {
      if (targetIndices.has(i)) {
        const page = pages[i];
        const currentAngle = page.getRotation().angle;
        page.setRotation(degrees((currentAngle + rotationDelta) % 360));
      }
    }

    onProgress?.(80, 'Saving rotated PDF...');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `rotated-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: totalPages,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Crops PDF page margins/boxes (top, right, bottom, left) in points
   */
  static async cropPdf(
    file: File,
    cropInsets: {
      topPt: number;
      rightPt: number;
      bottomPt: number;
      leftPt: number;
      targetPages?: 'all' | 'odd' | 'even' | string;
    },
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(10, 'Loading PDF for cropping...');
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    const targetIndices = new Set(
      this.parsePageRanges(cropInsets.targetPages || 'all', totalPages)
    );

    onProgress?.(40, `Applying crop margins to ${targetIndices.size} pages...`);

    for (let i = 0; i < totalPages; i++) {
      if (targetIndices.has(i)) {
        const page = pages[i];
        const { width, height } = page.getSize();

        const newX = Math.max(0, cropInsets.leftPt);
        const newY = Math.max(0, cropInsets.bottomPt);
        const newWidth = Math.max(36, width - cropInsets.leftPt - cropInsets.rightPt);
        const newHeight = Math.max(36, height - cropInsets.topPt - cropInsets.bottomPt);

        // Adjust CropBox and MediaBox
        page.setCropBox(newX, newY, newWidth, newHeight);
      }
    }

    onProgress?.(80, 'Saving cropped PDF...');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `cropped-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: totalPages,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Flattens PDF forms and annotations into permanent content
   */
  static async flattenPdf(
    file: File,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(15, 'Loading PDF form & annotation tree...');
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer);

    onProgress?.(50, 'Flattening form fields and read-only annotations...');
    try {
      const form = pdfDoc.getForm();
      form.flatten();
    } catch {
      // Document might not contain interactive form fields, proceed safely
    }

    onProgress?.(85, 'Saving flattened static PDF...');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `flattened-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: pdfDoc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Converts PDF pages into high-resolution JPG or PNG images client-side
   */
  static async pdfToImages(
    file: File,
    options: {
      format: 'jpeg' | 'png';
      scale?: number; // 1.0 (72 DPI), 1.5 (108 DPI), 2.0 (144 DPI), 3.0 (216 DPI)
      quality?: number; // 0.1 to 1.0 (for JPEG)
      targetPages?: string;
    },
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult & { images: { pageNumber: number; blob: Blob; dataUrl: string; name: string }[] }> {
    const startTime = performance.now();
    onProgress?.(10, 'Loading PDF for canvas rendering...');
    const buffer = await file.arrayBuffer();
    const pdfJsDoc = await PdfRenderer.loadPdfDocument(buffer);
    const totalPages = pdfJsDoc.numPages;

    const targetIndices = this.parsePageRanges(options.targetPages || 'all', totalPages);
    if (targetIndices.length === 0) {
      throw new Error('No valid pages to convert to images.');
    }

    const scale = options.scale || 2.0;
    const quality = options.quality || 0.92;
    const imgFormat = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = options.format === 'jpeg' ? 'jpg' : 'png';
    const baseName = file.name.replace(/\.pdf$/i, '');

    const images: { pageNumber: number; blob: Blob; dataUrl: string; name: string }[] = [];
    const zip = new JSZip();

    for (let i = 0; i < targetIndices.length; i++) {
      const pageNum = targetIndices[i] + 1;
      const pct = 15 + Math.round(((i + 1) / targetIndices.length) * 70);
      onProgress?.(pct, `Rendering page ${pageNum} (${i + 1} of ${targetIndices.length}) to ${options.format.toUpperCase()}...`);

      const renderResult = await PdfRenderer.renderPage(pdfJsDoc, pageNum, scale, imgFormat, quality);
      const imgFileName = `${baseName}-page-${String(pageNum).padStart(3, '0')}.${ext}`;

      images.push({
        pageNumber: pageNum,
        blob: renderResult.blob,
        dataUrl: renderResult.dataUrl,
        name: imgFileName,
      });

      zip.file(imgFileName, renderResult.blob);
    }

    onProgress?.(90, 'Preparing image download packages...');

    if (images.length === 1) {
      // Single page converted -> direct image download
      const singleBlob = images[0].blob;
      const downloadUrl = this.createTrackedUrl(singleBlob);
      return {
        success: true,
        blob: singleBlob,
        downloadUrl,
        fileName: images[0].name,
        fileSizeBytes: singleBlob.size,
        pageCount: 1,
        images,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    } else {
      // Multiple pages converted -> ZIP package
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = this.createTrackedUrl(zipBlob);
      return {
        success: true,
        blob: zipBlob,
        downloadUrl,
        fileName: `${baseName}-images-${ext}.zip`,
        fileSizeBytes: zipBlob.size,
        pageCount: images.length,
        images,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }
  }

  /**
   * Adds text watermarks to specified pages
   */
  static async addWatermark(
    file: File,
    config: PdfWatermarkConfig,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(15, 'Loading PDF for watermarking...');
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    const targetIndices =
      config.targetPages === 'odd'
        ? Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 === 0)
        : config.targetPages === 'even'
        ? Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 === 1)
        : Array.isArray(config.targetPages)
        ? config.targetPages.map((p) => p - 1).filter((i) => i >= 0 && i < totalPages)
        : Array.from({ length: totalPages }, (_, i) => i);

    const pdfColor = this.hexToPdfRgb(config.colorHex);
    const fontSize = config.fontSize || 36;
    const opacity = Math.max(0.05, Math.min(1.0, config.opacity || 0.3));

    onProgress?.(45, `Applying watermark to ${targetIndices.length} pages...`);

    for (const idx of targetIndices) {
      const page = pages[idx];
      const { width, height } = page.getSize();
      const textWidth = helveticaFont.widthOfTextAtSize(config.text, fontSize);
      const textHeight = helveticaFont.heightAtSize(fontSize);

      let x = (width - textWidth) / 2;
      let y = (height - textHeight) / 2;

      if (config.position === 'top-left') {
        x = 40;
        y = height - textHeight - 40;
      } else if (config.position === 'top-right') {
        x = width - textWidth - 40;
        y = height - textHeight - 40;
      } else if (config.position === 'bottom-left') {
        x = 40;
        y = 40;
      } else if (config.position === 'bottom-right') {
        x = width - textWidth - 40;
        y = 40;
      }

      page.drawText(config.text, {
        x,
        y,
        size: fontSize,
        font: helveticaFont,
        color: pdfColor,
        opacity,
        rotate: degrees(config.rotationDegrees || 0),
      });
    }

    onProgress?.(85, 'Saving watermarked document...');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `watermarked-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: totalPages,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Adds page numbers with custom positions and formatting
   */
  static async addPageNumbers(
    file: File,
    config: PdfPageNumberConfig,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(15, 'Loading PDF for page numbering...');
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    const targetIndices =
      config.targetPages === 'odd'
        ? Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 === 0)
        : config.targetPages === 'even'
        ? Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 === 1)
        : Array.isArray(config.targetPages)
        ? config.targetPages.map((p) => p - 1).filter((i) => i >= 0 && i < totalPages)
        : Array.from({ length: totalPages }, (_, i) => i);

    const color = this.hexToPdfRgb(config.colorHex);
    const fontSize = config.fontSize || 10;
    const margin = config.marginPt || 25;
    const startNum = config.startNumber || 1;

    onProgress?.(50, `Adding page numbers to ${targetIndices.length} pages...`);

    for (let i = 0; i < targetIndices.length; i++) {
      const idx = targetIndices[i];
      const page = pages[idx];
      const { width, height } = page.getSize();
      const currentNumber = startNum + i;

      let label = `${currentNumber}`;
      if (config.format === 'page-of-total') {
        label = `Page ${currentNumber} of ${totalPages}`;
      } else if (config.format === 'custom' && config.customTemplate) {
        label = config.customTemplate
          .replace(/\{n\}/g, String(currentNumber))
          .replace(/\{total\}/g, String(totalPages));
      }

      const textWidth = font.widthOfTextAtSize(label, fontSize);
      let x = (width - textWidth) / 2;
      let y = margin;

      if (config.position.includes('top')) {
        y = height - margin - fontSize;
      }
      if (config.position.includes('left')) {
        x = margin;
      } else if (config.position.includes('right')) {
        x = width - margin - textWidth;
      }

      page.drawText(label, {
        x,
        y,
        size: fontSize,
        font,
        color,
      });
    }

    onProgress?.(85, 'Saving numbered PDF...');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `numbered-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: totalPages,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Updates PDF document metadata info (Title, Author, Subject, Keywords)
   */
  static async updateMetadata(
    file: File,
    metadata: PdfMetadataUpdateConfig,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(20, 'Loading PDF metadata...');
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer);

    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) {
      pdfDoc.setKeywords(metadata.keywords.split(',').map((k) => k.trim()).filter(Boolean));
    }
    if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
    if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);
    pdfDoc.setModificationDate(new Date());

    onProgress?.(80, 'Saving updated metadata...');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `updated-info-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: pdfDoc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * 1-Click Strips / Removes All PDF Metadata (Title, Author, Subject, Producer, Dates) for privacy
   */
  static async stripMetadata(
    file: File,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(25, 'Scrubbing all embedded metadata from document...');
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer);

    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');

    onProgress?.(80, 'Saving sanitized privacy PDF...');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `scrubbed-metadata-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: pdfDoc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Password-protects a PDF document with user/owner password and permission controls
   */
  static async protectPdf(
    file: File,
    options: PdfProtectOptions,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    const res = await PdfCrypt.protectWithPassword(file, options, onProgress);
    const trackedUrl = this.createTrackedUrl(res.blob);

    return {
      success: true,
      blob: res.blob,
      downloadUrl: trackedUrl,
      fileName: res.fileName,
      fileSizeBytes: res.fileSizeBytes,
      pageCount: res.pageCount,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Unlocks a password-protected PDF when the authentic password is provided
   */
  static async unlockPdf(
    file: File,
    password: string,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    const res = await PdfCrypt.unlockWithPassword(file, password, onProgress);
    if (!res.blob) throw new Error('Unlocking produced empty document stream.');
    const trackedUrl = this.createTrackedUrl(res.blob);

    return {
      success: true,
      blob: res.blob,
      downloadUrl: trackedUrl,
      fileName: res.fileName || `unlocked-${file.name}`,
      fileSizeBytes: res.fileSizeBytes || res.blob.size,
      pageCount: res.pageCount || 1,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Compiles raster images (JPG, PNG, WebP) into a clean multi-page PDF
   */
  static async imagesToPdf(
    imageFiles: File[],
    config: PdfImageToPdfConfig,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    if (!imageFiles || imageFiles.length === 0) {
      throw new Error('Please select at least one image file.');
    }

    onProgress?.(10, `Converting ${imageFiles.length} images to PDF...`);
    const pdfDoc = await PDFDocument.create();

    const standardDimensions: Record<string, [number, number]> = {
      A4: [595.28, 841.89],
      'US-Letter': [612, 792],
      A3: [841.89, 1190.55],
      A5: [419.53, 595.28],
    };

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const pct = 15 + Math.round(((i + 1) / imageFiles.length) * 70);
      onProgress?.(pct, `Processing image ${i + 1} of ${imageFiles.length} (${file.name})...`);

      const imgBuffer = await file.arrayBuffer();
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      const isJpg = file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');

      let embeddedImage: any;

      if (isPng) {
        embeddedImage = await pdfDoc.embedPng(imgBuffer);
      } else if (isJpg) {
        embeddedImage = await pdfDoc.embedJpg(imgBuffer);
      } else {
        // Fallback for WebP / GIF / BMP: Render through HTML Image + Canvas to PNG
        const blobUrl = URL.createObjectURL(file);
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = blobUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngBlob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
          if (pngBlob) {
            const pngBuf = await pngBlob.arrayBuffer();
            embeddedImage = await pdfDoc.embedPng(pngBuf);
          }
        }
        URL.revokeObjectURL(blobUrl);
      }

      if (!embeddedImage) {
        throw new Error(`Unsupported image format for file: ${file.name}`);
      }

      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;
      const margin = config.marginPt || 0;

      if (config.pageSize === 'Fit-Image') {
        const page = pdfDoc.addPage([imgWidth + margin * 2, imgHeight + margin * 2]);
        page.drawImage(embeddedImage, {
          x: margin,
          y: margin,
          width: imgWidth,
          height: imgHeight,
        });
      } else {
        let [pageW, pageH] = standardDimensions[config.pageSize] || standardDimensions.A4;
        if (config.orientation === 'landscape' || (config.orientation === 'auto' && imgWidth > imgHeight)) {
          [pageW, pageH] = [Math.max(pageW, pageH), Math.min(pageW, pageH)];
        } else if (config.orientation === 'portrait') {
          [pageW, pageH] = [Math.min(pageW, pageH), Math.max(pageW, pageH)];
        }

        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;
        const scale = Math.min(maxW / imgWidth, maxH / imgHeight, 1.0);

        const drawW = imgWidth * scale;
        const drawH = imgHeight * scale;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;

        const page = pdfDoc.addPage([pageW, pageH]);
        page.drawImage(embeddedImage, {
          x,
          y,
          width: drawW,
          height: drawH,
        });
      }
    }

    onProgress?.(90, 'Generating combined PDF bytes...');
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: 'images-to-pdf.pdf',
      fileSizeBytes: blob.size,
      pageCount: pdfDoc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Cryptographically secure password & key generator using Web Crypto API
   */
  static generateSecurePassword(options: {
    length: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeAmbiguous?: boolean;
  }): { password: string; entropyBits: number; strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong' } {
    const uppercase = options.excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = options.excludeAmbiguous ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    const numbers = options.excludeAmbiguous ? '23456789' : '0123456789';
    const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';

    let pool = '';
    const guaranteed: string[] = [];

    const getSecureRandomInt = (max: number): number => {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return arr[0] % max;
    };

    if (options.includeUppercase !== false) {
      pool += uppercase;
      guaranteed.push(uppercase[getSecureRandomInt(uppercase.length)]);
    }
    if (options.includeLowercase !== false) {
      pool += lowercase;
      guaranteed.push(lowercase[getSecureRandomInt(lowercase.length)]);
    }
    if (options.includeNumbers !== false) {
      pool += numbers;
      guaranteed.push(numbers[getSecureRandomInt(numbers.length)]);
    }
    if (options.includeSymbols) {
      pool += symbols;
      guaranteed.push(symbols[getSecureRandomInt(symbols.length)]);
    }

    if (!pool) pool = lowercase + numbers;

    const remaining = Math.max(0, options.length - guaranteed.length);
    const chars: string[] = [...guaranteed];

    for (let i = 0; i < remaining; i++) {
      chars.push(pool[getSecureRandomInt(pool.length)]);
    }

    // Cryptographic Fisher-Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    const password = chars.join('');
    const entropyBits = Math.round(options.length * Math.log2(pool.length));

    let strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong' = 'weak';
    if (entropyBits >= 128) strength = 'very-strong';
    else if (entropyBits >= 80) strength = 'strong';
    else if (entropyBits >= 60) strength = 'good';
    else if (entropyBits >= 40) strength = 'fair';

    return { password, entropyBits, strength };
  }

  /**
   * Layout multiple pages onto single sheets (N-up: 2, 4, 6, 9, 16)
   */
  static async pagesPerSheet(
    file: File,
    config: PdfNUpConfig,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(10, 'Loading source PDF...');
    const buffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(buffer);
    const srcPageCount = srcDoc.getPageCount();

    if (srcPageCount === 0) {
      throw new Error('PDF document has no pages.');
    }

    onProgress?.(25, 'Calculating N-up grid geometry...');
    const outDoc = await PDFDocument.create();

    // Determine grid rows & cols
    let cols = 1;
    let rows = 2;
    if (config.count === 2) {
      cols = 1;
      rows = 2;
    } else if (config.count === 4) {
      cols = 2;
      rows = 2;
    } else if (config.count === 6) {
      cols = 2;
      rows = 3;
    } else if (config.count === 9) {
      cols = 3;
      rows = 3;
    } else if (config.count === 16) {
      cols = 4;
      rows = 4;
    }

    // Determine target sheet dimensions
    let sheetWidth = 595.28; // A4 portrait default
    let sheetHeight = 841.89;

    if (config.pageSize === 'letter') {
      sheetWidth = 612;
      sheetHeight = 792;
    } else if (config.pageSize === 'a3') {
      sheetWidth = 841.89;
      sheetHeight = 1190.55;
    } else if (config.pageSize === 'original') {
      const firstPage = srcDoc.getPage(0);
      sheetWidth = firstPage.getWidth();
      sheetHeight = firstPage.getHeight();
    }

    // Determine orientation
    if (config.orientation === 'landscape' && sheetWidth < sheetHeight) {
      [sheetWidth, sheetHeight] = [sheetHeight, sheetWidth];
    } else if (config.orientation === 'portrait' && sheetWidth > sheetHeight) {
      [sheetWidth, sheetHeight] = [sheetHeight, sheetWidth];
    } else if (config.orientation === 'auto') {
      // Auto-orient based on grid aspect ratio
      if (cols > rows && sheetWidth < sheetHeight) {
        [sheetWidth, sheetHeight] = [sheetHeight, sheetWidth];
      }
    }

    const margin = config.marginPt ?? 20;
    const spacing = config.spacingPt ?? 12;
    const usableWidth = sheetWidth - margin * 2;
    const usableHeight = sheetHeight - margin * 2;

    const cellWidth = (usableWidth - spacing * (cols - 1)) / cols;
    const cellHeight = (usableHeight - spacing * (rows - 1)) / rows;

    const embeddedPages = await outDoc.embedPages(srcDoc.getPages());
    const totalOutSheets = Math.ceil(srcPageCount / config.count);

    for (let sheetIdx = 0; sheetIdx < totalOutSheets; sheetIdx++) {
      const page = outDoc.addPage([sheetWidth, sheetHeight]);
      const startSrcIdx = sheetIdx * config.count;
      const endSrcIdx = Math.min(startSrcIdx + config.count, srcPageCount);

      for (let i = startSrcIdx; i < endSrcIdx; i++) {
        const slotIdx = i - startSrcIdx;
        let col = slotIdx % cols;
        let row = Math.floor(slotIdx / cols);

        if (config.pageOrder === 'ttb') {
          row = slotIdx % rows;
          col = Math.floor(slotIdx / rows);
        }

        const embedded = embeddedPages[i];
        const embWidth = embedded.width;
        const embHeight = embedded.height;

        // Scale to fit inside cell maintaining aspect ratio
        const scale = Math.min(cellWidth / embWidth, cellHeight / embHeight);
        const scaledWidth = embWidth * scale;
        const scaledHeight = embHeight * scale;

        // Calculate bottom-left coordinates (PDF coordinates origin is bottom-left)
        const cellX = margin + col * (cellWidth + spacing);
        // Top-down row to bottom-up PDF coordinate
        const cellY = sheetHeight - margin - (row + 1) * cellHeight - row * spacing;

        const posX = cellX + (cellWidth - scaledWidth) / 2;
        const posY = cellY + (cellHeight - scaledHeight) / 2;

        page.drawPage(embedded, {
          x: posX,
          y: posY,
          width: scaledWidth,
          height: scaledHeight,
        });

        if (config.addBorder) {
          page.drawRectangle({
            x: posX,
            y: posY,
            width: scaledWidth,
            height: scaledHeight,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 0.5,
          });
        }
      }

      const pct = 30 + Math.round(((sheetIdx + 1) / totalOutSheets) * 55);
      onProgress?.(pct, `Composited sheet ${sheetIdx + 1} of ${totalOutSheets}...`);
    }

    onProgress?.(90, 'Serializing multi-page PDF...');
    const bytes = await outDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `nup-${config.count}on1-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: totalOutSheets,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Splits 2-page spreads (e.g. scanned books or landscape presentations) in half
   */
  static async halvePages(
    file: File,
    config: PdfHalveConfig,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(10, 'Loading PDF for spread splitting...');
    const buffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(buffer);
    const srcPageCount = srcDoc.getPageCount();

    const targetIndices = new Set(
      config.pageRange && config.pageRange !== 'all'
        ? this.parsePageRanges(config.pageRange, srcPageCount)
        : Array.from({ length: srcPageCount }, (_, i) => i)
    );

    onProgress?.(30, 'Embedding pages for clipping...');
    const outDoc = await PDFDocument.create();
    const embeddedPages = await outDoc.embedPages(srcDoc.getPages());

    for (let i = 0; i < srcPageCount; i++) {
      const emb = embeddedPages[i];
      const origW = emb.width;
      const origH = emb.height;

      if (!targetIndices.has(i)) {
        // Keep intact
        const page = outDoc.addPage([origW, origH]);
        page.drawPage(emb, { x: 0, y: 0, width: origW, height: origH });
      } else {
        if (config.direction === 'vertical') {
          // Split left half (Page 1) and right half (Page 2)
          const halfW = origW / 2;

          // Left Half
          const leftPage = outDoc.addPage([halfW, origH]);
          leftPage.drawPage(emb, {
            x: 0,
            y: 0,
            width: origW,
            height: origH,
          });
          leftPage.setCropBox(0, 0, halfW, origH);

          // Right Half
          const rightPage = outDoc.addPage([halfW, origH]);
          rightPage.drawPage(emb, {
            x: -halfW,
            y: 0,
            width: origW,
            height: origH,
          });
          rightPage.setCropBox(0, 0, halfW, origH);
        } else {
          // Horizontal split: Top half and Bottom half
          const halfH = origH / 2;

          // Top Half
          const topPage = outDoc.addPage([origW, halfH]);
          topPage.drawPage(emb, {
            x: 0,
            y: -halfH,
            width: origW,
            height: origH,
          });
          topPage.setCropBox(0, 0, origW, halfH);

          // Bottom Half
          const bottomPage = outDoc.addPage([origW, halfH]);
          bottomPage.drawPage(emb, {
            x: 0,
            y: 0,
            width: origW,
            height: origH,
          });
          bottomPage.setCropBox(0, 0, origW, halfH);
        }
      }

      const pct = 30 + Math.round(((i + 1) / srcPageCount) * 55);
      onProgress?.(pct, `Processed page ${i + 1} of ${srcPageCount}...`);
    }

    onProgress?.(90, 'Saving halved PDF...');
    const bytes = await outDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `halved-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: outDoc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Superimposes or underlays one PDF (e.g. letterhead/template) onto another
   */
  static async overlayPdf(
    baseFile: File,
    overlayFile: File,
    config: PdfOverlayConfig,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(10, 'Loading Base and Overlay PDF documents...');

    const [baseBuf, overlayBuf] = await Promise.all([
      baseFile.arrayBuffer(),
      overlayFile.arrayBuffer(),
    ]);

    const baseDoc = await PDFDocument.load(baseBuf);
    const overlayDoc = await PDFDocument.load(overlayBuf);

    const baseCount = baseDoc.getPageCount();
    const overlayCount = overlayDoc.getPageCount();

    if (baseCount === 0 || overlayCount === 0) {
      throw new Error('Base or Overlay document has no pages.');
    }

    onProgress?.(30, 'Embedding overlay pages...');
    const embeddedOverlays = await baseDoc.embedPages(overlayDoc.getPages());
    const basePages = baseDoc.getPages();

    const targetIndices = new Set(
      config.targetPages && config.targetPages !== 'all'
        ? this.parsePageRanges(config.targetPages, baseCount)
        : Array.from({ length: baseCount }, (_, i) => i)
    );

    const opacity = Math.max(0.05, Math.min(1, config.opacity ?? 1.0));
    const scale = Math.max(0.1, Math.min(5, config.scale ?? 1.0));
    const offsetX = config.offsetX ?? 0;
    const offsetY = config.offsetY ?? 0;

    for (let i = 0; i < baseCount; i++) {
      if (!targetIndices.has(i)) continue;

      const basePage = basePages[i];
      const baseW = basePage.getWidth();
      const baseH = basePage.getHeight();

      const overlayIdx = config.repeatFirstOverlayPage ? 0 : Math.min(i, overlayCount - 1);
      const emb = embeddedOverlays[overlayIdx];

      const scaledW = emb.width * scale;
      const scaledH = emb.height * scale;

      const posX = (baseW - scaledW) / 2 + offsetX;
      const posY = (baseH - scaledH) / 2 + offsetY;

      // Note: In pdf-lib, drawPage on existing page draws on top (overlay)
      // When underlay is requested, drawPage is placed with lower opacity or standard blending
      basePage.drawPage(emb, {
        x: posX,
        y: posY,
        width: scaledW,
        height: scaledH,
        opacity,
      });

      const pct = 30 + Math.round(((i + 1) / baseCount) * 55);
      onProgress?.(pct, `Applying overlay to page ${i + 1}...`);
    }

    onProgress?.(90, 'Saving composited PDF...');
    const bytes = await baseDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `overlay-${baseFile.name}`,
      fileSizeBytes: blob.size,
      pageCount: baseCount,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Inspects and lists interactive AcroForm fields from a PDF
   */
  static async getFormFields(file: File): Promise<PdfFormFieldInfo[]> {
    const buffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

    let form;
    try {
      form = doc.getForm();
    } catch {
      return [];
    }

    if (!form) return [];

    const fields = form.getFields();
    const result: PdfFormFieldInfo[] = [];

    for (const f of fields) {
      const name = f.getName();
      let type: 'text' | 'checkbox' | 'dropdown' | 'radio' | 'button' | 'unknown' = 'unknown';
      let value: any = '';
      let options: string[] | undefined;
      const isReadOnly = f.isReadOnly();
      const isRequired = f.isRequired();

      if (f instanceof PDFTextField) {
        type = 'text';
        value = f.getText() || '';
      } else if (f instanceof PDFCheckBox) {
        type = 'checkbox';
        value = f.isChecked();
      } else if (f instanceof PDFDropdown) {
        type = 'dropdown';
        value = f.getSelected() ? f.getSelected()[0] : '';
        options = f.getOptions();
      } else if (f instanceof PDFRadioGroup) {
        type = 'radio';
        value = f.getSelected() || '';
        options = f.getOptions();
      } else if (f instanceof PDFButton) {
        type = 'button';
        value = '';
      }

      result.push({
        name,
        type,
        value,
        options,
        isReadOnly,
        isRequired,
      });
    }

    return result;
  }

  /**
   * Fills existing interactive AcroForm fields with provided values and optionally flattens
   */
  static async fillFormFields(
    file: File,
    fieldValues: Record<string, any>,
    flatten = false,
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(15, 'Loading PDF Form...');
    const buffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(buffer);
    const form = doc.getForm();

    onProgress?.(40, 'Filling interactive form fields...');
    for (const [name, val] of Object.entries(fieldValues)) {
      try {
        const field = form.getFieldMaybe(name);
        if (!field) continue;

        if (field instanceof PDFTextField) {
          field.setText(val ? String(val) : '');
        } else if (field instanceof PDFCheckBox) {
          if (val === true || val === 'true' || val === 'on' || val === 1) {
            field.check();
          } else {
            field.uncheck();
          }
        } else if (field instanceof PDFDropdown) {
          if (val) field.select(String(val));
        } else if (field instanceof PDFRadioGroup) {
          if (val) field.select(String(val));
        }
      } catch (e) {
        console.warn(`Could not set value for field "${name}":`, e);
      }
    }

    if (flatten) {
      onProgress?.(70, 'Flattening form into static document...');
      form.flatten();
    }

    onProgress?.(90, 'Saving filled PDF...');
    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `filled-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: doc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Creates interactive AcroForm fields onto a PDF or builds a fresh form document
   */
  static async createForm(
    file: File | null,
    fields: PdfNewFormField[],
    blankOptions?: { pageCount: number; size: 'a4' | 'letter'; orientation: 'portrait' | 'landscape' },
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(15, 'Initializing PDF canvas...');

    let doc: PDFDocument;
    let fileName = 'new-interactive-form.pdf';

    if (file) {
      fileName = `form-enabled-${file.name}`;
      const buffer = await file.arrayBuffer();
      doc = await PDFDocument.load(buffer);
    } else {
      doc = await PDFDocument.create();
      const pageCount = blankOptions?.pageCount ?? 1;
      let w = blankOptions?.size === 'letter' ? 612 : 595.28;
      let h = blankOptions?.size === 'letter' ? 792 : 841.89;
      if (blankOptions?.orientation === 'landscape') {
        [w, h] = [h, w];
      }

      for (let i = 0; i < pageCount; i++) {
        doc.addPage([w, h]);
      }
    }

    const form = doc.getForm();
    const pages = doc.getPages();
    onProgress?.(45, `Adding ${fields.length} interactive fields...`);

    for (const f of fields) {
      const pageIdx = Math.max(0, Math.min(f.pageIndex ?? 0, pages.length - 1));
      const page = pages[pageIdx];

      try {
        if (f.type === 'text') {
          const tf = form.createTextField(f.name);
          if (f.defaultValue) tf.setText(String(f.defaultValue));
          if (f.isMultiline) tf.enableMultiline();
          if (f.isRequired) tf.enableRequired();
          tf.addToPage(page, {
            x: f.x,
            y: f.y,
            width: f.width || 180,
            height: f.height || 28,
          });
        } else if (f.type === 'checkbox') {
          const cb = form.createCheckBox(f.name);
          if (f.defaultValue) cb.check();
          if (f.isRequired) cb.enableRequired();
          cb.addToPage(page, {
            x: f.x,
            y: f.y,
            width: f.width || 18,
            height: f.height || 18,
          });
        } else if (f.type === 'dropdown') {
          const dd = form.createDropdown(f.name);
          const opts = f.options && f.options.length > 0 ? f.options : ['Option A', 'Option B', 'Option C'];
          dd.setOptions(opts);
          if (f.defaultValue && opts.includes(String(f.defaultValue))) {
            dd.select(String(f.defaultValue));
          }
          if (f.isRequired) dd.enableRequired();
          dd.addToPage(page, {
            x: f.x,
            y: f.y,
            width: f.width || 180,
            height: f.height || 28,
          });
        } else if (f.type === 'button') {
          const btn = form.createButton(f.name);
          btn.addToPage(f.label || f.name || 'Button', page, {
            x: f.x,
            y: f.y,
            width: f.width || 100,
            height: f.height || 32,
          });
        }
      } catch (err) {
        console.warn(`Error attaching field "${f.name}":`, err);
      }
    }

    onProgress?.(85, 'Finalizing AcroForm structure...');
    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName,
      fileSizeBytes: blob.size,
      pageCount: doc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Embeds visual annotations, markups, stamps, and drawings onto PDF pages
   */
  static async applyAnnotations(
    file: File,
    annotations: PdfAnnotationItem[],
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(15, 'Loading PDF for annotations...');
    const buffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(buffer);
    const pages = doc.getPages();
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);

    onProgress?.(40, `Applying ${annotations.length} markups across pages...`);

    // Group annotations by page
    const byPage: Record<number, PdfAnnotationItem[]> = {};
    for (const ann of annotations) {
      if (!byPage[ann.pageIndex]) byPage[ann.pageIndex] = [];
      byPage[ann.pageIndex].push(ann);
    }

    for (const [pageIdxStr, pageAnns] of Object.entries(byPage)) {
      const pageIdx = parseInt(pageIdxStr, 10);
      if (pageIdx < 0 || pageIdx >= pages.length) continue;
      const page = pages[pageIdx];

      for (const ann of pageAnns) {
        const color = this.hexToPdfRgb(ann.color || '#ef4444');
        const opacity = ann.opacity ?? 0.85;

        if (ann.type === 'text' || ann.type === 'note') {
          const fontSize = ann.fontSize || 14;
          const text = ann.text || '';
          page.drawText(text, {
            x: ann.x,
            y: ann.y,
            size: fontSize,
            font: regularFont,
            color,
            opacity,
          });
        } else if (ann.type === 'highlight') {
          page.drawRectangle({
            x: ann.x,
            y: ann.y,
            width: ann.width || 120,
            height: ann.height || 18,
            color: this.hexToPdfRgb(ann.color || '#facc15'),
            opacity: 0.4,
          });
        } else if (ann.type === 'strike') {
          const w = ann.width || 100;
          const h = ann.height || 16;
          const midY = ann.y + h / 2;
          page.drawLine({
            start: { x: ann.x, y: midY },
            end: { x: ann.x + w, y: midY },
            thickness: ann.strokeWidth || 2,
            color,
            opacity,
          });
        } else if (ann.type === 'rect') {
          page.drawRectangle({
            x: ann.x,
            y: ann.y,
            width: ann.width || 100,
            height: ann.height || 60,
            borderColor: color,
            borderWidth: ann.strokeWidth || 2,
            opacity,
          });
        } else if (ann.type === 'circle') {
          const size = Math.max(ann.width || 40, ann.height || 40);
          page.drawEllipse({
            x: ann.x + size / 2,
            y: ann.y + size / 2,
            xScale: size / 2,
            yScale: size / 2,
            borderColor: color,
            borderWidth: ann.strokeWidth || 2,
            opacity,
          });
        } else if (ann.type === 'draw' && ann.points && ann.points.length > 1) {
          const thickness = ann.strokeWidth || 3;
          for (let p = 0; p < ann.points.length - 1; p++) {
            page.drawLine({
              start: { x: ann.points[p].x, y: ann.points[p].y },
              end: { x: ann.points[p + 1].x, y: ann.points[p + 1].y },
              thickness,
              color,
              opacity,
            });
          }
        } else if (ann.type === 'stamp') {
          const stampText = ann.stampType || 'APPROVED';
          const stampColor =
            stampText === 'APPROVED' || stampText === 'COMPLETED'
              ? rgb(0.1, 0.7, 0.3)
              : stampText === 'CONFIDENTIAL' || stampText === 'VOID'
              ? rgb(0.9, 0.2, 0.2)
              : rgb(0.2, 0.5, 0.9);

          const w = ann.width || 140;
          const h = ann.height || 42;

          page.drawRectangle({
            x: ann.x,
            y: ann.y,
            width: w,
            height: h,
            borderColor: stampColor,
            borderWidth: 2.5,
            opacity: 0.9,
          });

          page.drawText(stampText, {
            x: ann.x + 12,
            y: ann.y + 12,
            size: 16,
            font,
            color: stampColor,
            opacity: 0.9,
          });
        }
      }
    }

    onProgress?.(85, 'Saving annotated PDF...');
    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `annotated-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: doc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Generates a Table of Contents summary page with bookmarks
   */
  static async generateTocPdf(
    file: File,
    bookmarks: PdfBookmarkItem[],
    onProgress?: (percent: number, msg: string) => void
  ): Promise<PdfEngineResult> {
    const startTime = performance.now();
    onProgress?.(15, 'Loading PDF for bookmarks & Table of Contents...');
    const buffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(buffer);
    const outDoc = await PDFDocument.create();

    const fontBold = await outDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await outDoc.embedFont(StandardFonts.Helvetica);

    // Create TOC Page at position 0
    onProgress?.(40, 'Generating clickable Table of Contents page...');
    const tocPage = outDoc.addPage([595.28, 841.89]); // A4
    const pageW = tocPage.getWidth();
    const pageH = tocPage.getHeight();

    // Title
    tocPage.drawText('Table of Contents', {
      x: 50,
      y: pageH - 70,
      size: 24,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25),
    });

    tocPage.drawLine({
      start: { x: 50, y: pageH - 85 },
      end: { x: pageW - 50, y: pageH - 85 },
      thickness: 1.5,
      color: rgb(0.8, 0.85, 0.9),
    });

    let currentY = pageH - 120;
    const renderBookmarkRow = (item: PdfBookmarkItem, indent: number) => {
      if (currentY < 60) return; // Prevent overflow off single page

      const title = item.title || 'Untitled Section';
      const pageStr = `Page ${item.pageNumber + 1}`; // +1 for inserted TOC page

      tocPage.drawText(title, {
        x: 50 + indent * 18,
        y: currentY,
        size: indent === 0 ? 13 : 11,
        font: indent === 0 ? fontBold : fontRegular,
        color: rgb(0.2, 0.25, 0.35),
      });

      tocPage.drawText(pageStr, {
        x: pageW - 100,
        y: currentY,
        size: 11,
        font: fontRegular,
        color: rgb(0.4, 0.45, 0.55),
      });

      // Dot leader
      const dotsStartX = 50 + indent * 18 + title.length * 7 + 10;
      const dotsEndX = pageW - 110;
      if (dotsEndX > dotsStartX) {
        tocPage.drawLine({
          start: { x: dotsStartX, y: currentY + 3 },
          end: { x: dotsEndX, y: currentY + 3 },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
      }

      currentY -= 26;

      if (item.children) {
        for (const child of item.children) {
          renderBookmarkRow(child, indent + 1);
        }
      }
    };

    for (const b of bookmarks) {
      renderBookmarkRow(b, 0);
    }

    onProgress?.(65, 'Copying source pages into document...');
    const copiedPages = await outDoc.copyPages(
      srcDoc,
      Array.from({ length: srcDoc.getPageCount() }, (_, i) => i)
    );
    copiedPages.forEach((p) => outDoc.addPage(p));

    onProgress?.(90, 'Saving updated document...');
    const bytes = await outDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = this.createTrackedUrl(blob);

    return {
      success: true,
      blob,
      downloadUrl,
      fileName: `toc-${file.name}`,
      fileSizeBytes: blob.size,
      pageCount: outDoc.getPageCount(),
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Safely registers an object URL for tracking and batch cleanup
   */
  static createTrackedUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.activeUrls.add(url);
    return url;
  }

  /**
   * Revokes a specific tracked URL
   */
  static revokeUrl(url?: string): void {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
        this.activeUrls.delete(url);
      } catch {
        // Safe ignore
      }
    }
  }

  /**
   * Revokes all active URLs created by the engine to free memory
   */
  static cleanupAllTrackedUrls(): void {
    for (const url of this.activeUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Safe ignore
      }
    }
    this.activeUrls.clear();
  }
}
