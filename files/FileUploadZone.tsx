import { useState, useCallback } from 'react';
import { CloudUpload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadCSFile } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { FileCategory } from '@/types/types';

const ALLOWED_EXTENSIONS = ['pdf', 'xls', 'xlsx', 'csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadingFile {
  file: File;
  progress: number;
  category: FileCategory;
  tags: string;
}

interface FileUploadZoneProps {
  onUploadComplete: () => void;
}

export default function FileUploadZone({ onUploadComplete }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit.';
    }
    return null;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles: UploadingFile[] = [];
    
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast({
          title: 'Invalid File',
          description: `${file.name}: ${error}`,
          variant: 'destructive',
        });
      } else {
        validFiles.push({
          file,
          progress: 0,
          category: 'Other',
          tags: ''
        });
      }
    });

    if (validFiles.length > 0) {
      setUploadingFiles(prev => [...prev, ...validFiles]);
    }
  }, [toast]);

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
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  }, [handleFiles]);

  const updateFileMetadata = (index: number, field: 'category' | 'tags', value: string) => {
    setUploadingFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, [field]: value } : f
    ));
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSingleFile = async (uploadingFile: UploadingFile, index: number) => {
    try {
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 50 } : f
      ));

      await uploadCSFile(uploadingFile.file, uploadingFile.category, uploadingFile.tags || undefined);

      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 100 } : f
      ));

      setTimeout(() => {
        setUploadingFiles(prev => prev.filter((_, i) => i !== index));
        toast({
          title: 'Upload Successful',
          description: `${uploadingFile.file.name} has been uploaded.`,
        });
        onUploadComplete();
      }, 500);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
      setUploadingFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center
          transition-all duration-300 cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg shadow-primary/20' 
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.xls,.xlsx,.csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`
            p-6 rounded-full bg-primary/10 transition-transform duration-300
            ${isDragging ? 'scale-110' : 'scale-100'}
          `}>
            <CloudUpload className="w-12 h-12 text-primary" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Upload Files</h3>
            <p className="text-muted-foreground">
              Drag & drop Excel or PDF files here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supported: .pdf, .xls, .xlsx, .csv (Max 10MB)
            </p>
          </div>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold">Files to Upload</h4>
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3 bg-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{uploadingFile.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploadingFile.progress > 0}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {uploadingFile.progress === 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={uploadingFile.category}
                      onValueChange={(value) => updateFileMetadata(index, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Reports">Reports</SelectItem>
                        <SelectItem value="Training">Training</SelectItem>
                        <SelectItem value="Policies">Policies</SelectItem>
                        <SelectItem value="Templates">Templates</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags (optional)</Label>
                    <Input
                      placeholder="e.g., monthly, 2024, important"
                      value={uploadingFile.tags}
                      onChange={(e) => updateFileMetadata(index, 'tags', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {uploadingFile.progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uploading...</span>
                    <span className="font-medium">{uploadingFile.progress}%</span>
                  </div>
                  <Progress value={uploadingFile.progress} />
                </div>
              )}

              {uploadingFile.progress === 0 && (
                <Button
                  onClick={() => uploadSingleFile(uploadingFile, index)}
                  className="w-full"
                >
                  Upload File
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
