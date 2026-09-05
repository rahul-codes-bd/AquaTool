import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// CRC32 table & helper for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(width, height, renderPixel) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR: width, height, bit-depth=8, color-type=6 (RGBA), comp=0, filter=0, interlace=0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with 1 byte filter (0 = None) per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = renderPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Shader for AquaTools Icon
function renderAquaIcon(x, y, w, h) {
  const u = x / w; // 0..1
  const v = y / h; // 0..1

  // Normalized coordinates with center (0, 0)
  const nx = (x - w / 2) / (w / 2);
  const ny = (y - h / 2) / (h / 2);

  // Background rounded rectangle (rx ~ 0.22)
  const cornerRadius = 0.44;
  const qx = Math.max(0, Math.abs(nx) - (1 - cornerRadius));
  const qy = Math.max(0, Math.abs(ny) - (1 - cornerRadius));
  const distOuter = Math.sqrt(qx * qx + qy * qy);

  if (distOuter > cornerRadius) {
    return [0, 0, 0, 0]; // Transparent outside rounded corner
  }

  // Base background gradient: dark slate/indigo (#091322 to #030712)
  let br = 9 + (3 - 9) * v;
  let bg = 19 + (7 - 19) * v;
  let bb = 34 + (18 - 34) * v;

  // Thin border stroke (#0ea5e9 at 30% opacity)
  if (distOuter > cornerRadius - 0.04) {
    br = Math.min(255, br * 0.7 + 14 * 0.3);
    bg = Math.min(255, bg * 0.7 + 165 * 0.3);
    bb = Math.min(255, bb * 0.7 + 233 * 0.3);
  }

  // Water Droplet shape calculation
  // Droplet tip at (0, -0.62), bottom bulb center at (0, 0.22), radius 0.46
  const dx = nx;
  const dy = ny - 0.06; // shift slightly down

  // Bulb circle
  const bulbCenterY = 0.22;
  const bulbRadius = 0.48;
  const distBulb = Math.sqrt(dx * dx + (dy - bulbCenterY) * (dy - bulbCenterY));

  // Taper cone from tip (0, -0.62) to bulb tangent
  const tipY = -0.62;
  let inDroplet = false;
  let dropFactor = 0;

  if (distBulb <= bulbRadius && dy >= bulbCenterY - 0.1) {
    inDroplet = true;
    dropFactor = 1 - distBulb / bulbRadius;
  } else if (dy < bulbCenterY && dy >= tipY) {
    // Cone sides
    const t = (dy - tipY) / (bulbCenterY - tipY);
    const halfWidth = t * (bulbRadius * 0.94);
    if (Math.abs(dx) <= halfWidth) {
      inDroplet = true;
      dropFactor = 1 - Math.abs(dx) / (halfWidth + 0.001);
    }
  }

  if (inDroplet) {
    // Droplet gradient: vibrant Cyan to Sky Blue (#38bdf8 to #0284c7)
    const tDrop = (dy - tipY) / (bulbCenterY + bulbRadius - tipY);
    const dr = 56 + (2 - 56) * tDrop;
    const dg = 189 + (132 - 189) * tDrop;
    const db = 248 + (199 - 248) * tDrop;

    // Specular highlight on upper-left
    const hlDist = Math.sqrt((dx + 0.16) * (dx + 0.16) + (dy + 0.1) * (dy + 0.1));
    let highlight = 0;
    if (hlDist < 0.22) {
      highlight = (1 - hlDist / 0.22) * 0.75;
    }

    // Blend highlight
    const finalR = Math.min(255, Math.round(dr + (255 - dr) * highlight));
    const finalG = Math.min(255, Math.round(dg + (255 - dg) * highlight));
    const finalB = Math.min(255, Math.round(db + (255 - db) * highlight));

    return [finalR, finalG, finalB, 255];
  }

  // Soft ambient glow behind droplet
  const distCenter = Math.sqrt(nx * nx + (ny - 0.1) * (ny - 0.1));
  if (distCenter < 0.7) {
    const glow = (1 - distCenter / 0.7) * 0.25;
    br = Math.min(255, Math.round(br + 14 * glow));
    bg = Math.min(255, Math.round(bg + 165 * glow));
    bb = Math.min(255, Math.round(bb + 233 * glow));
  }

  return [Math.round(br), Math.round(bg), Math.round(bb), 255];
}

// 1. Generate icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#091322"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="dropGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect width="508" height="508" x="2" y="2" rx="110" fill="none" stroke="#0ea5e9" stroke-width="4" stroke-opacity="0.3"/>
  <circle cx="256" cy="270" r="140" fill="#0284c7" opacity="0.25" filter="url(#glow)"/>

  <g transform="translate(0, 10)">
    <path d="M256 90 C256 90 140 240 140 330 C140 395 192 446 256 446 C320 446 372 395 372 330 C372 240 256 90 256 90 Z" 
          fill="url(#dropGrad)" />
    <path d="M256 120 C256 120 165 248 165 325 C165 365 188 405 230 422 C200 405 185 370 185 330 C185 260 256 150 256 120 Z" 
          fill="#ffffff" opacity="0.45" />
    <path d="M170 335 Q210 310 256 335 T342 335 C336 385 300 425 256 425 C212 425 176 385 170 335 Z" 
          fill="url(#accentGrad)" />
    <circle cx="280" cy="230" r="14" fill="#ffffff" opacity="0.8"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('✓ Created public/icon.svg');

// 2. Generate PNGs
const png512 = generatePng(512, 512, renderAquaIcon);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
console.log(`✓ Created public/pwa-512x512.png (${png512.length} bytes)`);

const png192 = generatePng(192, 192, renderAquaIcon);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
console.log(`✓ Created public/pwa-192x192.png (${png192.length} bytes)`);

const png180 = generatePng(180, 180, renderAquaIcon);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
console.log(`✓ Created public/apple-touch-icon.png (${png180.length} bytes)`);

const png32 = generatePng(32, 32, renderAquaIcon);

// Create valid ICO file wrapping the 32x32 PNG
// ICO Header (6 bytes)
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type: 1 = ICO
icoHeader.writeUInt16LE(1, 4); // count: 1 image

// ICO Directory Entry (16 bytes)
const icoDir = Buffer.alloc(16);
icoDir[0] = 32; // width
icoDir[1] = 32; // height
icoDir[2] = 0;  // palette colors
icoDir[3] = 0;  // reserved
icoDir.writeUInt16LE(1, 4);  // color planes
icoDir.writeUInt16LE(32, 6); // bits per pixel
icoDir.writeUInt32LE(png32.length, 8); // image size
icoDir.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

const icoBuffer = Buffer.concat([icoHeader, icoDir, png32]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
console.log(`✓ Created public/favicon.ico (${icoBuffer.length} bytes)`);

console.log('All PWA assets created with 100% precision.');
