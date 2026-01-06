import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateCSFile } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { CSFileWithUploader, FileCategory } from '@/types/types';

interface FileEditDialogProps {
  file: CSFileWithUploader | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FileEditDialog({ file, open, onClose, onSuccess }: FileEditDialogProps) {
  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState<FileCategory>('Other');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (file) {
      setFileName(file.file_name);
      setCategory(file.category);
      setTags(file.tags || '');
    }
  }, [file]);

  const handleSubmit = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      await updateCSFile(file.id, {
        file_name: fileName,
        category,
        tags: tags || undefined,
      });

      toast({
        title: 'File Updated',
        description: 'File metadata has been updated successfully.',
      });

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as FileCategory)}>
              <SelectTrigger id="category">
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
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., monthly, 2024, important"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
