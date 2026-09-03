export interface FileInspectionResult {
  name: string;
  sizeFormatted: string;
  formattedSize: string;
  sizeBytes: number;
  size: number;
  mimeType: string;
  extension: string;
  lastModifiedDate: string;
  lastModified: string;
  magicHeaderVerified: string;
  headerHex: string;
  isExtensionMatch: boolean;
  signatureMime: string;
  isImage: boolean;
  imageDimensions?: { width: number; height: number };
}

export class FileInfoTools {
  static formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static async inspectFile(file: File): Promise<FileInspectionResult> {
    const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || '' : '';
    const sizeFormatted = this.formatBytes(file.size);
    const lastModifiedDate = new Date(file.lastModified).toLocaleString();

    // Read first 16 bytes for magic signature detection
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
      .toUpperCase();

    const compactHex = hex.replace(/\s+/g, '');
    let magicHeaderVerified = 'Unknown binary or plain text format';
    let signatureMime = file.type || 'Unknown';
    let isExtensionMatch = true;

    if (compactHex.startsWith('89504E470D0A1A0A')) {
      magicHeaderVerified = 'PNG Image (Verified Magic Header: 89 50 4E 47)';
      signatureMime = 'image/png';
      isExtensionMatch = ext === 'png';
    } else if (compactHex.startsWith('FFD8FF')) {
      magicHeaderVerified = 'JPEG / JPG Image (Verified Magic Header: FF D8 FF)';
      signatureMime = 'image/jpeg';
      isExtensionMatch = ['jpg', 'jpeg'].includes(ext);
    } else if (compactHex.startsWith('47494638')) {
      magicHeaderVerified = 'GIF Image (Verified Magic Header: 47 49 46 38)';
      signatureMime = 'image/gif';
      isExtensionMatch = ext === 'gif';
    } else if (compactHex.startsWith('25504446')) {
      magicHeaderVerified = 'PDF Document (Verified Magic Header: %PDF)';
      signatureMime = 'application/pdf';
      isExtensionMatch = ext === 'pdf';
    } else if (compactHex.startsWith('504B0304') || compactHex.startsWith('504B0506')) {
      magicHeaderVerified = 'ZIP Archive / Office Open XML (Verified PK Zip)';
      signatureMime = 'application/zip';
      isExtensionMatch = ['zip', 'docx', 'xlsx', 'pptx', 'apk', 'jar'].includes(ext);
    } else if (compactHex.startsWith('52494646') && compactHex.includes('57454250')) {
      magicHeaderVerified = 'WebP Image (Verified RIFF WEBP Header)';
      signatureMime = 'image/webp';
      isExtensionMatch = ext === 'webp';
    } else if (file.type === 'image/svg+xml' || ext === 'svg') {
      magicHeaderVerified = 'SVG Vector XML';
      signatureMime = 'image/svg+xml';
      isExtensionMatch = ext === 'svg';
    } else if (file.type.startsWith('text/')) {
      magicHeaderVerified = 'Plain Text UTF-8 / ASCII';
      signatureMime = 'text/plain';
      isExtensionMatch = true;
    }

    const isImage = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
    let imageDimensions: { width: number; height: number } | undefined;

    if (isImage && file.size < 50 * 1024 * 1024) {
      try {
        imageDimensions = await new Promise((resolve) => {
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(undefined);
          };
          img.src = url;
        });
      } catch {
        // Dimension inspect failure is non-blocking
      }
    }

    return {
      name: file.name,
      sizeFormatted,
      formattedSize: sizeFormatted,
      sizeBytes: file.size,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      extension: ext ? `.${ext}` : 'none',
      lastModifiedDate,
      lastModified: lastModifiedDate,
      magicHeaderVerified,
      headerHex: hex,
      isExtensionMatch,
      signatureMime,
      isImage,
      imageDimensions,
    };
  }
}

