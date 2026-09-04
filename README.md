# AquaTools 🌊

**AquaTools** is a high-speed, privacy-focused, client-side suite of 192 document, image, media, developer, design, and file conversion utilities.

Every tool executes **entirely inside your local web browser** using modern Web Standards (Web Crypto, HTML5 Canvas, PDF-Lib, Mozilla PDF.js, JSZip). Your files, documents, passwords, and private data **never leave your device**.

---

## 🛡️ Privacy Model & Zero-Upload Architecture

Unlike traditional online converter services that upload your confidential PDFs, contracts, employee records, and photos to remote servers, **AquaTools operates under a strict zero-cloud architecture**:

1. **Zero Server Uploads**: No backend server receives or processes your files. Payloads are read directly into browser memory (RAM) via standard HTML5 `FileReader` and `Blob` APIs.
2. **Zero Telemetry & Tracking**: No analytics trackers, no advertising beacons, no third-party cookies, and no telemetry pings.
3. **No Login Required**: No accounts, authentication tokens, or personal identity collection.
4. **Self-Hosted & Offline Ready**: All PDF rendering engines, Mozilla PDF.js workers, and runtime assets are self-hosted within the application package (`/pdfjs/`). Once cached by the PWA Service Worker, conversions run seamlessly in complete physical network isolation (e.g., Airplane Mode).

---

## 🔒 Security Architecture & Threat Model

### 1. Hardware Web Crypto CSPRNG
All random tokens, UUID v4 identifiers, Diceware passphrases, and numeric PINs are generated exclusively using `window.crypto.getRandomValues()` and `window.crypto.subtle`. This guarantees operating-system-level cryptographic entropy.

### 2. Sandbox Isolation & XSS Defense
- **Interactive HTML & Code Previews**: Rendered inside isolated sandboxed `<iframe>` instances with `sandbox="allow-scripts"` (strictly omitting `allow-same-origin` and `allow-top-navigation`). This ensures untrusted user scripts cannot access the parent page's DOM, cookies, or storage.
- **SVG & Markdown Previews**: Sanitized against malicious inline event handlers (`onload`, `onerror`), script tags, and `javascript:` URIs prior to DOM rendering.

### 3. Proactive Memory Cleanup & URL Revocation
To prevent confidential data lingering in browser memory, all temporary Object URLs (`blob:...`) are explicitly revoked via `URL.revokeObjectURL()` immediately when files are closed, converted, or reset.

### 4. Local Storage Policy
AquaTools stores **only** non-sensitive user-selected UI preferences in browser `localStorage`:
- Visual Theme (`dark`, `light`, `system`)
- Reduced Motion Preference (`system`, `reduce`, `no-preference`)
- Bookmarked tool slug strings (e.g. `["image-converter", "pdf-merge-split"]`)
- Optional recently visited tool slug strings (if user enables history)

**0 Bytes of file payloads, document contents, converted outputs, passwords, or personal data are ever persisted to disk or storage.**

Users can view and audit all storage keys or perform an immediate full purge via the built-in **Storage Audit & Data Purge** tool in the Settings page.

---

## 🧰 Available Tool Suite (192 Tools)

The application features 192 client-side tools across 4 specialized hubs and unified search:
- **PDF Workstation**: 50 PDF tools (compression, conversion, split/merge, redaction, forms, OCR prep, repair, metadata)
- **Image Hub**: 48 image utilities (filters, compression, format conversion, EXIF scrubber, canvas effects, vector tracing)
- **File Conversion Hub**: 48 file converters (text, data, audio conversion, subtitle transforms, archive packaging)
- **Developer & Generator Suite**: 46 utilities (hash generation, UUIDs, crypto passphrases, QR codes, code formatters, JWT inspection)

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

## 💻 Tech Stack & Authoritative Versions

- **Package Manager**: `npm@10.9.8` only (`package-lock.json` is the single authoritative lockfile; `bun.lock` removed)
- **Runtime**: Node.js `v22.23.2`
- **Framework**: [React](https://react.dev/) `19.1.0` with [TypeScript](https://www.typescriptlang.org/) `5.8.3` & [Vite](https://vite.dev/) `6.4.3`
- **Testing**: [Vitest](https://vitest.dev/) `4.1.11` (13 test files, 187 automated unit tests)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **PDF Engines**: [pdf-lib](https://pdf-lib.js.org/) & [pdfjs-dist](https://mozilla.github.io/pdf.js/) (self-hosted worker, CMaps, and fonts)
- **Archives & Compaction**: [JSZip](https://stuk.github.io/jszip/)
- **Text Diff Engine**: [diff](https://github.com/kpdecker/jsdiff)
- **Barcode & 2D Matrix**: [qrcode](https://github.com/soldair/node-qrcode)
- **Animation & Motion**: [motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/) (tree-shaken named imports)
- **Cryptography**: Native W3C Web Crypto API (`window.crypto.getRandomValues`, `window.crypto.subtle`)

---

## 🚀 Development & CI Commands

The project is standardized on **npm** only. All continuous integration workflows and local environments should execute:

```bash
# 1. Clean reproducible dependency install from package-lock.json
npm ci

# 2. Typecheck and linting (0 errors)
npm run lint

# 3. Run full automated test suite (187 unit tests, 13 test files)
npm test

# 4. Production build with PWA service worker and asset validation
npm run build

# 5. Full CI verification pipeline (runs lint, test, and build in sequence)
npm run ci

# Preview the production build locally
npm run preview

# Generate and validate production SEO files (robots.txt, sitemap.xml)
npm run validate:seo

# Validate PWA manifest and self-hosted asset integrity
npm run validate:pwa
```

---

## 🔍 Production SEO Foundation & Domain Configuration

AquaTools includes a production SEO system:

### 1. Domain Configuration (`SITE_URL`)
- Default domain: `https://aquatools.app`
- To configure your production domain, set `VITE_SITE_URL` in your `.env` file or pass `SITE_URL` as an environment variable during build:
  ```env
  VITE_SITE_URL="https://your-custom-domain.com"
  SITE_URL="https://your-custom-domain.com"
  ```
- Configured in `src/config/appConfig.ts` (`APP_CONFIG.SITE_URL` / `SITE_URL`).

### 2. Robots Directives (`public/robots.txt` & `dist/robots.txt`)
- Allows public indexing of main pages, category hubs, and implemented tool routes.
- Explicitly disallows private local utility state routes (`/#/settings`, `/#/favorites`).
- Includes `Sitemap: https://aquatools.app/sitemap.xml`.

### 3. Dynamic Sitemap (`public/sitemap.xml` & `dist/sitemap.xml`)
- Programmatically generated via `scripts/generate-seo-files.ts`.
- Automatically indexes homepage, Explore page, category hubs, Privacy, Security, About, Contact, Terms, and all **187 implemented, active tools**.
- Automatically excludes any tools marked as "Coming Soon".

### 4. Canonical URLs & Dynamic Social Preview Metadata
- SPA routes update `<title>`, `<meta name="description">`, `<link rel="canonical">`, Open Graph (`og:*`), and Twitter Card (`twitter:*`) tags dynamically on hash route changes via `src/services/seo.ts`.

---

## 📄 License
MIT License. Built for speed, privacy, and client-side engineering excellence.
