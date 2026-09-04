import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageService } from '../storage';
import { ObjectUrlManager } from '../fileHandler';
import { PDFDocument, rgb } from 'pdf-lib';
import { PdfEngine } from '../pdfEngine';

describe('Privacy & Zero-Network Audit Suite', () => {
  let networkCalls: Array<{ type: string; url: string; data?: any }> = [];
  let originalFetch: typeof globalThis.fetch;
  const mockStorage = new Map<string, string>();

  beforeEach(() => {
    networkCalls = [];
    originalFetch = globalThis.fetch;

    // Spy on global fetch
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      networkCalls.push({ type: 'fetch', url, data: init?.body });
      throw new Error(`CRITICAL PRIVACY VIOLATION: Remote network call attempted to ${url}`);
    });

    // Provide mock localStorage for test environment
    mockStorage.clear();
    globalThis.localStorage = {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, val: string) => mockStorage.set(key, String(val)),
      removeItem: (key: string) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
      key: (i: number) => Array.from(mockStorage.keys())[i] ?? null,
      get length() {
        return mockStorage.size;
      },
    } as Storage;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mockStorage.clear();
  });

  it('verifies 0 external network requests during PDF operations', async () => {
    // Generate a minimal valid PDF in-memory using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 500]);
    page.drawText('Confidential client contract', { x: 50, y: 400, size: 18, color: rgb(0, 0, 0) });
    const pdfBytes = await pdfDoc.save();
    const testFile = new File([pdfBytes], 'contract.pdf', { type: 'application/pdf' });

    // Perform local metadata sanitization
    const result = await PdfEngine.stripMetadata(testFile);

    expect(result.fileSizeBytes).toBeGreaterThan(0);
    // Assert ZERO remote network calls occurred
    expect(networkCalls.length).toBe(0);
  });

  it('verifies localStorage stores ONLY non-sensitive UI preferences and never file data', () => {
    // Save valid preferences
    StorageService.savePreferences({ theme: 'dark', reducedMotion: 'reduce', enableHistory: true });
    StorageService.toggleFavorite('pdf-merge-split');
    StorageService.addRecentTool('image-converter');

    // Inspect all keys and values in localStorage
    for (const [key, val] of mockStorage.entries()) {
      // Must only be AquaTools UI keys
      expect(key.startsWith('aquatools_')).toBe(true);

      // Check for accidental sensitive data leakage
      expect(val).not.toContain('data:application/pdf');
      expect(val).not.toContain('data:image/');
      expect(val).not.toContain('password');
      expect(val).not.toContain('confidential');
      expect(val.length).toBeLessThan(2048); // UI settings must be compact
    }

    // Verify clearAll purges all AquaTools data
    StorageService.clearAll();
    expect(mockStorage.get('aquatools_favorites')).toBeUndefined();
    expect(mockStorage.get('aquatools_recent_tools')).toBeUndefined();
  });

  it('verifies temporary Object URLs are registered and revoked properly', () => {
    const manager = new ObjectUrlManager();
    const testBlob = new Blob(['sample-test-content'], { type: 'text/plain' });
    const url = manager.createSafeUrl(testBlob);

    expect(typeof url).toBe('string');
    expect(manager.count).toBe(1);

    // Revoke URL
    manager.revokeSafeUrl(url);
    expect(manager.count).toBe(0);

    // Test revokeAll
    manager.createSafeUrl(testBlob);
    manager.createSafeUrl(testBlob);
    expect(manager.count).toBe(2);

    manager.revokeAll();
    expect(manager.count).toBe(0);
  });
});
