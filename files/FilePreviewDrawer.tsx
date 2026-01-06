import { useState, useEffect } from 'react';
import { X, Download, FileText, Calendar, User, FolderOpen, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { getCSFileDownloadUrl } from '@/db/api';
import type { CSFileWithUploader } from '@/types/types';

interface FilePreviewDrawerProps {
  file: CSFileWithUploader | null;
  open: boolean;
  onClose: () => void;
  onDownload: (file: CSFileWithUploader) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function FilePreviewDrawer({
  file,
  open,
  onClose,
  onDownload,
}: FilePreviewDrawerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (file && open && file.file_type === 'pdf') {
      setLoadingPreview(true);
      getCSFileDownloadUrl(file.file_path)
        .then(url => {
          setPreviewUrl(url);
        })
        .catch(error => {
          console.error('Failed to load preview:', error);
          setPreviewUrl(null);
        })
        .finally(() => {
          setLoadingPreview(false);
        });
    } else {
      setPreviewUrl(null);
    }
  }, [file, open]);

  if (!file) return null;

  const isPDF = file.file_type === 'pdf';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <SheetTitle className="text-xl break-words">{file.file_name}</SheetTitle>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="secondary">{file.file_type.toUpperCase()}</Badge>
                <Badge variant="outline">{file.category}</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium">{formatFileSize(file.file_size)}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Uploaded by:</span>
              <span className="font-medium">{file.uploader?.full_name || 'Unknown'}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Uploaded at:</span>
              <span className="font-medium">
                {format(new Date(file.created_at), 'PPpp')}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{file.category}</span>
            </div>

            {file.tags && (
              <div className="flex items-start gap-3 text-sm">
                <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">Tags:</span>
                <span className="font-medium">{file.tags}</span>
              </div>
            )}
          </div>

          <Separator />

          {isPDF && (
            <div className="space-y-4">
              <h3 className="font-semibold">Preview</h3>
              <div className="border rounded-lg overflow-hidden bg-muted/50">
                {loadingPreview ? (
                  <div className="flex items-center justify-center h-[600px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[600px]"
                    title={file.file_name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[600px]">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Failed to load preview. Please download the file to view it.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isPDF && (
            <div className="text-center py-8 space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold mb-2">Excel File</h3>
                <p className="text-sm text-muted-foreground">
                  Preview not available for Excel files. Download to view the content.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => onDownload(file)}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
