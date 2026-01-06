import { useCallback, useState } from 'react';
import { Upload, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadZoneProps {
  onUpload: (files: File[]) => void;
  uploading: boolean;
}

export default function ImageUploadZone({ onUpload, uploading }: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFiles = (files: FileList | null): File[] => {
    if (!files || files.length === 0) return [];

    const validFiles: File[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Only JPEG, PNG, GIF, and WebP images are allowed`);
        continue;
      }

      if (file.size > maxSize) {
        toast.error(`${file.name}: File size must be less than 5MB`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [onUpload]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative rounded-xl border-2 border-dashed transition-all duration-300
        ${isDragging
          ? 'border-accent bg-accent/20 scale-105'
          : 'border-white/30 bg-white/5 hover:border-accent/50 hover:bg-accent/10'
        }
        ${uploading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        id="image-upload"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <label
        htmlFor="image-upload"
        className="flex flex-col items-center justify-center p-8 cursor-pointer"
      >
        {uploading ? (
          <>
            <Loader2 className="w-12 h-12 text-accent animate-spin mb-3" />
            <p className="text-white font-medium">Uploading images...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8 text-accent" />
            </div>
            <p className="text-white font-medium mb-2">Drop images here or click to upload</p>
            <p className="text-white/60 text-sm text-center">
              Supports JPEG, PNG, GIF, WebP • Max 5MB per image
            </p>
          </>
        )}
      </label>

      {/* Glow effect when dragging */}
      {isDragging && (
        <div className="absolute inset-0 rounded-xl shadow-glow pointer-events-none" />
      )}
    </div>
  );
}
