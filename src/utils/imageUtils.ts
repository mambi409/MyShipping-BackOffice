/**
 * Utility functions for package image processing and compression
 */

export interface ProcessedImageResult {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/**
 * Resizes and compresses an image File or Blob to a balanced base64 JPEG
 * Keeps image crisp for barcode & label reading while keeping size < 150KB for local storage
 */
export function compressImageFile(
  file: File | Blob,
  maxDimension = 1200,
  quality = 0.82
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio bounded by maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not supported'));
          return;
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        // Estimate size in bytes: 3/4 of base64 string length minus header
        const base64Str = dataUrl.split(',')[1] || '';
        const sizeBytes = Math.round((base64Str.length * 3) / 4);

        resolve({
          dataUrl,
          sizeBytes,
          width,
          height,
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for processing'));
      };

      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      } else {
        reject(new Error('Failed to read image data'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading image file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Captures an image snapshot from a live HTMLVideoElement, resizes and compresses it
 */
export function captureVideoFrame(
  video: HTMLVideoElement,
  maxDimension = 1200,
  quality = 0.85
): ProcessedImageResult | null {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (!videoWidth || !videoHeight) return null;

  let width = videoWidth;
  let height = videoHeight;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const base64Str = dataUrl.split(',')[1] || '';
  const sizeBytes = Math.round((base64Str.length * 3) / 4);

  return {
    dataUrl,
    sizeBytes,
    width,
    height,
  };
}

export function formatImageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
