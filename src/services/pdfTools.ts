import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export interface PdfPageInfo {
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  widthMm: number;
  heightMm: number;
  widthInches: number;
  heightInches: number;
  orientation: 'Portrait' | 'Landscape' | 'Square';
  rotation: number;
  standardSize: string;
}

export interface PdfMetadata {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pdfVersion?: string;
  isEncrypted: boolean;
  encryptionError?: string;
  fileSize: number;
  pages: PdfPageInfo[];
  hasMixedOrientations: boolean;
  hasMixedSizes: boolean;
  sizeWarning?: string;
}

export interface MergePdfResult {
  blob: Blob;
  url: string;
  pageCount: number;
  fileSize: number;
}

export interface SplitPdfResult {
  blob: Blob;
  url: string;
  pageCount: number;
  fileSize: number;
  isZip?: boolean;
  extractedPages?: number[];
}

export class PdfTools {
  private static readonly LARGE_FILE_THRESHOLD_BYTES = 30 * 1024 * 1024; // 30 MB
  private static readonly LARGE_MERGE_THRESHOLD_BYTES = 50 * 1024 * 1024; // 50 MB

  /**
   * Validates if a file or blob contains a standard PDF header (%PDF-)
   */
  static async validatePdfHeader(file: File | Blob): Promise<{ isValid: boolean; version?: string }> {
    try {
      const headerSlice = await file.slice(0, 1024).arrayBuffer();
      const headerText = new TextDecoder('latin1').decode(headerSlice);
      const match = headerText.match(/%PDF-([0-9\.]+)/);
      if (match) {
        return { isValid: true, version: `PDF ${match[1]}` };
      }
      return { isValid: false };
    } catch {
      return { isValid: false };
    }
  }

  /**
   * Determine standard paper size name based on points (tolerances within ±5 points)
   * 1 pt = 1/72 inch = 25.4/72 mm
   */
  static detectStandardSize(widthPt: number, heightPt: number): string {
    const [short, long] = widthPt < heightPt ? [widthPt, heightPt] : [heightPt, widthPt];

    if (Math.abs(short - 595.28) <= 5 && Math.abs(long - 841.89) <= 5) return 'A4';
    if (Math.abs(short - 612) <= 5 && Math.abs(long - 792) <= 5) return 'US Letter';
    if (Math.abs(short - 612) <= 5 && Math.abs(long - 1008) <= 5) return 'US Legal';
    if (Math.abs(short - 792) <= 5 && Math.abs(long - 1224) <= 5) return 'Tabloid (11×17")';
    if (Math.abs(short - 841.89) <= 5 && Math.abs(long - 1190.55) <= 5) return 'A3';
    if (Math.abs(short - 419.53) <= 5 && Math.abs(long - 595.28) <= 5) return 'A5';
    if (Math.abs(short - 522) <= 5 && Math.abs(long - 756) <= 5) return 'Executive';
    if (Math.abs(short - long) <= 3) return 'Square';

    return `${Math.round(widthPt)} × ${Math.round(heightPt)} pt`;
  }

