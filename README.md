# AquaTools 🌊

**AquaTools** is a high-speed, privacy-first, 100% client-side suite of document, image, developer, design, and file utilities.

Every tool executes **entirely inside your local web browser** using modern Web Standards (Web Crypto, HTML5 Canvas, PDF-Lib, Mozilla PDF.js, JSZip). Your files, documents, passwords, and private data **never leave your device**.

---

## 🛡️ Privacy Model & Verified Zero-Upload Guarantee

Unlike traditional online converter services that upload your confidential PDFs, contracts, employee records, and photos to remote servers, **AquaTools operates under a strict zero-cloud architecture**:

1. **Zero Server Uploads**: No backend server receives or processes your files. Payloads are read directly into browser memory (RAM) via standard HTML5 `FileReader` and `Blob` APIs.
2. **Zero Telemetry & Tracking**: No analytics trackers, no advertising beacons, no third-party cookies, and no telemetry pings.
3. **No Login Required**: No accounts, authentication tokens, or personal identity collection.
4. **100% Self-Hosted & Offline Ready**: All PDF rendering engines, Mozilla PDF.js workers, CMap character maps, and standard fonts are self-hosted within the application package (`/public/pdfjs/`). Once cached by the PWA Service Worker, all conversions run seamlessly in complete physical network isolation (e.g., Airplane Mode).

---

## 🔒 Security Architecture & Threat Model

### 1. Hardware Web Crypto CSPRNG
All random tokens, UUID v4 identifiers, Diceware passphrases, and numeric PINs are generated exclusively using `window.crypto.getRandomValues()` and `window.crypto.subtle`. This guarantees true operating-system-level cryptographic entropy with rejection sampling.

### 2. Sandbox Isolation & XSS Defense
- **Interactive HTML & Code Previews**: Rendered inside isolated sandboxed `<iframe>` instances with `sandbox="allow-scripts"` (strictly omitting `allow-same-origin` and `allow-top-navigation`). This ensures untrusted user scripts cannot access the parent page's DOM, cookies, or storage.
- **SVG & Markdown Previews**: Sanitized against malicious inline event handlers (`onload`, `onerror`), script tags, and `javascript:` URIs prior to DOM rendering.

### 3. Proactive Memory Cleanup & URL Revocation
To prevent confidential data lingering in browser memory, all temporary Object URLs (`blob:...`) are explicitly revoked via `URL.revokeObjectURL()` immediately when files are closed, converted, or reset.

### 4. Local Storage Policy
AquaTools stores **only** user-selected UI preferences in browser `localStorage`:
- Visual Theme (`dark`, `light`, `system`)
- Reduced Motion Preference (`system`, `reduce`, `no-preference`)
- Bookmarked tool slug strings (e.g. `["image-converter", "pdf-merge-split"]`)
- Optional recently visited tool slug strings (if user enables history)

**Confirmed: 0 Bytes of file payloads, document contents, converted outputs, passwords, or personal data are ever persisted to disk or storage.**

Users can view and audit all storage keys or perform an immediate full purge via the built-in **Storage Audit & Data Purge** tool in the Settings page.

---

## 🧰 Available Tool Suite

### 🔄 Converters & Media
- **Image Converter**: Lossless PNG, JPEG, WebP, AVIF, BMP conversion with quality sliders and batch ZIP export.
- **Color Converter**: HEX, RGB, RGBA, HSL, HSLA, HSV, CMYK conversion with WCAG AA/AAA contrast analyzer.
- **Timestamp & Date Converter**: Unix epoch seconds/milliseconds to human-readable ISO-8601, UTC, and relative dates.
- **Base64 Encoder/Decoder**: Text, JSON, and binary file Base64 encoding/decoding with live data URL preview.
- **URL Encoder/Decoder**: RFC 3986 URL component encoding, query string parser, and parameter builder.
- **JSON ↔ CSV ↔ YAML Converter**: Bidirectional structured data conversion with delimiters and nested key flattening.

### 📄 Document & PDF Workstation Suite
- **PDF Compression & Optimization**: Lossy visual downsampling (72, 100, 150 DPI) and lossless stream compaction with real-time size savings computation.
- **Extract PDF Images**: Extract embedded raster graphics and photos into individual files packaged into a ZIP archive.
- **Repair Corrupted PDF**: Salvage corrupted cross-reference (xref) tables, repair broken trailers, and recover pages via dual-stage byte reconstruction.
- **PDF/A Archival Preservation**: ISO 19005 archival compliance with sRGB OutputIntents, XMP schema injection, and embedded script purging.
- **Web Stream & Object Optimizer**: Deflates stream dictionaries and reorganizes object hierarchies for efficient sequential reading.
- **PDF Annotate & Draw**: Freehand drawing, highlighters, text notes, stamps, and shapes embedded directly into the vector stream.
- **Interactive Form Filling & Creation**: Fill AcroForm text fields/checkboxes or design new interactive forms from scratch.
- **N-Up Multi-Page Compositing**: Fit 2, 4, 6, 9, or 16 pages per printable sheet for booklets, index cards, and paper savings.
- **Halve 2-Page Spreads**: Split scanned book spreads or dual-page layouts into individual portrait pages.
- **PDF Overlay & Letterhead**: Superimpose stationery templates, letterheads, or background stamps onto target documents.
- **PDF Visual Comparator & Diff**: Pixel-level visual diff with split curtain slider and difference highlights.
- **Bookmarks & Table of Contents**: Build interactive navigation outlines and auto-prepend a formatted Table of Contents.
- **PDF Merge & Split**: Combine multiple documents or extract custom page ranges (e.g., `1-3, 5, 8-10`) with ZIP export.
- **Organize & Rotate Pages**: Visual drag-and-drop grid to reorder, duplicate, rotate, and delete pages.
- **Images ↔ PDF**: Convert JPG/PNG/WebP images to PDF, or rasterize PDF pages to high-res images.
- **Crop Margins & Pagination**: Trim white borders and stamp customizable page numbers with dynamic format templates.
- **Protect & Unlock PDF**: Web Crypto 128-bit encryption with permission flags and authorized password removal.
- **Sanitize & Edit Metadata**: Strip hidden author tags, producer software signatures, and edit title/subject tags.
- **Office Document Guides**: Explicit guidance and native 100% private offline workflows (Print to PDF / Save As) for proprietary Office files, avoiding insecure cloud upload traps.

