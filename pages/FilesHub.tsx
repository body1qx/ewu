import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getCSFiles, deleteCSFile, downloadCSFile } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import FileUploadZone from '@/components/files/FileUploadZone';
import FileFilters from '@/components/files/FileFilters';
import FileCardGrid from '@/components/files/FileCardGrid';
import FileTableView from '@/components/files/FileTableView';
import FilePreviewDrawer from '@/components/files/FilePreviewDrawer';
import FileEditDialog from '@/components/files/FileEditDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { CSFileWithUploader, FileCategory, FileType, FileSortOption, FileViewMode } from '@/types/types';
import { canWrite, isAdmin as checkIsAdmin } from '@/lib/permissions';

export default function FilesHub() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [files, setFiles] = useState<CSFileWithUploader[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<CSFileWithUploader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FileCategory | 'All'>('All');
  const [fileType, setFileType] = useState<FileType | 'all'>('all');
  const [sortBy, setSortBy] = useState<FileSortOption>('newest');
  const [viewMode, setViewMode] = useState<FileViewMode>('grid');
  
  const [previewFile, setPreviewFile] = useState<CSFileWithUploader | null>(null);
  const [editFile, setEditFile] = useState<CSFileWithUploader | null>(null);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);

  const isAdmin = profile ? checkIsAdmin(profile.role) : false;
  const canUpload = profile ? canWrite(profile.role) : false;

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const data = await getCSFiles({ category, fileType, sortBy, search });
      setFiles(data);
      setFilteredFiles(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load files',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [category, fileType, sortBy, search]);

  const handleDownload = async (file: CSFileWithUploader) => {
    try {
      await downloadCSFile(file.file_path, file.file_name);

      toast({
        title: 'Download Started',
        description: `Downloading ${file.file_name}`,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteFileId) return;

    try {
      await deleteCSFile(deleteFileId);
      toast({
        title: 'File Deleted',
        description: 'File has been deleted successfully.',
      });
      loadFiles();
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive',
      });
    } finally {
      setDeleteFileId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B1E27] via-[#6A1B2C] to-[#4B1E27] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-lg bg-background/80 rounded-2xl shadow-2xl p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-[#FFB300] to-[#FF7A00] bg-clip-text text-transparent">
              Files Hub
            </h1>
            <p className="text-muted-foreground">
              Upload, manage, and access your team's documents and resources
            </p>
          </div>

          {canUpload ? (
            <FileUploadZone onUploadComplete={loadFiles} />
          ) : (
            <div className="bg-muted/50 border border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                File upload is restricted to Writer role and above. Contact your administrator for access.
              </p>
            </div>
          )}

          <div className="space-y-6">
            <FileFilters
              search={search}
              onSearchChange={setSearch}
              category={category}
              onCategoryChange={setCategory}
              fileType={fileType}
              onFileTypeChange={setFileType}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading files...</p>
              </div>
            ) : viewMode === 'grid' ? (
              <FileCardGrid
                files={filteredFiles}
                onPreview={setPreviewFile}
                onDownload={handleDownload}
                onEdit={setEditFile}
                onDelete={(file) => setDeleteFileId(file.id)}
                canEdit={isAdmin}
                canDelete={isAdmin}
              />
            ) : (
              <FileTableView
                files={filteredFiles}
                onPreview={setPreviewFile}
                onDownload={handleDownload}
                onEdit={setEditFile}
                onDelete={(file) => setDeleteFileId(file.id)}
                canEdit={isAdmin}
                canDelete={isAdmin}
              />
            )}
          </div>
        </div>
      </div>

      <FilePreviewDrawer
        file={previewFile}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />

      <FileEditDialog
        file={editFile}
        open={!!editFile}
        onClose={() => setEditFile(null)}
        onSuccess={loadFiles}
      />

      <AlertDialog open={!!deleteFileId} onOpenChange={() => setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