  /**
   * Inspects detailed PDF document metadata and per-page metrics
   */
  static async getPdfMetadata(
    file: File | Blob,
    onProgress?: (percent: number, message: string) => void
  ): Promise<PdfMetadata> {
    if (!file || file.size === 0) {
      throw new Error('Provided PDF file is empty (0 bytes).');
    }

    onProgress?.(10, 'Checking PDF file signature...');
    const headerCheck = await this.validatePdfHeader(file);
    if (!headerCheck.isValid) {
      throw new Error(
        'Invalid or corrupted PDF file: The file does not start with the standard %PDF- header signature.'
      );
    }

    onProgress?.(25, 'Loading PDF document into memory...');
    const buffer = await file.arrayBuffer();

    let pdfDoc: PDFDocument;
    let totalPages = 0;
    let docPages: any[] = [];

    try {
      pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      totalPages = pdfDoc.getPageCount();
      docPages = pdfDoc.getPages();
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      const isEncrypted =
        err?.name === 'EncryptedPDFError' ||
        err?.name === 'PasswordRequirementError' ||
        msg.includes('encrypt') ||
        msg.includes('password');

      if (isEncrypted) {
        return {
          pageCount: 0,
          isEncrypted: true,
          encryptionError:
            'This PDF is protected by password encryption or restricted permissions. In accordance with PDF security standards, pdf-lib cannot decrypt or inspect contents without the document password.',
          fileSize: file.size,
          pdfVersion: headerCheck.version,
          pages: [],
          hasMixedOrientations: false,
          hasMixedSizes: false,
          sizeWarning:
            file.size > this.LARGE_FILE_THRESHOLD_BYTES
              ? `Large PDF file (${(file.size / (1024 * 1024)).toFixed(1)} MB) detected.`
              : undefined,
        };
      }
      throw new Error(`Failed to parse PDF document: ${err?.message || 'Corrupted xref, damaged catalog, or stream syntax error.'}`);
    }

    onProgress?.(50, 'Extracting document catalog and metadata...');
    const pages: PdfPageInfo[] = [];

    onProgress?.(70, `Analyzing ${totalPages} pages for dimensions and orientation...`);
    const orientations = new Set<string>();
    const sizes = new Set<string>();

    for (let i = 0; i < totalPages; i++) {
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

      const standardSize = this.detectStandardSize(widthPt, heightPt);
      sizes.add(standardSize);

      pages.push({
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

    onProgress?.(95, 'Finalizing metadata summary...');

    let sizeWarning: string | undefined;
    if (file.size > this.LARGE_FILE_THRESHOLD_BYTES) {
      sizeWarning = `Large PDF file (${(file.size / (1024 * 1024)).toFixed(
        1
      )} MB). In-memory processing may require significant browser RAM.`;
    }

    onProgress?.(100, 'Metadata inspection complete.');

    return {
      pageCount: totalPages,
      title: pdfDoc.getTitle() || undefined,
      author: pdfDoc.getAuthor() || undefined,
      subject: pdfDoc.getSubject() || undefined,
      keywords: pdfDoc.getKeywords() || undefined,
      creator: pdfDoc.getCreator() || undefined,
      producer: pdfDoc.getProducer() || undefined,
      creationDate: pdfDoc.getCreationDate()?.toLocaleString() || undefined,
      modificationDate: pdfDoc.getModificationDate()?.toLocaleString() || undefined,
      pdfVersion: headerCheck.version,
      isEncrypted: false,
      fileSize: file.size,
      pages,
      hasMixedOrientations: orientations.size > 1,
      hasMixedSizes: sizes.size > 1,
      sizeWarning,
    };
  }

  /**
   * Merges multiple PDF files into one combined PDF document
   */
  static async mergePdfs(
    files: File[],
    onProgress?: (percent: number, message: string) => void
  ): Promise<MergePdfResult> {
    if (!files || files.length < 2) {
      throw new Error('Please select at least 2 PDF files to merge.');
    }

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    onProgress?.(5, `Preparing to merge ${files.length} documents...`);

    // Verify all files first
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const valid = await this.validatePdfHeader(f);
      if (!valid.isValid) {
        throw new Error(
          `Document #${i + 1} ("${f.name}") is not a valid PDF file. Please remove or replace it.`
        );
      }
    }

    const mergedPdf = await PDFDocument.create();
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const pct = 10 + Math.round(((i + 1) / (totalFiles + 1)) * 60);
      onProgress?.(pct, `Reading and appending document ${i + 1} of ${totalFiles} ("${file.name}")...`);

      const buffer = await file.arrayBuffer();
      let doc: PDFDocument;
      let pageIndices: number[] = [];
      try {
        doc = await PDFDocument.load(buffer);
        pageIndices = doc.getPageIndices();
      } catch (err: any) {
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('encrypt') || msg.includes('password')) {
          throw new Error(
            `Document #${i + 1} ("${file.name}") is encrypted with a password. Encrypted PDFs cannot be merged without prior decryption.`
          );
        }
        throw new Error(`Failed to load "${file.name}": ${err?.message || 'Malformed PDF structure.'}`);
      }

      const copiedPages = await mergedPdf.copyPages(doc, pageIndices);
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    }

    onProgress?.(80, 'Serializing compiled PDF bytes in memory...');
    const mergedBytes = await mergedPdf.save();

    onProgress?.(95, 'Building download blob URL...');
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    onProgress?.(100, `Merged ${files.length} documents (${mergedPdf.getPageCount()} pages total).`);

    return {
      blob,
      url,
      pageCount: mergedPdf.getPageCount(),
      fileSize: blob.size,
    };
  }

