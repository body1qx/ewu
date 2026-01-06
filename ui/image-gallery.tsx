import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt?: string;
  className?: string;
}

export function ImageGallery({ images, alt = 'صورة', className }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <>
      <div className={cn('relative w-full', className)}>
        {/* الصورة الرئيسية */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={images[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          
          {/* زر التكبير */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={() => setIsFullscreen(true)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* عداد الصور */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* أزرار التنقل */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                onClick={goToPrevious}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                onClick={goToNext}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* الصور المصغرة */}
        {images.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToImage(index)}
                className={cn(
                  'relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all',
                  currentIndex === index
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <img
                  src={image}
                  alt={`${alt} ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {currentIndex === index && (
                  <div className="absolute inset-0 bg-primary/10" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* عرض ملء الشاشة */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative h-full w-full flex items-center justify-center p-4">
            {/* زر الإغلاق */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* الصورة */}
            <img
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />

            {/* عداد الصور */}
            {images.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full text-base font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            )}

            {/* أزرار التنقل */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* الصور المصغرة */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToImage(index)}
                    className={cn(
                      'relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all',
                      currentIndex === index
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <img
                      src={image}
                      alt={`${alt} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
