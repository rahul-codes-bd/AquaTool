import fs from 'fs';
import path from 'path';

const EXPECTED_ASSETS = [
  { file: 'favicon.ico', expectedMime: 'image/x-icon', checkMagic: (buf) => buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0 },
  { file: 'icon.svg', expectedMime: 'image/svg+xml', checkMagic: (buf) => buf.toString('utf-8').includes('<svg') },
  { file: 'apple-touch-icon.png', expectedMime: 'image/png', checkMagic: (buf) => buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 },
  { file: 'pwa-192x192.png', expectedMime: 'image/png', checkMagic: (buf) => buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 },
  { file: 'pwa-512x512.png', expectedMime: 'image/png', checkMagic: (buf) => buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 },
  { file: 'pdfjs/pdf.worker.min.mjs', expectedMime: 'text/javascript', checkMagic: (buf) => buf.length > 50000 },
];

console.log('[PWA Asset Validation] Checking manifest & includeAssets integrity...');

let hasError = false;
const checkDir = (baseDir, label) => {
  if (!fs.existsSync(baseDir)) {
    console.warn(`[Skip] Directory ${label} does not exist yet.`);
    return;
  }

  for (const item of EXPECTED_ASSETS) {
    const fullPath = path.join(baseDir, item.file);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ [FAIL] Missing asset in ${label}: ${item.file}`);
      hasError = true;
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (stat.size === 0) {
      console.error(`❌ [FAIL] Zero-byte empty asset in ${label}: ${item.file}`);
      hasError = true;
      continue;
    }

    const buf = fs.readFileSync(fullPath);
    if (!item.checkMagic(buf)) {
      console.error(`❌ [FAIL] Magic bytes invalid for ${item.file} (expected ${item.expectedMime})`);
      hasError = true;
      continue;
    }

    console.log(`✓ [OK] ${label}/${item.file} (${stat.size} bytes, ${item.expectedMime})`);
  }
};

checkDir(path.resolve(process.cwd(), 'public'), 'public');
if (fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
  checkDir(path.resolve(process.cwd(), 'dist'), 'dist');
}

if (hasError) {
  console.error('PWA Asset validation failed.');
  process.exit(1);
} else {
  console.log('✓ All PWA & self-hosted assets passed integrity verification.');
}
