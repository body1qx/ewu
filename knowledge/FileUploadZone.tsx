import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, FileText, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

interface FileUploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  maxSize?: number;
  acceptedTypes?: string[];
}

export default function FileUploadZone({
  onUpload,
  maxSize = 1048576,
  acceptedTypes = ['image/*', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
}: FileUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        toast.error(`File size must be less than ${(maxSize / 1048576).toFixed(1)}MB`);
        return;
      }

      const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading' as const,
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);

      try {
        for (const file of newFiles) {
          setUploadedFiles(prev =>
            prev.map(f => (f.id === file.id ? { ...f, progress: 50 } : f))
          );

          await new Promise(resolve => setTimeout(resolve, 500));

          setUploadedFiles(prev =>
            prev.map(f => (f.id === file.id ? { ...f, progress: 100, status: 'success' } : f))
          );
        }

        await onUpload(acceptedFiles);
        
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        
        toast.success('Files uploaded successfully!', {
          description: `${acceptedFiles.length} file(s) uploaded`,
        });
      } catch (error) {
        newFiles.forEach(file => {
          setUploadedFiles(prev =>
            prev.map(f => (f.id === file.id ? { ...f, status: 'error' } : f))
          );
        });
        toast.error('Upload failed. Please try again.');
      }
    },
    [maxSize, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`relative overflow-hidden cursor-pointer glass-card rounded-ios-lg border-2 border-dashed transition-all duration-300 ${
          isDragActive
            ? 'border-accent bg-accent/5 scale-105 shadow-soft-xl'
            : 'border-border hover:border-accent/50 hover:bg-accent/5'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="p-12 text-center">
          <div className={`inline-flex p-6 rounded-full bg-gradient-to-br from-accent/20 to-accent-orange/20 mb-6 ${isDragActive ? 'animate-ios-bounce' : ''}`}>
            <Upload className="h-12 w-12 text-accent" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">
            {isDragActive ? 'Drop files here' : 'Upload Files'}
          </h3>
          
          <p className="text-muted-foreground mb-4">
            Drag and drop files here, or click to browse
          </p>
          
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>PDF, Excel, Images</span>
            <span>•</span>
            <span>Max {(maxSize / 1048576).toFixed(1)}MB</span>
          </div>
        </div>

        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '50%',
                  backgroundColor: ['#FBB03B', '#FF6B35', '#4B1E27'][Math.floor(Math.random() * 3)],
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          {uploadedFiles.map((file, index) => {
            const FileIcon = getFileIcon(file.type);
            
            return (
              <Card
                key={file.id}
                className="glass-card rounded-ios border-0 shadow-soft-md animate-slide-up-fade"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent-orange/20">
                      <FileIcon className="h-6 w-6 text-accent" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      
                      {file.status === 'uploading' && (
                        <div className="space-y-1">
                          <Progress value={file.progress} className="h-1" />
                          <p className="text-xs text-muted-foreground">
                            Uploading... {file.progress}%
                          </p>
                        </div>
                      )}
                      
                      {file.status === 'success' && (
                        <div className="flex items-center gap-2 text-accent">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-medium">Uploaded successfully</span>
                        </div>
                      )}
                      
                      {file.status === 'error' && (
                        <p className="text-xs text-destructive">Upload failed</p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                      className="rounded-full ios-tap-feedback"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
