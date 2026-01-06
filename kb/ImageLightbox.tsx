import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  captions?: string[];
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  captions = []
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, onClose]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-sm">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleZoomOut}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleZoomIn}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Image */}
      <div className="absolute inset-0 flex items-center justify-center p-16">
        <img
          src={images[currentIndex]}
          alt={captions[currentIndex] || `Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-300 rounded-lg"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>

      {/* Caption */}
      {captions[currentIndex] && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-white text-center text-sm max-w-2xl mx-auto">
            {captions[currentIndex]}
          </p>
        </div>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            onClick={handlePrevious}
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            onClick={handleNext}
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setZoom(1);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-white scale-110'
                  : 'border-white/30 hover:border-white/60'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
