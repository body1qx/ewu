import { useState, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import ImageLightbox from '@/components/shift-handover/ImageLightbox';

interface AnnouncementImageUploadProps {
  bannerImageUrl: string;
  images: string[];
  onBannerUpload: (file: File) => void;
  onImagesUpload: (files: File[]) => void;
  onImageRemove: (imageUrl: string, isBanner?: boolean) => void;
  uploading: boolean;
}

export default function AnnouncementImageUpload({
  bannerImageUrl,
  images,
  onBannerUpload,
  onImagesUpload,
  onImageRemove,
  uploading
}: AnnouncementImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);

  const validateFiles = (files: FileList | null): File[] => {
    if (!files || files.length === 0) return [];

    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Only JPEG, PNG, GIF, and WebP images are allowed`);
        continue;
      }

      if (file.size > maxSize) {
        toast.error(`${file.name}: File size must be less than 10MB`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      onImagesUpload(validFiles);
    }
  }, [onImagesUpload]);

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      onBannerUpload(validFiles[0]);
    }
    e.target.value = '';
  };

  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(e.target.files);
    if (validFiles.length > 0) {
      onImagesUpload(validFiles);
    }
    e.target.value = '';
  };

  const handleImageClick = (imageUrls: string[], index: number) => {
    setLightboxImages(imageUrls);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Banner Image Upload */}
        <div className="space-y-3">
          <Label className="text-white font-semibold text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Banner Image (Recommended)
          </Label>
          <p className="text-white/60 text-sm">This image will be displayed at the top of your announcement</p>
          
          {bannerImageUrl ? (
            <div className="relative group aspect-video rounded-xl overflow-hidden border-2 border-accent">
              <img
                src={bannerImageUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  type="button"
                  onClick={() => handleImageClick([bannerImageUrl], 0)}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => onImageRemove(bannerImageUrl, true)}
                  className="w-12 h-12 rounded-full bg-destructive/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                type="file"
                id="banner-upload"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleBannerSelect}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <label
                htmlFor="banner-upload"
                className={`
                  flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer
                  ${isDragging
                    ? 'border-accent bg-accent/20 scale-105'
                    : 'border-white/30 bg-white/5 hover:border-accent/50 hover:bg-accent/10'
                  }
                  ${uploading ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-3" />
                    <p className="text-white font-medium">Uploading...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-accent" />
                    </div>
                    <p className="text-white font-medium mb-2">Click to upload banner image</p>
                    <p className="text-white/60 text-sm">JPEG, PNG, GIF, WebP • Max 10MB</p>
                  </>
                )}
              </label>
            </div>
          )}
        </div>

        {/* Additional Images Upload */}
        <div className="space-y-3">
          <Label className="text-white font-semibold text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Additional Images (Optional)
          </Label>
          <p className="text-white/60 text-sm">Add more images to create a gallery in your announcement</p>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative rounded-xl border-2 border-dashed transition-all duration-300
              ${isDragging
                ? 'border-accent bg-accent/20 scale-105 shadow-glow'
                : 'border-white/30 bg-white/5 hover:border-accent/50 hover:bg-accent/10'
              }
              ${uploading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input
              type="file"
              id="images-upload"
              multiple
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImagesSelect}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <label
              htmlFor="images-upload"
              className="flex flex-col items-center justify-center p-8 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-accent animate-spin mb-3" />
                  <p className="text-white font-medium">Uploading images...</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-3">
                    <ImageIcon className="w-7 h-7 text-accent" />
                  </div>
                  <p className="text-white font-medium mb-1">Drop images here or click to upload</p>
                  <p className="text-white/60 text-sm">Multiple images supported • Max 10MB each</p>
                </>
              )}
            </label>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {images.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-white/20 hover:border-accent transition-all duration-300"
                >
                  <img
                    src={imageUrl}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      type="button"
                      onClick={() => handleImageClick(images, index)}
                      className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <ZoomIn className="w-4 h-4 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onImageRemove(imageUrl)}
                      className="w-8 h-8 rounded-full bg-destructive/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
