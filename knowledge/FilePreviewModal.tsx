import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    name: string;
    type: string;
    url: string;
  } | null;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  file,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: FilePreviewModalProps) {
  if (!file) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPreview = () => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-muted/20 rounded-ios">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-ios animate-fade-in-scale"
          />
        </div>
      );
    }

    if (file.type.includes('pdf')) {
      return (
        <iframe
          src={file.url}
          title={file.name}
          className="w-full h-full rounded-ios animate-fade-in-scale"
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in-scale">
        <div className="p-8 rounded-full bg-gradient-to-br from-accent/20 to-accent-orange/20">
          <Download className="h-16 w-16 text-accent" />
        </div>
        <p className="text-lg font-medium">Preview not available</p>
        <p className="text-sm text-muted-foreground">Download to view this file</p>
        <Button onClick={handleDownload} className="mt-4">
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 glass-card border-0 rounded-ios-lg animate-fade-in-scale">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold truncate pr-4">
              {file.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="rounded-full ios-tap-feedback"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full ios-tap-feedback"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex-1 p-6 overflow-hidden">
          {renderPreview()}

          {(hasPrevious || hasNext) && (
            <>
              {hasPrevious && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={onPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-soft-lg ios-tap-feedback"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              
              {hasNext && (
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={onNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-soft-lg ios-tap-feedback"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