### 🛠️ Developer Tools
- **Code Formatter & Minifier**: Beautify and compress JSON, HTML, CSS, JavaScript, and SQL.
- **Regex Tester & Debugger**: Real-time RegEx engine with flag support, match highlighting, and capture group tables.
- **JWT Decoder & Inspector**: Parse JSON Web Token headers, payloads, claims, expiration timestamps, and signature verification notes.
- **Markdown Live Preview**: Side-by-side Markdown editor with sanitized live preview and HTML export.
- **Text Diff & Case Utilities**: Side-by-side line diff, word counters, and case converters (camelCase, snake_case, kebab-case, Title Case).

### 🎨 Design & Generator Suite
- **Favicon Generator**: Generate 16x16, 32x32, 48x48, 180x180 (Apple Touch), 192x192, and 512x512 PWA icons packaged into a ZIP with HTML meta tag snippet.
- **Open Graph & Social Card Generator**: Live preview cards for Twitter/X, Facebook, Discord, and Google SERP.
- **CSS Palette & Harmony Generator**: Triadic, complementary, analogous, and monochromatic palette builder with lockable swatches and WCAG contrast ratings.
- **CSS Gradient & Shadow Generator**: Multi-stop linear/radial gradients and multi-layered box-shadow designers.
- **Robots.txt & Sitemap.xml Generator**: Crawler directives with AI bot shields and XML sitemap builders.
- **UUID & Random Data Generator**: RFC 4122 UUID v4, mock user profiles, list shufflers, and CSPRNG tokens.
- **Passphrase & PIN Generator**: Memorable Diceware passphrases and numeric PINs with entropy strength metrics.
- **QR Code Generator**: High-resolution QR code generator with error correction levels and SVG/PNG export.

---

## 🌐 Browser Compatibility & Resource Limitations

| Browser | Minimum Version | Status |
| :--- | :--- | :--- |
| **Google Chrome / Chromium** | v88+ | ✅ Fully Supported (PWA Installable) |
| **Apple Safari** | v14.1+ | ✅ Fully Supported |
| **Mozilla Firefox** | v78+ | ✅ Fully Supported |
| **Microsoft Edge** | v88+ | ✅ Fully Supported |
| **iOS Safari** | iOS 15+ | ✅ Fully Supported |
| **Android Chrome** | v88+ | ✅ Fully Supported |

### Memory & File Size Guidelines
Because all operations take place in client-side RAM without server clusters:
- **Recommended PDF size**: Up to 50MB (documents with 200+ pages may require 2-4 GB of browser RAM).
- **Recommended Image size**: Up to 35MB per file (batch up to 50 files).
- **Mobile Devices**: Large batch conversions may be constrained by mobile OS tab memory caps (iOS WebKit ~1.5 GB ceiling).

---

## 💻 Tech Stack & Dependencies

- **Framework**: [React 19](https://react.dev/) (`^19.0.1`) with [TypeScript](https://www.typescriptlang.org/) & [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **PDF Engines**: [pdf-lib](https://pdf-lib.js.org/) & [pdfjs-dist](https://mozilla.github.io/pdf.js/) (100% self-hosted worker, CMaps, and fonts)
- **Archives & Compaction**: [JSZip](https://stuk.github.io/jszip/)
- **Text Diff Engine**: [diff](https://github.com/kpdecker/jsdiff)
- **Barcode & 2D Matrix**: [qrcode](https://github.com/soldair/node-qrcode)
- **Animation & Motion**: [motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Cryptography**: Native W3C Web Crypto API (`window.crypto.getRandomValues`, `window.crypto.subtle`)

---

## 🚀 Development & Verification Commands

```bash
# Install dependencies using standardized npm
npm install

# Run development server (binds to 0.0.0.0:3000)
npm run dev

# Run full test suite (169+ unit tests)
npm test

# Build for production with manual chunk code-splitting
npm run build

# Validate PWA manifest and self-hosted asset integrity
npm run validate:pwa

# Complete CI pipeline check
npm run ci
```

---

## 📄 License
MIT License. Built for speed, privacy, and client-side engineering excellence.
