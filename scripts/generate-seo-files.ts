import fs from 'fs';
import path from 'path';
import { SITE_URL } from '../src/config/appConfig';
import { ALL_UNIFIED_TOOLS, MASTER_CATEGORIES } from '../src/registry/unifiedRegistry';
import { PDF_CATEGORIES, PDF_TOOLS } from '../src/registry/pdfRegistry';
import { IMAGE_CATEGORIES } from '../src/registry/imageRegistry';

function generateSeoFiles() {
  console.log(`[SEO Generator] Target SITE_URL: "${SITE_URL}"`);

  const publicDir = path.resolve(process.cwd(), 'public');
  const distDir = path.resolve(process.cwd(), 'dist');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Handle case where SITE_URL is not yet configured (or is empty)
  if (!SITE_URL) {
    console.log('[SEO Generator] SITE_URL is empty or not configured yet.');
    console.log('[SEO Generator] Generating SEO files in PENDING mode...');

    // 1. Generate pending robots.txt
    const robotsTxtContent = `# AquaTools Production Robots Directives (PENDING DOMAIN CONFIGURATION)
# Once SITE_URL is configured, the sitemap URL will be automatically appended here.
User-agent: *
Allow: /
Allow: /*.js
Allow: /*.css
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.webp
Allow: /*.svg
Allow: /*.ico
Allow: /*.json
Allow: /*.webmanifest
Allow: /*.wasm

# Disallow private user local state routes
Disallow: /#/settings
Disallow: /#/favorites
Disallow: /settings
Disallow: /favorites
`;

    const robotsPath = path.join(publicDir, 'robots.txt');
    fs.writeFileSync(robotsPath, robotsTxtContent, 'utf-8');
    console.log(`[SEO Generator] Written pending robots.txt to ${robotsPath}`);

    // 2. Generate pending/disabled sitemap.xml
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  SITEMAP GENERATION PENDING SITE_URL CONFIGURATION.
  To generate a full production sitemap, configure VITE_SITE_URL or SITE_URL in your deployment environment or .env file.
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>
`;
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
    console.log(`[SEO Generator] Written pending sitemap.xml to ${sitemapPath}`);

    // Copy to dist if dist exists
    if (fs.existsSync(distDir)) {
      fs.copyFileSync(robotsPath, path.join(distDir, 'robots.txt'));
      fs.copyFileSync(sitemapPath, path.join(distDir, 'sitemap.xml'));
      console.log(`[SEO Generator] Copied pending SEO files to ${distDir}`);
    }

    console.log('[SEO Generator] Completed in PENDING mode successfully.');
    return;
  }

  // 1. Generate robots.txt with fully configured Sitemap
  const robotsTxtContent = `# AquaTools Production Robots Directives
User-agent: *
Allow: /
Allow: /*.js
Allow: /*.css
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.webp
Allow: /*.svg
Allow: /*.ico
Allow: /*.json
Allow: /*.webmanifest
Allow: /*.wasm

# Disallow private user local state routes
Disallow: /#/settings
Disallow: /#/favorites
Disallow: /settings
Disallow: /favorites

Sitemap: ${SITE_URL}/sitemap.xml
`;

  const robotsPath = path.join(publicDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxtContent, 'utf-8');
  console.log(`[SEO Generator] Written ${robotsPath}`);

  // 2. Identify Coming Soon tool slugs
  const comingSoonSlugs = new Set(
    PDF_TOOLS.filter((t) => t.implementationStatus === 'coming-soon').map((t) => t.slug)
  );

  console.log(`[SEO Generator] Filtered out ${comingSoonSlugs.size} Coming-Soon tool(s):`, Array.from(comingSoonSlugs));

  // 3. Build list of sitemap entries
  interface SitemapEntry {
    loc: string;
    priority: string;
    changefreq: string;
  }

  const entries: SitemapEntry[] = [];

  // Core Static Pages
  entries.push({ loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' });
  entries.push({ loc: `${SITE_URL}/#/all-tools`, priority: '0.9', changefreq: 'daily' });
  entries.push({ loc: `${SITE_URL}/#/pdf-hub`, priority: '0.9', changefreq: 'daily' });
  entries.push({ loc: `${SITE_URL}/#/image-hub`, priority: '0.9', changefreq: 'daily' });
  entries.push({ loc: `${SITE_URL}/#/fileconv-hub`, priority: '0.9', changefreq: 'daily' });
  entries.push({ loc: `${SITE_URL}/#/privacy`, priority: '0.5', changefreq: 'monthly' });
  entries.push({ loc: `${SITE_URL}/#/security`, priority: '0.5', changefreq: 'monthly' });
  entries.push({ loc: `${SITE_URL}/#/about`, priority: '0.5', changefreq: 'monthly' });
  entries.push({ loc: `${SITE_URL}/#/contact`, priority: '0.5', changefreq: 'monthly' });
  entries.push({ loc: `${SITE_URL}/#/terms`, priority: '0.5', changefreq: 'monthly' });

  // Category Hubs
  for (const cat of MASTER_CATEGORIES) {
    entries.push({
      loc: `${SITE_URL}/#/category/${cat.id}`,
      priority: '0.8',
      changefreq: 'weekly',
    });
  }

  for (const cat of PDF_CATEGORIES) {
    entries.push({
      loc: `${SITE_URL}/#/pdf-category/${cat.id}`,
      priority: '0.8',
      changefreq: 'weekly',
    });
  }

  for (const cat of IMAGE_CATEGORIES) {
    entries.push({
      loc: `${SITE_URL}/#/image-category/${cat.id}`,
      priority: '0.8',
      changefreq: 'weekly',
    });
  }

  // Active Tool Pages
  const addedToolSlugs = new Set<string>();

  for (const tool of ALL_UNIFIED_TOOLS) {
    if (comingSoonSlugs.has(tool.slug)) {
      continue;
    }
    if (addedToolSlugs.has(tool.slug)) {
      continue;
    }
    addedToolSlugs.add(tool.slug);

    const priority = tool.isPopular ? '0.8' : '0.7';
    entries.push({
      loc: `${SITE_URL}/#/tool/${tool.slug}`,
      priority,
      changefreq: 'weekly',
    });
  }

  console.log(`[SEO Generator] Total active tool routes included: ${addedToolSlugs.size}`);
  console.log(`[SEO Generator] Total sitemap URLs generated: ${entries.length}`);

  // Construct XML
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const entry of entries) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${entry.loc}</loc>`);
    xmlLines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${entry.priority}</priority>`);
    xmlLines.push('  </url>');
  }

  xmlLines.push('</urlset>');
  xmlLines.push('');

  const sitemapContent = xmlLines.join('\n');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
  console.log(`[SEO Generator] Written ${sitemapPath}`);

  // Copy to dist if dist exists
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(robotsPath, path.join(distDir, 'robots.txt'));
    fs.copyFileSync(sitemapPath, path.join(distDir, 'sitemap.xml'));
    console.log(`[SEO Generator] Copied SEO files to ${distDir}`);
  }

  console.log('[SEO Generator] Completed successfully.');
}

generateSeoFiles();
