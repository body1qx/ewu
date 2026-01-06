export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  fileType?: string;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

const MAX_SIZE_BYTES = 1048576;
const MAX_DIMENSION = 1080;
const INITIAL_QUALITY = 0.8;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.1;

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = MAX_DIMENSION,
    quality = INITIAL_QUALITY,
    fileType = 'image/webp',
  } = options;

  const originalSize = file.size;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (originalSize <= maxSizeBytes) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      wasCompressed: false,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    img.onload = async () => {
      try {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        let { width, height } = img;

        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = (height / width) * maxWidthOrHeight;
            width = maxWidthOrHeight;
          } else {
            width = (width / height) * maxWidthOrHeight;
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;
        let compressedBlob: Blob | null = null;

        while (currentQuality >= MIN_QUALITY) {
          compressedBlob = await new Promise<Blob | null>((res) => {
            canvas.toBlob(
              (blob) => res(blob),
              fileType,
              currentQuality
            );
          });

          if (!compressedBlob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          if (compressedBlob.size <= maxSizeBytes) {
            break;
          }

          currentQuality -= QUALITY_STEP;
        }

        if (!compressedBlob) {
          reject(new Error('Failed to compress image'));
          return;
        }

        const extension = fileType.split('/')[1];
        const originalName = file.name.replace(/\.[^/.]+$/, '');
        const compressedFile = new File(
          [compressedBlob],
          `${originalName}.${extension}`,
          { type: fileType }
        );

        resolve({
          file: compressedFile,
          originalSize,
          compressedSize: compressedFile.size,
          wasCompressed: true,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, WEBP, GIF, or AVIF image.',
    };
  }

  const hasChineseChars = /[\u4e00-\u9fa5]/.test(file.name);
  if (hasChineseChars) {
    return {
      valid: false,
      error: 'Filename must not contain Chinese characters. Please rename the file.',
    };
  }

  return { valid: true };
}
