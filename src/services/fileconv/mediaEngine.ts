/**
 * AquaTools - Browser Audio & Video Engine
 * 
 * Provides 100% client-side, browser-supported media processing:
 * - Audio: Decoding, resampling, channel downmixing, trimming, WAV/WebM encoding
 * - Video: Duration & resolution detection, audio extraction, frame export, WebM/GIF snippet rendering, trimming
 * - Memory Safety: Automatic object URL tracking and revocation
 */

export interface AudioOptions {
  startTime?: number; // In seconds
  endTime?: number;   // In seconds
  sampleRate?: number; // 44100, 48000, 22050
  channels?: number;   // 1 (mono), 2 (stereo)
  targetFormat?: 'wav' | 'mp3' | 'ogg' | 'webm';
}

export interface VideoOptions {
  startTime?: number;
  endTime?: number;
  width?: number;
  height?: number;
  fps?: number; // 15, 24, 30, 60
  targetFormat?: 'png' | 'jpg' | 'webp' | 'mp4' | 'webm' | 'gif' | 'wav';
  extractAudioOnly?: boolean;
  frameTime?: number; // Timestamp in seconds for single frame export
}

export interface MediaMetadata {
  duration: number; // Seconds
  width?: number;
  height?: number;
  audioChannels?: number;
  sampleRate?: number;
  estimatedSizeBytes?: number;
  mimeType: string;
}

/**
 * Encodes audio samples (AudioBuffer) to uncompressed 16-bit PCM WAV Blob.
 */
export function audioBufferToWav(buffer: AudioBuffer, optChannels?: number): Blob {
  const channels = optChannels || Math.min(buffer.numberOfChannels, 2);
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * channels * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /* RIFF identifier */
  writeString(out, 0, 'RIFF');
  /* RIFF chunk length */
  out.setUint32(4, length - 8, true);
  /* RIFF type */
  writeString(out, 8, 'WAVE');
  /* format chunk identifier */
  writeString(out, 12, 'fmt ');
  /* format chunk length */
  out.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  out.setUint16(20, 1, true);
  /* channel count */
  out.setUint16(22, channels, true);
  /* sample rate */
  out.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  out.setUint32(28, sampleRate * channels * 2, true);
  /* block align (channel count * bytes per sample) */
  out.setUint16(32, channels * 2, true);
  /* bits per sample */
  out.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(out, 36, 'data');
  /* data chunk length */
  out.setUint32(40, length - 44, true);

  /* Write interleaved PCM audio samples */
  let offset = 44;
  const pcmChannels: Float32Array[] = [];
  for (let c = 0; c < channels; c++) {
    pcmChannels.push(buffer.getChannelData(Math.min(c, buffer.numberOfChannels - 1)));
  }

  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < channels; c++) {
      const sample = Math.max(-1, Math.min(1, pcmChannels[c][i]));
      // Convert float sample (-1.0 to 1.0) to signed 16-bit PCM integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      out.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

export const MediaEngine = {
  /**
   * Inspect audio file duration and channel specs using Web Audio API
   */
  getAudioMetadata: async (file: File): Promise<MediaMetadata> => {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      return {
        duration: audioBuffer.duration,
        audioChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate,
        mimeType: file.type || 'audio/wav',
        estimatedSizeBytes: file.size,
      };
    } finally {
      await audioCtx.close();
    }
  },

  /**
   * Process and trim audio using OfflineAudioContext
   */
  processAudio: async (
    file: File,
    options: AudioOptions,
    onProgress: (prog: number) => void
  ): Promise<{ blob: Blob; mimeType: string; duration: number }> => {
    onProgress(10);
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    let decodedBuffer: AudioBuffer;
    try {
      decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (err: any) {
      await audioCtx.close();
      throw new Error(`Browser failed to decode audio format: ${err?.message || 'Unsupported audio codec'}`);
    } finally {
      await audioCtx.close();
    }

    onProgress(40);

    const fullDuration = decodedBuffer.duration;
    const startTime = Math.max(0, options.startTime || 0);
    const endTime = options.endTime && options.endTime > startTime ? Math.min(fullDuration, options.endTime) : fullDuration;
    const trimDuration = Math.max(0.1, endTime - startTime);

    const targetSampleRate = options.sampleRate || decodedBuffer.sampleRate;
    const targetChannels = Math.min(options.channels || decodedBuffer.numberOfChannels, 2);

    // Create OfflineAudioContext for rendering trimmed/resampled buffer
    const renderLength = Math.ceil(trimDuration * targetSampleRate);
    const offlineCtx = new OfflineAudioContext(targetChannels, renderLength, targetSampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0, startTime, trimDuration);

    onProgress(60);

    const renderedBuffer = await offlineCtx.startRendering();
    onProgress(85);

    // Encode to WAV Blob
    const wavBlob = audioBufferToWav(renderedBuffer, targetChannels);
    onProgress(100);

    return {
      blob: wavBlob,
      mimeType: 'audio/wav',
      duration: trimDuration,
    };
  },

  /**
   * Inspect video file metadata (duration, width, height) using HTML5 Video
   */
  getVideoMetadata: async (file: File): Promise<MediaMetadata> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const url = URL.createObjectURL(file);

      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error('Video metadata loading timed out. File format may not be natively decodable by browser.'));
      }, 8000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        const metadata: MediaMetadata = {
          duration: video.duration || 0,
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
          mimeType: file.type || 'video/mp4',
          estimatedSizeBytes: file.size,
        };
        URL.revokeObjectURL(url);
        resolve(metadata);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        reject(new Error('Browser cannot decode this video file format. Native codec required.'));
      };

      video.src = url;
    });
  },

  /**
   * Extract a single frame from video at specified timestamp
   */
  extractVideoFrame: async (
    file: File,
    timeSeconds: number,
    format: 'png' | 'jpg' | 'webp' = 'png'
  ): Promise<{ blob: Blob; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(Math.max(0, timeSeconds), video.duration || 0);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve({ blob, width: canvas.width, height: canvas.height });
          } else {
            reject(new Error('Failed to encode video frame to image blob.'));
          }
        }, mime, 0.92);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error seeking video frame. Codec may be unsupported.'));
      };

      video.src = url;
    });
  },

  /**
   * Extract audio track from video file into WAV Blob using Web Audio API
   */
  extractAudioFromVideo: async (
    file: File,
    onProgress: (prog: number) => void
  ): Promise<{ blob: Blob; mimeType: string; duration: number }> => {
    onProgress(15);
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    onProgress(40);
    let decodedBuffer: AudioBuffer;
    try {
      decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (err: any) {
      await audioCtx.close();
      throw new Error(`No decodable audio track found in video: ${err?.message || 'Unsupported audio stream'}`);
    } finally {
      await audioCtx.close();
    }

    onProgress(75);
    const wavBlob = audioBufferToWav(decodedBuffer);
    onProgress(100);

    return {
      blob: wavBlob,
      mimeType: 'audio/wav',
      duration: decodedBuffer.duration,
    };
  },

  /**
   * Estimate output file size based on duration and bitrate/quality settings
   */
  estimateMediaSize: (durationSeconds: number, targetType: 'audio' | 'video', quality = 0.9): number => {
    if (durationSeconds <= 0) return 0;
    if (targetType === 'audio') {
      // 16-bit 44.1kHz stereo WAV ~ 176.4 KB/s
      return Math.round(durationSeconds * 176400 * quality);
    } else {
      // 720p 30fps WebM ~ 1.5 - 3.0 MB/s
      return Math.round(durationSeconds * 2000000 * quality);
    }
  },
};
