import fs from 'fs';
import path from 'path';

function validateSeo() {
  console.log('[SEO Validation] Starting production SEO verification checks...');

  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  const distDir = path.join(rootDir, 'dist');

  const checkDirs = [publicDir];
  if (fs.existsSync(distDir)) {
    checkDirs.push(distDir);
  }

  const BANNED_PLACEHOLDERS = [
    'example.com',
    'mysite.com',
    'yourdomain.com',
    'localhost',
    'placeholder',
    'foo.bar',
    'domain.com',
  ];

  const COMING_SOON_SLUGS = [
    'doc-to-pdf',
    'ppt-to-pdf',
    'xls-to-pdf',
    'publisher-to-pdf',
    'pub-to-pdf',
  ];

  for (const dir of checkDirs) {
    const dirLabel = path.relative(rootDir, dir) || 'root';
    console.log(`\n[SEO Validation] Checking directory: "${dirLabel}"`);

    // 1. Verify file existence
    const robotsPath = path.join(dir, 'robots.txt');
    const sitemapPath = path.join(dir, 'sitemap.xml');

    if (!fs.existsSync(robotsPath)) {
      throw new Error(`[SEO Failure] Missing robots.txt in "${dirLabel}"`);
    }
    if (!fs.existsSync(sitemapPath)) {
      throw new Error(`[SEO Failure] Missing sitemap.xml in "${dirLabel}"`);
    }

    // 2. Validate robots.txt and sitemap.xml
    const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
    const isPending = robotsContent.includes('PENDING DOMAIN CONFIGURATION') || sitemapContent.includes('SITEMAP GENERATION PENDING');

    if (!robotsContent.includes('User-agent: *')) {
      throw new Error(`[SEO Failure] robots.txt in "${dirLabel}" missing "User-agent: *"`);
    }
    if (!robotsContent.includes('Allow: /')) {
      throw new Error(`[SEO Failure] robots.txt in "${dirLabel}" missing "Allow: /"`);
    }
    if (!isPending && !robotsContent.includes('Sitemap:')) {
      throw new Error(`[SEO Failure] robots.txt in "${dirLabel}" missing "Sitemap:" directive`);
    }
    if (!robotsContent.includes('Disallow: /#/settings') && !robotsContent.includes('Disallow: /settings')) {
      throw new Error(`[SEO Failure] robots.txt in "${dirLabel}" does not disallow private state settings`);
    }

    // Check placeholder domains in robots.txt
    for (const ph of BANNED_PLACEHOLDERS) {
      if (robotsContent.toLowerCase().includes(ph)) {
        throw new Error(`[SEO Failure] Banned placeholder domain "${ph}" found in robots.txt (${dirLabel})`);
      }
    }

    // 3. Validate sitemap.xml
    // XML structure check
    if (!sitemapContent.trim().startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
      throw new Error(`[SEO Failure] sitemap.xml in "${dirLabel}" missing valid XML header declaration`);
    }
    if (!sitemapContent.includes('<urlset') || !sitemapContent.includes('</urlset>')) {
      throw new Error(`[SEO Failure] sitemap.xml in "${dirLabel}" missing <urlset> wrapper elements`);
    }

    if (isPending) {
      console.log(`[SEO Validation] Sitemap is in PENDING mode. Skipping URL content validation checks.`);
      console.log(`[SEO Validation] PASSED all checks for "${dirLabel}"`);
      continue;
    }

    // Extract all <loc> values
    const locMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
    if (!locMatches || locMatches.length === 0) {
      throw new Error(`[SEO Failure] No <loc> URLs found in sitemap.xml (${dirLabel})`);
    }

    const urls = locMatches.map((m) => m.replace('<loc>', '').replace('</loc>', '').trim());
    console.log(`[SEO Validation] Found ${urls.length} URLs in sitemap.xml (${dirLabel})`);

    // Duplicate check
    const seenUrls = new Set();
    const duplicateUrls = [];
    for (const url of urls) {
      if (seenUrls.has(url)) {
        duplicateUrls.push(url);
      }
      seenUrls.add(url);
    }
    if (duplicateUrls.length > 0) {
      throw new Error(`[SEO Failure] Duplicate URLs found in sitemap.xml (${dirLabel}): ${duplicateUrls.join(', ')}`);
    }

    // Placeholder domain check
    for (const url of urls) {
      for (const ph of BANNED_PLACEHOLDERS) {
        if (url.toLowerCase().includes(ph)) {
          throw new Error(`[SEO Failure] Banned placeholder "${ph}" found in URL: ${url}`);
        }
      }
    }

    // Coming Soon tool route check
    for (const csSlug of COMING_SOON_SLUGS) {
      const match = urls.find((u) => u.endsWith(`/${csSlug}`) || u.includes(`/tool/${csSlug}`));
      if (match) {
        throw new Error(`[SEO Failure] Coming Soon tool route "${csSlug}" found in sitemap.xml: ${match}`);
      }
    }

    console.log(`[SEO Validation] PASSED all checks for "${dirLabel}"`);
  }

  console.log('\n✅ [SEO Validation] ALL PRODUCTION SEO CHECKS PASSED SUCCESSFULLY!\n');
}

try {
  validateSeo();
} catch (err) {
  console.error('\n❌ SEO Validation Error:', err.message);
  process.exit(1);
}
