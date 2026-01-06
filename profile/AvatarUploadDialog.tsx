import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/db/supabase';
import { Upload, X, Check, RotateCcw } from 'lucide-react';
import { compressImage, formatFileSize, validateImageFile } from '@/utils/imageCompression';
import { useTranslation } from 'react-i18next';

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentAvatarUrl?: string | null;
  onUploadSuccess: (url: string, position: { x: number; y: number; zoom: number }) => void;
}

export default function AvatarUploadDialog({
  open,
  onOpenChange,
  userId,
  currentAvatarUrl,
  onUploadSuccess,
}: AvatarUploadDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image position control state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await compressImage(file);
      
      setSelectedFile(result.file);
      setPreviewUrl(URL.createObjectURL(result.file));
      
      // Reset position and zoom for new image
      setZoom(1);
      setPosition({ x: 0.5, y: 0.5 });

      if (result.wasCompressed) {
        setCompressionInfo(
          `Image compressed from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.compressedSize)}`
        );
      } else {
        setCompressionInfo(null);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to process image. Please try another file.',
        variant: 'destructive',
      });
    }
  };

  // Image position control handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageContainerRef.current) return;

    const container = imageContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    const deltaX = (e.clientX - dragStart.x) / rect.width;
    const deltaY = (e.clientY - dragStart.y) / rect.height;

    setPosition(prev => ({
      x: Math.max(0, Math.min(1, prev.x + deltaX)),
      y: Math.max(0, Math.min(1, prev.y + deltaY)),
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !imageContainerRef.current) return;

    const touch = e.touches[0];
    const container = imageContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    const deltaX = (touch.clientX - dragStart.x) / rect.width;
    const deltaY = (touch.clientY - dragStart.y) / rect.height;

    setPosition(prev => ({
      x: Math.max(0, Math.min(1, prev.x + deltaX)),
      y: Math.max(0, Math.min(1, prev.y + deltaY)),
    }));

    setDragStart({ x: touch.clientX, y: touch.clientY });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResetPosition = () => {
    setZoom(1);
    setPosition({ x: 0.5, y: 0.5 });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(10);

      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('shawarmer_profiles')
            .remove([`${userId}/${oldPath}`]);
        }
      }

      setUploadProgress(30);

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      setUploadProgress(50);

      const { error: uploadError } = await supabase.storage
        .from('shawarmer_profiles')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      const { data: { publicUrl } } = supabase.storage
        .from('shawarmer_profiles')
        .getPublicUrl(filePath);

      setUploadProgress(90);

      // Save avatar URL and position data
      const avatarPosition = { x: position.x, y: position.y, zoom };
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_image_url: publicUrl,
          avatar_position: avatarPosition,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setUploadProgress(100);

      toast({
        title: t('common.success'),
        description: compressionInfo 
          ? `${t('profile.avatar.success')}. ${compressionInfo}`
          : t('profile.avatar.success'),
      });

      onUploadSuccess(publicUrl, avatarPosition);
      handleClose();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: t('common.error'),
        description: t('profile.avatar.error'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCompressionInfo(null);
    setUploadProgress(0);
    setZoom(1);
    setPosition({ x: 0.5, y: 0.5 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('profile.avatar.change')}</DialogTitle>
          <DialogDescription>
            {t('profile.avatar.file_requirements')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={handleFileSelect}
            className="hidden"
          />

          {previewUrl ? (
            <div className="space-y-4">
              {/* Image Preview with Position Control */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('profile.avatar.position_control.preview')}
                </Label>
                <div 
                  ref={imageContainerRef}
                  className="relative aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-border bg-muted cursor-move select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `translate(${(position.x - 0.5) * 100}%, ${(position.y - 0.5) * 100}%) scale(${zoom})`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  </div>
                  
                  {/* Circular crop overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <defs>
                        <mask id="circleMask">
                          <rect width="100" height="100" fill="white" />
                          <circle cx="50" cy="50" r="45" fill="black" />
                        </mask>
                      </defs>
                      <rect 
                        width="100" 
                        height="100" 
                        fill="black" 
                        fillOpacity="0.5" 
                        mask="url(#circleMask)" 
                      />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="0.5" 
                        strokeDasharray="2,2"
                      />
                    </svg>
                  </div>

                  {/* Drag hint */}
                  {!isDragging && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
                      {t('profile.avatar.position_control.drag_to_reposition')}
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setCompressionInfo(null);
                      setZoom(1);
                      setPosition({ x: 0.5, y: 0.5 });
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Zoom Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="zoom-slider" className="text-sm font-medium">
                    {t('profile.avatar.position_control.zoom')}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    id="zoom-slider"
                    min={1}
                    max={3}
                    step={0.1}
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetPosition}
                    className="flex-shrink-0"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    {t('profile.avatar.position_control.reset')}
                  </Button>
                </div>
              </div>

              {compressionInfo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{compressionInfo}</span>
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-center text-muted-foreground">
                    {t('profile.avatar.uploading')} {uploadProgress}%
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                  disabled={uploading}
                >
                  {t('common.select')} {t('profile.avatar.select_file')}
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1"
                  disabled={uploading}
                >
                  {uploading ? t('profile.avatar.uploading') : t('common.upload')}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square max-w-sm mx-auto border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Upload className="h-12 w-12" />
              <span className="text-sm font-medium">{t('profile.avatar.drag_drop')}</span>
              <span className="text-xs">{t('profile.avatar.file_requirements')}</span>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
