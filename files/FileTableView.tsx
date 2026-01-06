import { Download, Eye, Trash2, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import type { CSFileWithUploader } from '@/types/types';

interface FileTableViewProps {
  files: CSFileWithUploader[];
  onPreview: (file: CSFileWithUploader) => void;
  onDownload: (file: CSFileWithUploader) => void;
  onEdit: (file: CSFileWithUploader) => void;
  onDelete: (file: CSFileWithUploader) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function FileTableView({
  files,
  onPreview,
  onDownload,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: FileTableViewProps) {
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
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Uploaded At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow
              key={file.id}
              className="cursor-pointer hover:bg-accent/50"
              onClick={() => onPreview(file)}
            >
              <TableCell className="font-medium max-w-xs truncate">
                {file.file_name}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {file.file_type.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {file.category}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatFileSize(file.file_size)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {file.uploader?.full_name || 'Unknown'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(file);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(file);
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
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
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(file);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
