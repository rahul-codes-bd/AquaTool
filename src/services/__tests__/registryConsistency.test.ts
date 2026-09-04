import { describe, it, expect } from 'vitest';
import {
  ALL_UNIFIED_TOOLS,
  MASTER_CATEGORIES,
  getUnifiedToolsByCategory,
  searchUnifiedTools,
  getPopularUnifiedTools,
} from '../../registry/unifiedRegistry';
import { getToolBySlug, TOOLS } from '../../registry/toolsRegistry';
import { getPdfToolBySlug, PDF_TOOLS } from '../../registry/pdfRegistry';
import { getImageToolBySlug, IMAGE_TOOLS } from '../../registry/imageRegistry';
import { getFileConvToolBySlug, FILE_CONVERSION_TOOLS } from '../../registry/fileConvRegistry';

describe('Registry Consistency & Routing Integrity Suite', () => {
  it('verifies all unified tools have valid structural properties', () => {
    expect(ALL_UNIFIED_TOOLS.length).toBeGreaterThanOrEqual(150);

    const validCategories = new Set(MASTER_CATEGORIES.map((c) => c.id));

    for (const tool of ALL_UNIFIED_TOOLS) {
      // Slug validation
      expect(tool.slug, `Tool slug missing for ${tool.name}`).toBeTruthy();
      expect(typeof tool.slug).toBe('string');
      expect(tool.slug).toMatch(/^[a-z0-9-]+$/);

      // Name & Description
      expect(tool.name, `Tool name missing for ${tool.slug}`).toBeTruthy();
      expect(tool.name.trim().length).toBeGreaterThan(2);
      expect(tool.description, `Description missing for ${tool.slug}`).toBeTruthy();
      expect(tool.description.trim().length).toBeGreaterThan(10);

      // Category validation
      expect(validCategories.has(tool.category), `Invalid category "${tool.category}" on ${tool.slug}`).toBe(true);

      // Icon validation
      expect(tool.iconName, `Icon missing on ${tool.slug}`).toBeTruthy();

      // Tags & Formats
      expect(Array.isArray(tool.tags)).toBe(true);
      expect(tool.tags.length).toBeGreaterThan(0);
      expect(Array.isArray(tool.supportedInputTypes)).toBe(true);
      expect(Array.isArray(tool.supportedOutputTypes)).toBe(true);
    }
  });

  it('guarantees zero duplicate slugs across the entire unified registry', () => {
    const seenSlugs = new Set<string>();
    const duplicates: string[] = [];

    for (const tool of ALL_UNIFIED_TOOLS) {
      if (seenSlugs.has(tool.slug)) {
        duplicates.push(tool.slug);
      }
      seenSlugs.add(tool.slug);
    }

    expect(duplicates, `Found duplicate slugs: ${duplicates.join(', ')}`).toEqual([]);
  });

  it('ensures every unified tool resolves to a registered handler or backing definition', () => {
    const unresolvable: string[] = [];

    for (const tool of ALL_UNIFIED_TOOLS) {
      const inImage = getImageToolBySlug(tool.slug);
      const inGeneral = getToolBySlug(tool.slug);
      const inPdf = getPdfToolBySlug(tool.slug);
      const inFileConv = getFileConvToolBySlug(tool.slug);

      if (!inImage && !inGeneral && !inPdf && !inFileConv) {
        unresolvable.push(tool.slug);
      }
    }

    expect(unresolvable, `Unresolvable tool slugs: ${unresolvable.join(', ')}`).toEqual([]);
  });

  it('verifies App routing dispatcher accurately matches all unified tools without 404', () => {
    const routeFailures: string[] = [];

    for (const tool of ALL_UNIFIED_TOOLS) {
      const slug = tool.slug;
      const imageTool = getImageToolBySlug(slug);
      const found = getToolBySlug(slug);
      const pdfTool = getPdfToolBySlug(slug);
      const fcTool = getFileConvToolBySlug(slug);

      let targetView = '404';
      if (imageTool) {
        targetView = 'image-tool';
      } else if (found) {
        targetView = 'tool';
      } else if (pdfTool) {
        targetView = 'pdf-tool';
      } else if (fcTool) {
        targetView = 'fileconv-tool';
      }

      if (targetView === '404') {
        routeFailures.push(slug);
      }
    }

    expect(routeFailures, `Routing failed for: ${routeFailures.join(', ')}`).toEqual([]);
  });

  it('verifies all master categories contain registered tools', () => {
    for (const cat of MASTER_CATEGORIES) {
      const toolsInCat = getUnifiedToolsByCategory(cat.id);
      expect(
        toolsInCat.length,
        `Master category "${cat.name}" (${cat.id}) has no registered tools`
      ).toBeGreaterThan(0);
    }
  });

  it('verifies searchUnifiedTools finds tools accurately across names, tags, and types', () => {
    expect(searchUnifiedTools('').length).toBe(ALL_UNIFIED_TOOLS.length);

    const pdfResults = searchUnifiedTools('pdf');
    expect(pdfResults.length).toBeGreaterThan(10);
    expect(pdfResults.every((t) => JSON.stringify(t).toLowerCase().includes('pdf'))).toBe(true);

    // Hashtag prefix normalization check
    const hashtagPdfResults = searchUnifiedTools('#pdf');
    expect(hashtagPdfResults.length).toBe(pdfResults.length);

    const hashtagPngResults = searchUnifiedTools('#png');
    expect(hashtagPngResults.length).toBeGreaterThan(0);

    const convertResults = searchUnifiedTools('convert');
    expect(convertResults.length).toBeGreaterThan(5);

    // Quick picks tag search check
    const faviconResults = searchUnifiedTools('Favicon Generator');
    expect(faviconResults.length).toBeGreaterThan(0);

    const qrResults = searchUnifiedTools('QR Code');
    expect(qrResults.length).toBeGreaterThan(0);

    const noResults = searchUnifiedTools('xyz987nonexistentpattern123');
    expect(noResults).toEqual([]);
  });

  it('verifies getPopularUnifiedTools returns valid curated tools', () => {
    const popular = getPopularUnifiedTools();
    expect(popular.length).toBeGreaterThan(0);
    expect(popular.length).toBeLessThanOrEqual(9);
    for (const tool of popular) {
      expect(tool.slug).toBeTruthy();
      expect(tool.name).toBeTruthy();
    }
  });
});
