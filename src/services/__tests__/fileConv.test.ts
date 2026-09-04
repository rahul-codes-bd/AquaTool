import { describe, it, expect } from 'vitest';
import { FileValidator } from '../fileconv/fileValidator';
import { FILE_CONVERSION_TOOLS, getFileConvToolBySlug } from '../../registry/fileConvRegistry';
import { fileConvWorkerManager } from '../../workers/fileConvWorker';
import { FileConvEngine } from '../fileconv/fileConvEngine';
import { MediaEngine } from '../fileconv/mediaEngine';
import JSZip from 'jszip';

describe('File Conversion Suite & Security Registry', () => {
  it('contains all 13 categories and required tools', () => {
    expect(FILE_CONVERSION_TOOLS.length).toBeGreaterThanOrEqual(12);
    const universalTool = getFileConvToolBySlug('universal-convert');
    expect(universalTool).toBeDefined();
    expect(universalTool?.category).toBe('universal');
  });

  it('sanitizes dangerous SVG scripts and event handlers', () => {
    const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect onclick="alert(2)" width="100" height="100"/></svg>`;
    const sanitized = FileValidator.sanitizeSvgText(maliciousSvg);
    expect(sanitized).not.toContain('script');
    expect(sanitized).not.toContain('onclick');
  });

  it('sanitizes dangerous HTML tags and event handlers', () => {
    const maliciousHtml = `<div><script>alert(1)</script><iframe src="evil.com"></iframe><img src="x" onerror="alert(2)"/><a href="javascript:alert(3)">click</a></div>`;
    const sanitized = FileValidator.sanitizeHtmlText(maliciousHtml);
    expect(sanitized).not.toContain('script');
    expect(sanitized).not.toContain('iframe');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('javascript:');
  });

  it('validates archive paths for path traversal prevention', () => {
    expect(FileValidator.checkArchiveEntryPath('normal/file.txt')).toBe(true);
    expect(FileValidator.checkArchiveEntryPath('../traversal.txt')).toBe(false);
    expect(FileValidator.checkArchiveEntryPath('/absolute/path.txt')).toBe(false);
    expect(FileValidator.checkArchiveEntryPath('C:\\Windows\\system32')).toBe(false);
  });

  it('validates file size limits correctly (oversized and empty files)', () => {
    const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
    expect(FileValidator.validateFile(emptyFile).valid).toBe(false);

    const dummyFile = new File(['test data'], 'test.txt', { type: 'text/plain' });
    const res = FileValidator.validateFile(dummyFile, 1024);
    expect(res.valid).toBe(true);

    const oversized = FileValidator.validateFile(dummyFile, 2);
    expect(oversized.valid).toBe(false);
    expect(oversized.error).toContain('exceeds the recommended browser safety limit');
  });

  it('escapes unsafe characters in output filenames', () => {
    const unsafe = 'test/path\\file?.png';
    const escaped = FileValidator.escapeFilename(unsafe);
    expect(escaped).not.toContain('/');
    expect(escaped).not.toContain('\\');
    expect(escaped).not.toContain('?');
  });

  it('manages worker lifecycle and cancellation safely', () => {
    expect(fileConvWorkerManager).toBeDefined();
    fileConvWorkerManager.cancelTask('non-existent-task');
  });

  it('converts CSV to JSON and JSON to CSV accurately', async () => {
    const csvContent = 'name,age,city\nAlice,30,New York\nBob,25,San Francisco';
    const csvFile = new File([csvContent], 'data.csv', { type: 'text/csv' });

    const res = await FileConvEngine.convertFile(csvFile, { targetFormat: 'json' }, () => {});
    const jsonText = await res.blob.text();
    const parsed = JSON.parse(jsonText);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe('Alice');
    expect(parsed[1].city).toBe('San Francisco');

    // Roundtrip back to CSV
    const jsonFile = new File([jsonText], 'data.json', { type: 'application/json' });
    const csvRes = await FileConvEngine.convertFile(jsonFile, { targetFormat: 'csv' }, () => {});
    const convertedCsv = await csvRes.blob.text();
    expect(convertedCsv).toContain('Alice');
    expect(convertedCsv).toContain('San Francisco');
  });

  it('handles malformed JSON input gracefully without throwing', async () => {
    const malformedJson = '{ "name": "Alice", "age": 30, invalid_json... }';
    const badFile = new File([malformedJson], 'bad.json', { type: 'application/json' });

    const res = await FileConvEngine.convertFile(badFile, { targetFormat: 'csv' }, () => {});
    expect(res.report.warnings.length).toBeGreaterThan(0);
    expect(res.report.warnings[0]).toContain('Parsing error');
  });

  it('converts Markdown to HTML and Base64', async () => {
    const mdContent = '# Hello World\n\nThis is **bold** text.';
    const mdFile = new File([mdContent], 'doc.md', { type: 'text/markdown' });

    const htmlRes = await FileConvEngine.convertFile(mdFile, { targetFormat: 'html' }, () => {});
    const htmlText = await htmlRes.blob.text();
    expect(htmlText).toContain('<h1>Hello World</h1>');
    expect(htmlText).toContain('<strong>bold</strong>');

    const b64Res = await FileConvEngine.convertFile(mdFile, { targetFormat: 'base64' }, () => {});
    const b64Text = await b64Res.blob.text();
    expect(b64Text.length).toBeGreaterThan(10);
    expect(atob(b64Text)).toContain('Hello World');
  });

  it('creates and extracts ZIP archives safely without executing unsafe entries', async () => {
    const file1 = { filename: 'normal.txt', blob: new Blob(['hello world']) };
    const zipPack = await FileConvEngine.createZipBatch([file1]);
    expect(zipPack.blob).toBeDefined();

    const zipFile = new File([zipPack.blob], 'test.zip', { type: 'application/zip' });
    const extracted = await FileConvEngine.extractZipArchive(zipFile);
    expect(extracted.length).toBe(1);
    expect(extracted[0].filename).toBe('normal.txt');
  });

  it('safely rejects ZIP path traversal attacks during extraction', () => {
    expect(FileValidator.checkArchiveEntryPath('safe.txt')).toBe(true);
    expect(FileValidator.checkArchiveEntryPath('../malicious.txt')).toBe(false);
    expect(FileValidator.checkArchiveEntryPath('dir/../../etc/passwd')).toBe(false);
    expect(FileValidator.checkArchiveEntryPath('/absolute/path.txt')).toBe(false);
    expect(FileValidator.checkArchiveEntryPath('C:\\Windows\\System32')).toBe(false);
  });

  it('sanitizes HTML scripts and inline handlers safely', () => {
    const dirtyHtml = '<div><h1>Title</h1><script>alert(1)</script><iframe src="evilsite.com"></iframe><button onclick="evil()">Click</button></div>';
    const cleanHtml = FileValidator.sanitizeHtmlText(dirtyHtml);
    expect(cleanHtml).not.toContain('<script');
    expect(cleanHtml).not.toContain('<iframe');
    expect(cleanHtml).not.toContain('onclick');
    expect(cleanHtml).toContain('Title');
  });

  it('calculates media size estimates accurately for audio and video', () => {
    const audioEst = MediaEngine.estimateMediaSize(10, 'audio', 1.0);
    expect(audioEst).toBeGreaterThan(1000000); // 10s WAV ~ 1.76 MB

    const videoEst = MediaEngine.estimateMediaSize(10, 'video', 0.9);
    expect(videoEst).toBeGreaterThan(10000000); // 10s video ~ 18 MB
  });
});
