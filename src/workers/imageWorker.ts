/**
 * AquaTools - Client-Side Image Processing Web Worker
 * 
 * Offloads heavy canvas operations, scaling, and format encoding
 * off the main UI thread using OffscreenCanvas.
 */

export interface WorkerImageProcessRequest {
  id: string;
  type: 'PROCESS_IMAGE';
  imageBitmap: ImageBitmap;
  options: {
    format: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
    width: number;
    height: number;
    backgroundColor?: string;
    crop?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

export interface WorkerImageProcessResponse {
  id: string;
  success: boolean;
  blob?: Blob;
  stats?: {
    originalWidth: number;
    originalHeight: number;
    outputWidth: number;
    outputHeight: number;
    outputSize: number;
  };
  error?: string;
}

// Check if running inside Worker scope
if (typeof self !== 'undefined' && 'postMessage' in self) {
  self.onmessage = async (e: MessageEvent<WorkerImageProcessRequest>) => {
    const data = e.data;
    if (!data || data.type !== 'PROCESS_IMAGE') return;

    const { id, imageBitmap, options } = data;

    try {
      if (typeof OffscreenCanvas === 'undefined') {
        throw new Error('OffscreenCanvas is not supported in this Web Worker');
      }

      const origW = imageBitmap.width;
      const origH = imageBitmap.height;

      const targetW = Math.max(1, Math.round(options.width));
      const targetH = Math.max(1, Math.round(options.height));

      const offscreen = new OffscreenCanvas(targetW, targetH);
      const ctx = offscreen.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get 2D context from OffscreenCanvas');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background color
      if (options.backgroundColor && options.backgroundColor !== 'transparent') {
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (options.format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
      }

      // Draw image or crop box
      if (options.crop) {
        ctx.drawImage(
          imageBitmap,
          options.crop.x,
          options.crop.y,
          options.crop.width,
          options.crop.height,
          0,
          0,
          targetW,
          targetH
        );
      } else {
        ctx.drawImage(imageBitmap, 0, 0, targetW, targetH);
      }

      // Release the ImageBitmap memory immediately in the worker
      imageBitmap.close();

      const quality = options.quality !== undefined ? options.quality : 0.92;
      const blob = await offscreen.convertToBlob({
        type: options.format,
        quality,
      });

      const response: WorkerImageProcessResponse = {
        id,
        success: true,
        blob,
        stats: {
          originalWidth: origW,
          originalHeight: origH,
          outputWidth: targetW,
          outputHeight: targetH,
          outputSize: blob.size,
        },
      };

      self.postMessage(response);
    } catch (err: unknown) {
      // Ensure imageBitmap is closed to release memory
      try {
        if (imageBitmap && typeof imageBitmap.close === 'function') {
          imageBitmap.close();
        }
      } catch {
        // ignore
      }

      const msg = err instanceof Error ? err.message : 'Worker processing failed';
      const response: WorkerImageProcessResponse = {
        id,
        success: false,
        error: msg,
      };
      self.postMessage(response);
    }
  };
}
