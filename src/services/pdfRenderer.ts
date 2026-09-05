import * as pdfjsLib from 'pdfjs-dist';

// Configure Mozilla PDF.js worker client-side using self-hosted local worker & assets
if (typeof window !== 'undefined') {
  try {
    // Self-hosted local worker ensures 100% offline capability with zero external CDN dependency
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
  } catch (err) {
    console.warn('PDF.js worker initialization warning:', err);
  }
}

export interface RenderPageResult {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

export class PdfRenderer {
  private static cachedDocMap = new WeakMap<ArrayBuffer, any>();

  /**
   * Loads a PDF Document using PDF.js with 100% self-hosted assets
   */
  static async loadPdfDocument(data: ArrayBuffer | Uint8Array | Blob | File): Promise<any> {
    let buffer: ArrayBuffer;
    if (data instanceof Blob) {
      buffer = await data.arrayBuffer();
    } else if (data instanceof Uint8Array) {
      buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    } else {
      buffer = data;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      cMapUrl: '/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/pdfjs/standard_fonts/',
      enableScripting: false,
      isEvalSupported: false,
    } as any);

    return await loadingTask.promise;
  }

  /**
   * Renders a specific 1-indexed page of a PDF into an HTML Canvas & DataURL
   */
  static async renderPage(
    pdfDocOrBuffer: any | ArrayBuffer | Blob | File,
    pageNumber: number,
    scale = 1.5,
    format: 'image/png' | 'image/jpeg' = 'image/png',
    quality = 0.92
  ): Promise<RenderPageResult> {
    let doc = pdfDocOrBuffer;
    if (!doc.getPage) {
      doc = await this.loadPdfDocument(pdfDocOrBuffer);
    }

    const totalPages = doc.numPages;
    const safePageNum = Math.max(1, Math.min(pageNumber, totalPages));
    const page = await doc.getPage(safePageNum);

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('Canvas 2D context is not supported in this browser.');
    }

    // Fill white background for JPEGs or transparent pages
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: context,
      viewport,
    };

    await page.render(renderContext).promise;

    const dataUrl = canvas.toDataURL(format, quality);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create image blob from canvas'));
        },
        format,
        quality
      );
    });

    return {
      pageNumber: safePageNum,
      canvas,
      dataUrl,
      blob,
      width: canvas.width,
      height: canvas.height,
    };
  }

  /**
   * Renders thumbnail for each page (scale ~0.3 - 0.5) for quick visual reordering grids
   */
  static async renderThumbnails(
    file: File | Blob | ArrayBuffer,
    maxPages = 50,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<{ pageNumber: number; dataUrl: string; width: number; height: number }[]> {
    const doc = await this.loadPdfDocument(file);
    const total = Math.min(doc.numPages, maxPages);
    const thumbnails: { pageNumber: number; dataUrl: string; width: number; height: number }[] = [];

    for (let i = 1; i <= total; i++) {
      const res = await this.renderPage(doc, i, 0.4, 'image/jpeg', 0.8);
      thumbnails.push({
        pageNumber: i,
        dataUrl: res.dataUrl,
        width: res.width,
        height: res.height,
      });
      onProgress?.(i, total);
    }

    return thumbnails;
  }

  /**
   * Compares two rendered pages pixel-by-pixel and returns difference metrics and diff canvas
   */
  static comparePageCanvases(
    canvasA: HTMLCanvasElement,
    canvasB: HTMLCanvasElement,
    threshold = 0.1
  ): { diffCanvas: HTMLCanvasElement; diffDataUrl: string; diffPercentage: number; diffPixels: number } {
    const width = Math.max(canvasA.width, canvasB.width);
    const height = Math.max(canvasA.height, canvasB.height);

    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = width;
    diffCanvas.height = height;
    const diffCtx = diffCanvas.getContext('2d');
    if (!diffCtx) throw new Error('Cannot get 2D context for diff canvas');

    const ctxA = canvasA.getContext('2d');
    const ctxB = canvasB.getContext('2d');
    if (!ctxA || !ctxB) throw new Error('Cannot get source canvas contexts');

    const imgA = ctxA.getImageData(0, 0, canvasA.width, canvasA.height);
    const imgB = ctxB.getImageData(0, 0, canvasB.width, canvasB.height);
    const diffImg = diffCtx.createImageData(width, height);

    let diffPixels = 0;
    const totalPixels = width * height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const inA = x < canvasA.width && y < canvasA.height;
        const inB = x < canvasB.width && y < canvasB.height;

        const idxA = (y * canvasA.width + x) * 4;
        const idxB = (y * canvasB.width + x) * 4;

        const r1 = inA ? imgA.data[idxA] : 255;
        const g1 = inA ? imgA.data[idxA + 1] : 255;
        const b1 = inA ? imgA.data[idxA + 2] : 255;

        const r2 = inB ? imgB.data[idxB] : 255;
        const g2 = inB ? imgB.data[idxB + 1] : 255;
        const b2 = inB ? imgB.data[idxB + 2] : 255;

        const delta = (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)) / (3 * 255);

        if (delta > threshold) {
          diffPixels++;
          // Highlight differences in high-contrast red/magenta
          diffImg.data[idx] = 239; // R
          diffImg.data[idx + 1] = 68; // G
          diffImg.data[idx + 2] = 68; // B
          diffImg.data[idx + 3] = 230; // A
        } else {
          // Semi-transparent backdrop of the original
          const gray = Math.round((r1 * 0.299 + g1 * 0.587 + b1 * 0.114) * 0.6 + 80);
          diffImg.data[idx] = gray;
          diffImg.data[idx + 1] = gray;
          diffImg.data[idx + 2] = gray;
          diffImg.data[idx + 3] = 70;
        }
      }
    }

    diffCtx.putImageData(diffImg, 0, 0);
    const diffPercentage = (diffPixels / totalPixels) * 100;

    return {
      diffCanvas,
      diffDataUrl: diffCanvas.toDataURL('image/png'),
      diffPercentage: Math.round(diffPercentage * 100) / 100,
      diffPixels,
    };
  }
}
