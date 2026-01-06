import { useState } from 'react';
import { 
  Plus, GripVertical, Trash2, Image as ImageIcon, Type, List, 
  AlertCircle, Table as TableIcon, Images, ListOrdered
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { uploadKBImage } from '@/db/api';
import { toast } from 'sonner';
import type { ContentBlock, ContentBlockType, CalloutStyle } from '@/types/types';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  articleId: string;
}

export default function BlockEditor({ blocks, onChange, articleId }: BlockEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const addBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
      metadata: type === 'heading' ? { level: 2 } : type === 'callout' ? { style: 'info' } : {}
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    onChange(newBlocks);
  };

  const deleteBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) {
      return;
    }

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    onChange(newBlocks);
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    try {
      setUploadingIndex(index);
      const url = await uploadKBImage(file, articleId);
      updateBlock(index, { content: url });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingIndex(null);
    }
  };

  const renderBlockEditor = (block: ContentBlock, index: number) => {
    return (
      <Card key={block.id} className="p-4 mb-4 relative group">
        {/* Block Controls */}
        <div className="absolute -left-12 top-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => moveBlock(index, 'up')}
            disabled={index === 0}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => deleteBlock(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Paragraph Block */}
        {block.type === 'paragraph' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Type className="h-4 w-4" />
              Paragraph
            </div>
            <Textarea
              placeholder="Enter paragraph content (English)"
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              rows={4}
            />
            <Textarea
              placeholder="Enter paragraph content (Arabic - optional)"
              value={block.contentAr || ''}
              onChange={(e) => updateBlock(index, { contentAr: e.target.value })}
              rows={4}
              dir="rtl"
            />
          </div>
        )}

        {/* Heading Block */}
        {block.type === 'heading' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Type className="h-4 w-4" />
                Heading
              </div>
              <Select
                value={String(block.metadata?.level || 2)}
                onValueChange={(value) =>
                  updateBlock(index, {
                    metadata: { ...block.metadata, level: Number(value) as 1 | 2 | 3 }
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Heading 1</SelectItem>
                  <SelectItem value="2">Heading 2</SelectItem>
                  <SelectItem value="3">Heading 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Heading text (English)"
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
            />
            <Input
              placeholder="Heading text (Arabic - optional)"
              value={block.contentAr || ''}
              onChange={(e) => updateBlock(index, { contentAr: e.target.value })}
              dir="rtl"
            />
          </div>
        )}

        {/* List Block */}
        {block.type === 'list' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <List className="h-4 w-4" />
                List
              </div>
              <Select
                value={block.metadata?.ordered ? 'ordered' : 'unordered'}
                onValueChange={(value) =>
                  updateBlock(index, {
                    metadata: { ...block.metadata, ordered: value === 'ordered' }
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unordered">Bullet List</SelectItem>
                  <SelectItem value="ordered">Numbered List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Enter list items (one per line)"
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              rows={5}
            />
          </div>
        )}

        {/* Callout Block */}
        {block.type === 'callout' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Callout
              </div>
              <Select
                value={block.metadata?.style || 'info'}
                onValueChange={(value) =>
                  updateBlock(index, {
                    metadata: { ...block.metadata, style: value as CalloutStyle }
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="tip">Tip</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Callout content (English)"
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              rows={3}
            />
            <Textarea
              placeholder="Callout content (Arabic - optional)"
              value={block.contentAr || ''}
              onChange={(e) => updateBlock(index, { contentAr: e.target.value })}
              rows={3}
              dir="rtl"
            />
          </div>
        )}

        {/* Image Block */}
        {block.type === 'image' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              Image
            </div>
            {block.content ? (
              <div className="space-y-3">
                <img
                  src={block.content}
                  alt="Preview"
                  className="w-full h-auto rounded-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateBlock(index, { content: '' })}
                >
                  Change Image
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(index, file);
                  }}
                  className="hidden"
                  id={`image-upload-${index}`}
                  disabled={uploadingIndex === index}
                />
                <label
                  htmlFor={`image-upload-${index}`}
                  className="cursor-pointer"
                >
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {uploadingIndex === index ? 'Uploading...' : 'Click to upload image'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max size: 5MB
                  </p>
                </label>
              </div>
            )}
            <Input
              placeholder="Image caption (English - optional)"
              value={block.metadata?.caption || ''}
              onChange={(e) =>
                updateBlock(index, {
                  metadata: { ...block.metadata, caption: e.target.value }
                })
              }
            />
            <Input
              placeholder="Image caption (Arabic - optional)"
              value={block.metadata?.captionAr || ''}
              onChange={(e) =>
                updateBlock(index, {
                  metadata: { ...block.metadata, captionAr: e.target.value }
                })
              }
              dir="rtl"
            />
          </div>
        )}

        {/* Steps Block */}
        {block.type === 'steps' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ListOrdered className="h-4 w-4" />
              Step-by-Step
            </div>
            <Textarea
              placeholder="Enter steps (one per line)"
              value={block.content}
              onChange={(e) => updateBlock(index, { content: e.target.value })}
              rows={6}
            />
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="pl-12">
        {blocks.map((block, index) => renderBlockEditor(block, index))}
      </div>

      {/* Add Block Menu */}
      <div className="flex flex-wrap gap-2 pl-12">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('paragraph')}
          className="gap-2"
        >
          <Type className="h-4 w-4" />
          Paragraph
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('heading')}
          className="gap-2"
        >
          <Type className="h-4 w-4" />
          Heading
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('list')}
          className="gap-2"
        >
          <List className="h-4 w-4" />
          List
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('callout')}
          className="gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Callout
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('image')}
          className="gap-2"
        >
          <ImageIcon className="h-4 w-4" />
          Image
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addBlock('steps')}
          className="gap-2"
        >
          <ListOrdered className="h-4 w-4" />
          Steps
        </Button>
      </div>
    </div>
  );
}
