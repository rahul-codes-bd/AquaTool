import { describe, it, expect, beforeEach } from 'vitest';
import { updateSEOMetadata } from '../seo';
import { APP_CONFIG, SITE_URL } from '../../config/appConfig';
import fs from 'fs';
import path from 'path';

// Light-weight in-memory document mock to run in Node environment
class MockElement {
  attrs = new Map<string, string>();
  constructor(public tagName: string) {}
  setAttribute(name: string, value: string) {
    this.attrs.set(name, value);
  }
  getAttribute(name: string) {
    return this.attrs.get(name) || null;
  }
  remove() {
    const idx = mockElements.indexOf(this);
    if (idx !== -1) {
      mockElements.splice(idx, 1);
    }
  }
}

let mockElements: MockElement[] = [];

const mockHead = {
  appendChild: (el: any) => {
    mockElements.push(el);
  }
};

globalThis.document = {
  title: '',
  head: mockHead,
  createElement: (tagName: string) => {
    return new MockElement(tagName);
  },
  querySelector: (selector: string) => {
    if (selector.startsWith('link[rel="canonical"]')) {
      return mockElements.find(el => el.tagName === 'link' && el.getAttribute('rel') === 'canonical') || null;
    }
    if (selector.startsWith('meta[name="')) {
      const name = selector.match(/"([^"]+)"/)?.[1];
      return mockElements.find(el => el.tagName === 'meta' && el.getAttribute('name') === name) || null;
    }
    if (selector.startsWith('meta[property="')) {
      const prop = selector.match(/"([^"]+)"/)?.[1];
      return mockElements.find(el => el.tagName === 'meta' && el.getAttribute('property') === prop) || null;
    }
    return null;
  },
  querySelectorAll: (selector: string) => {
    return {
      forEach: (cb: any) => {
        const cloned = [...mockElements];
        cloned.forEach(cb);
      }
    };
  }
} as any;

describe('SEO Foundation & Metadata Validation Suite', () => {
  beforeEach(() => {
    document.title = '';
    mockElements = [];
  });

  it('verifies updateSEOMetadata correctly updates document title and meta tags when SITE_URL is configured', () => {
    // Temporarily configure SITE_URL for testing
    const originalSiteUrl = APP_CONFIG.SITE_URL;
    (APP_CONFIG as any).SITE_URL = 'https://custom-seo-domain.com';

    updateSEOMetadata({
      title: 'PDF Compress Tool',
      description: 'Compress PDF files locally with zero quality loss.',
      canonicalPath: '/#/tool/pdf-compress',
    });

    expect(document.title).toBe(`PDF Compress Tool — ${APP_CONFIG.name}`);

    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta?.getAttribute('content')).toBe('Compress PDF files locally with zero quality loss.');

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    expect(canonicalLink?.getAttribute('href')).toBe('https://custom-seo-domain.com/#/tool/pdf-compress');

    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute('content')).toBe(`PDF Compress Tool — ${APP_CONFIG.name}`);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    expect(ogUrl?.getAttribute('content')).toBe('https://custom-seo-domain.com/#/tool/pdf-compress');

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    expect(twitterTitle?.getAttribute('content')).toBe(`PDF Compress Tool — ${APP_CONFIG.name}`);

    // Restore SITE_URL
    (APP_CONFIG as any).SITE_URL = originalSiteUrl;
  });

  it('verifies updateSEOMetadata removes or omits canonical and OG url/image tags when SITE_URL is unconfigured (pending)', () => {
    // Temporarily clear SITE_URL for testing
    const originalSiteUrl = APP_CONFIG.SITE_URL;
    (APP_CONFIG as any).SITE_URL = '';

    updateSEOMetadata({
      title: 'PDF Compress Tool',
      description: 'Compress PDF files locally with zero quality loss.',
      canonicalPath: '/#/tool/pdf-compress',
    });

    expect(document.title).toBe(`PDF Compress Tool — ${APP_CONFIG.name}`);

    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta?.getAttribute('content')).toBe('Compress PDF files locally with zero quality loss.');

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    expect(canonicalLink).toBeNull();

    const ogUrl = document.querySelector('meta[property="og:url"]');
    expect(ogUrl).toBeNull();

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage).toBeNull();

    // Restore SITE_URL
    (APP_CONFIG as any).SITE_URL = originalSiteUrl;
  });

  it('validates public/robots.txt policy and disallow rules', () => {
    const robotsPath = path.resolve(process.cwd(), 'public/robots.txt');
    expect(fs.existsSync(robotsPath)).toBe(true);

    const content = fs.readFileSync(robotsPath, 'utf-8');
    expect(content).toContain('User-agent: *');
    expect(content).toContain('Allow: /');
    expect(content).toContain('Disallow: /#/settings');
    expect(content).not.toContain('example.com');
  });

  it('validates public/sitemap.xml formatting and structure', () => {
    const sitemapPath = path.resolve(process.cwd(), 'public/sitemap.xml');
    expect(fs.existsSync(sitemapPath)).toBe(true);

    const content = fs.readFileSync(sitemapPath, 'utf-8');
    expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(content).toContain('<urlset');

    const comingSoonSlugs = ['doc-to-pdf', 'ppt-to-pdf', 'xls-to-pdf', 'publisher-to-pdf', 'pub-to-pdf'];
    for (const slug of comingSoonSlugs) {
      expect(content).not.toContain(`/${slug}`);
    }
  });
});
