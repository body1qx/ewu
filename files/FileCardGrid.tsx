import { FileText, Download, Eye, Trash2, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import type { CSFileWithUploader } from '@/types/types';

interface FileCardGridProps {
  files: CSFileWithUploader[];
  onPreview: (file: CSFileWithUploader) => void;
  onDownload: (file: CSFileWithUploader) => void;
  onEdit: (file: CSFileWithUploader) => void;
  onDelete: (file: CSFileWithUploader) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const getFileIcon = (fileType: string) => {
  return <FileText className="w-12 h-12 text-primary" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function FileCardGrid({
  files,
  onPreview,
  onDownload,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: FileCardGridProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No files found</h3>
        <p className="text-muted-foreground">
          No files uploaded yet. Start by adding your first training document or report.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {files.map((file) => (
        <Card
          key={file.id}
          className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer"
          onClick={() => onPreview(file)}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                {getFileIcon(file.file_type)}
              </div>

              <div className="w-full space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="font-semibold truncate w-full">
                        {file.file_name}
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{file.file_name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {file.file_type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {file.category}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{formatFileSize(file.file_size)}</p>
                  <p>
                    {file.uploader?.full_name || 'Unknown'}
                  </p>
                  <p>
                    {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(file);
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(file);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(file);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(file);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
