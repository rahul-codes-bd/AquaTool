import { describe, it, expect } from 'vitest';
import { PdfValidator } from '../pdfValidator';
import { PDFDocument, rgb } from 'pdf-lib';

describe('PdfValidator (Reusable File Validation)', () => {
  async function createSamplePdfFile(size = 1, name = 'test.pdf'): Promise<File> {
    const doc = await PDFDocument.create();
    for (let i = 0; i < size; i++) {
      const page = doc.addPage([400, 600]);
      page.drawText(`Page ${i + 1}`, { x: 50, y: 500, size: 20, color: rgb(0, 0, 0) });
    }
    const bytes = await doc.save();
    return new File([bytes], name, { type: 'application/pdf' });
  }

  it('correctly formats file sizes into human-readable strings', () => {
    expect(PdfValidator.formatFileSize(0)).toBe('0 B');
    expect(PdfValidator.formatFileSize(512)).toBe('512 B');
    expect(PdfValidator.formatFileSize(1024)).toBe('1.00 KB');
    expect(PdfValidator.formatFileSize(1024 * 1024 * 5.5)).toBe('5.50 MB');
  });

  it('validates a valid in-memory PDF file successfully', async () => {
    const validFile = await createSamplePdfFile(2, 'annual-report.pdf');
    const result = await PdfValidator.validatePdf(validFile);

    expect(result.isValid).toBe(true);
    expect(result.fileSizeBytes).toBeGreaterThan(0);
    expect(result.detectedVersion).toContain('PDF');
    expect(result.fileName).toBe('annual-report.pdf');
  });

  it('rejects an empty 0-byte file with EMPTY_FILE code', async () => {
    const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
    const result = await PdfValidator.validatePdf(emptyFile);

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('EMPTY_FILE');
    expect(result.errorMessage).toContain('empty');
  });

  it('rejects non-PDF files that lack the %PDF- signature', async () => {
    const textFile = new File(['Some random plaintext content'], 'fake.pdf', { type: 'application/pdf' });
    const result = await PdfValidator.validatePdf(textFile);

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('INVALID_SIGNATURE');
    expect(result.errorMessage).toContain('%PDF-');
  });

  it('enforces allowed file extensions when configured', async () => {
    const validFile = await createSamplePdfFile(1, 'document.docx');
    const result = await PdfValidator.validatePdf(validFile, {
      allowedExtensions: ['.pdf'],
      requireValidSignature: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('INVALID_EXTENSION');
  });

  it('validates image files for Image-to-PDF conversion', () => {
    const imageFile = new File(['dummy bytes'], 'photo.jpg', { type: 'image/jpeg' });
    const validResult = PdfValidator.validateImageForPdf(imageFile);
    expect(validResult.isValid).toBe(true);

    const emptyImage = new File([], 'empty.png', { type: 'image/png' });
    const emptyResult = PdfValidator.validateImageForPdf(emptyImage);
    expect(emptyResult.isValid).toBe(false);
  });
});
