import { Save, Eye, Send, Clock, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import TagInput from './TagInput';
import { format } from 'date-fns';

interface MetadataPanelProps {
  title: string;
  titleAr: string;
  description: string;
  tags: string[];
  status: 'draft' | 'published';
  pinned: boolean;
  lastSaved?: Date;
  saving?: boolean;
  onTitleChange: (title: string) => void;
  onTitleArChange: (titleAr: string) => void;
  onDescriptionChange: (description: string) => void;
  onTagsChange: (tags: string[]) => void;
  onStatusChange: (status: 'draft' | 'published') => void;
  onPinnedChange: (pinned: boolean) => void;
  onSaveDraft: () => void;
  onPreview: () => void;
  onPublish: () => void;
}

export default function MetadataPanel({
  title,
  titleAr,
  description,
  tags,
  status,
  pinned,
  lastSaved,
  saving,
  onTitleChange,
  onTitleArChange,
  onDescriptionChange,
  onTagsChange,
  onStatusChange,
  onPinnedChange,
  onSaveDraft,
  onPreview,
  onPublish,
}: MetadataPanelProps) {
  return (
    <div className="h-full bg-muted/30 border-r border-border overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold mb-1">Article Details</h2>
          <p className="text-sm text-muted-foreground">
            Configure your article metadata
          </p>
        </div>

        <Separator />

        {/* Title (English) */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Title (English)
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter article title..."
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Title (Arabic) */}
        <div className="space-y-2">
          <Label htmlFor="titleAr" className="text-sm font-medium">
            Title (Arabic)
          </Label>
          <Input
            id="titleAr"
            value={titleAr}
            onChange={(e) => onTitleArChange(e.target.value)}
            placeholder="أدخل عنوان المقال..."
            dir="rtl"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description
          </Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Brief description for preview..."
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tags</Label>
          <TagInput
            tags={tags}
            onChange={onTagsChange}
            placeholder="Type and press Enter..."
          />
        </div>

        <Separator />

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => onStatusChange(value as 'draft' | 'published')}
          >
            <SelectTrigger className="transition-all duration-200">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pinned */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="pinned" className="text-sm font-medium cursor-pointer">
              Pin Article
            </Label>
          </div>
          <Switch
            id="pinned"
            checked={pinned}
            onCheckedChange={onPinnedChange}
          />
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onSaveDraft}
            variant="outline"
            className="w-full gap-2 transition-all duration-200 hover:scale-[1.02]"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>

          <Button
            onClick={onPreview}
            variant="outline"
            className="w-full gap-2 transition-all duration-200 hover:scale-[1.02]"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>

          <Button
            onClick={onPublish}
            className="w-full gap-2 transition-all duration-200 hover:scale-[1.02] shadow-soft-lg"
          >
            <Send className="h-4 w-4" />
            Publish Article
          </Button>
        </div>

        {/* Last Saved */}
        {lastSaved && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Clock className="h-3 w-3" />
            <span>Last saved {format(lastSaved, 'HH:mm:ss')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