  /**
   * Extracts selected pages into a new single PDF document
   */
  static async splitPdf(
    file: File,
    pageRange: string | number[],
    onProgress?: (percent: number, message: string) => void
  ): Promise<SplitPdfResult> {
    if (!file) throw new Error('No PDF file provided.');

    onProgress?.(10, 'Validating source PDF signature...');
    const valid = await this.validatePdfHeader(file);
    if (!valid.isValid) {
      throw new Error('The selected file is not a valid PDF document.');
    }

    onProgress?.(25, 'Loading source PDF into memory...');
    const buffer = await file.arrayBuffer();

    let srcDoc: PDFDocument;
    let totalPages = 0;
    try {
      srcDoc = await PDFDocument.load(buffer);
      totalPages = srcDoc.getPageCount();
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('encrypt') || msg.includes('password')) {
        throw new Error(
          'This PDF is encrypted or password-protected. Encrypted documents cannot be split or extracted.'
        );
      }
      throw new Error(`Failed to load PDF: ${err?.message || 'Malformed structure.'}`);
    }
    let selectedIndices: number[];

    if (Array.isArray(pageRange)) {
      selectedIndices = pageRange
        .filter((p) => p >= 1 && p <= totalPages)
        .map((p) => p - 1);
    } else {
      selectedIndices = this.parsePageRange(pageRange, totalPages);
    }

    if (selectedIndices.length === 0) {
      throw new Error(
        `No valid pages selected. Please enter valid page numbers between 1 and ${totalPages}.`
      );
    }

    onProgress?.(50, `Extracting ${selectedIndices.length} pages from original ${totalPages} pages...`);
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, selectedIndices);
    for (const page of copiedPages) {
      newDoc.addPage(page);
    }

    onProgress?.(80, 'Serializing extracted pages...');
    const pdfBytes = await newDoc.save();

    onProgress?.(95, 'Building download blob URL...');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    onProgress?.(100, `Successfully extracted ${newDoc.getPageCount()} pages.`);

    return {
      blob,
      url,
      pageCount: newDoc.getPageCount(),
      fileSize: blob.size,
      extractedPages: selectedIndices.map((i) => i + 1),
    };
  }

  /**
   * Extracts each selected page into its own individual PDF file packaged in a ZIP archive
   */
  static async splitAllPagesToZip(
    file: File,
    selectedPages?: number[],
    onProgress?: (percent: number, message: string) => void
  ): Promise<SplitPdfResult> {
    if (!file) throw new Error('No PDF file provided.');

    onProgress?.(10, 'Loading source PDF...');
    const buffer = await file.arrayBuffer();

    let srcDoc: PDFDocument;
    let totalPages = 0;
    try {
      srcDoc = await PDFDocument.load(buffer);
      totalPages = srcDoc.getPageCount();
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('encrypt') || msg.includes('password')) {
        throw new Error(
          'This PDF is encrypted or password-protected. Encrypted documents cannot be split.'
        );
      }
      throw new Error(`Failed to load PDF: ${err?.message || 'Malformed structure.'}`);
    }
    const targetPages = selectedPages && selectedPages.length > 0
      ? selectedPages.filter((p) => p >= 1 && p <= totalPages)
      : Array.from({ length: totalPages }, (_, i) => i + 1);

    if (targetPages.length === 0) {
      throw new Error('No pages selected to export.');
    }

    const zip = new JSZip();
    const baseName = file.name.replace(/\.pdf$/i, '');

    for (let i = 0; i < targetPages.length; i++) {
      const pageNum = targetPages[i];
      const pct = 15 + Math.round(((i + 1) / targetPages.length) * 65);
      onProgress?.(pct, `Extracting single page ${pageNum} (${i + 1} of ${targetPages.length})...`);

      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(srcDoc, [pageNum - 1]);
      singleDoc.addPage(copiedPage);

      const pageBytes = await singleDoc.save();
      const paddedNum = String(pageNum).padStart(String(totalPages).length, '0');
      zip.file(`${baseName}-page-${paddedNum}.pdf`, pageBytes);
    }

    onProgress?.(85, 'Compressing individual PDF files into ZIP archive...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);

    onProgress?.(100, `Created ZIP package with ${targetPages.length} individual PDF documents.`);

    return {
      blob: zipBlob,
      url,
      pageCount: targetPages.length,
      fileSize: zipBlob.size,
      isZip: true,
      extractedPages: targetPages,
    };
  }

  /**
   * Helper to parse flexible page ranges, supporting:
   * "1-3, 5, 8-10", "odd", "even", "all"
   */
  static parsePageRange(rangeStr: string, totalPages: number): number[] {
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
    const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(totalPages, Math.max(start, end));
          for (let i = from; i <= to; i++) {
            indices.add(i - 1); // 0-based
          }
        }
      } else {
        const page = parseInt(part, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
          indices.add(page - 1);
        }
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  }

  /**
   * Safely revokes an object URL to prevent browser memory leaks
   */
  static revokeUrl(url?: string): void {
    if (url && typeof url === 'string' && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revoked URL errors
      }
    }
  }

  /**
   * Returns formatted file size
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

