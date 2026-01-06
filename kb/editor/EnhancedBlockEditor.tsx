import { useState, useRef } from 'react';
import { 
  Plus, GripVertical, Trash2, Type, List, AlertCircle, 
  Image as ImageIcon, ListOrdered, Quote, Minus, ChevronDown
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { uploadKBImage } from '@/db/api';
import { toast } from 'sonner';
import type { ContentBlock, ContentBlockType, CalloutStyle } from '@/types/types';

interface EnhancedBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  articleId: string;
}

export default function EnhancedBlockEditor({ blocks, onChange, articleId }: EnhancedBlockEditorProps) {
  const [hoveredBlockIndex, setHoveredBlockIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const addBlock = (type: ContentBlockType, insertAfterIndex?: number) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
      metadata: type === 'heading' ? { level: 2 } : type === 'callout' ? { style: 'info' } : {}
    };

    if (insertAfterIndex !== undefined) {
      const newBlocks = [...blocks];
      newBlocks.splice(insertAfterIndex + 1, 0, newBlock);
      onChange(newBlocks);
    } else {
      onChange([...blocks, newBlock]);
    }
  };

  const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    onChange(newBlocks);
  };

  const deleteBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveBlock(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const detectLanguage = (text: string): 'ltr' | 'rtl' => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text) ? 'rtl' : 'ltr';
  };

  const renderBlockEditor = (block: ContentBlock, index: number) => {
    const isHovered = hoveredBlockIndex === index;
    const isDragging = draggedIndex === index;

    return (
      <div
        key={block.id}
        className={`group relative transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        }`}
        onMouseEnter={() => setHoveredBlockIndex(index)}
        onMouseLeave={() => setHoveredBlockIndex(null)}
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-start gap-2">
          {/* Left Controls */}
          <div className={`flex items-center gap-1 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Drag Handle */}
            <button
              className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing transition-colors"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Add Block Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 hover:bg-muted rounded transition-colors">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => addBlock('paragraph', index)}>
                  <Type className="h-4 w-4 mr-2" />
                  Paragraph
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('heading', index)}>
                  <Type className="h-4 w-4 mr-2" />
                  Heading
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('list', index)}>
                  <List className="h-4 w-4 mr-2" />
                  Bullet List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('callout', index)}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Callout
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('image', index)}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addBlock('steps', index)}>
                  <ListOrdered className="h-4 w-4 mr-2" />
                  Steps
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Block Content */}
          <div className="flex-1 min-w-0">
            <Card className={`p-4 transition-all duration-200 ${
              isHovered ? 'shadow-soft-lg border-primary/50' : 'shadow-sm'
            }`}>
              {/* Paragraph Block */}
              {block.type === 'paragraph' && (
                <div className="space-y-3">
                  <Textarea
                    value={block.content}
                    onChange={(e) => {
                      updateBlock(index, { content: e.target.value });
                    }}
                    placeholder="Type your content... (auto-detects language)"
                    rows={4}
                    dir={detectLanguage(block.content)}
                    className="border-0 focus-visible:ring-0 resize-none text-base leading-relaxed"
                  />
                </div>
              )}

              {/* Heading Block */}
              {block.type === 'heading' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Select
                      value={String(block.metadata?.level || 2)}
                      onValueChange={(value) =>
                        updateBlock(index, {
                          metadata: { ...block.metadata, level: Number(value) as 1 | 2 | 3 }
                        })
                      }
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
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
                    value={block.content}
                    onChange={(e) => updateBlock(index, { content: e.target.value })}
                    placeholder="Heading text..."
                    dir={detectLanguage(block.content)}
                    className="border-0 focus-visible:ring-0 text-2xl font-bold"
                  />
                </div>
              )}

              {/* List Block */}
              {block.type === 'list' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Select
                      value={block.metadata?.ordered ? 'ordered' : 'unordered'}
                      onValueChange={(value) =>
                        updateBlock(index, {
                          metadata: { ...block.metadata, ordered: value === 'ordered' }
                        })
                      }
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unordered">Bullet List</SelectItem>
                        <SelectItem value="ordered">Numbered List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateBlock(index, { content: e.target.value })}
                    placeholder="Enter list items (one per line)..."
                    rows={5}
                    dir={detectLanguage(block.content)}
                    className="border-0 focus-visible:ring-0 resize-none"
                  />
                </div>
              )}

              {/* Callout Block */}
              {block.type === 'callout' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Select
                      value={block.metadata?.style || 'info'}
                      onValueChange={(value) =>
                        updateBlock(index, {
                          metadata: { ...block.metadata, style: value as CalloutStyle }
                        })
                      }
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
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
                    value={block.content}
                    onChange={(e) => updateBlock(index, { content: e.target.value })}
                    placeholder="Callout content..."
                    rows={3}
                    dir={detectLanguage(block.content)}
                    className="border-0 focus-visible:ring-0 resize-none"
                  />
                </div>
              )}

              {/* Image Block */}
              {block.type === 'image' && (
                <div className="space-y-3">
                  {block.content ? (
                    <div className="space-y-3">
                      <div className="relative group/image">
                        <img
                          src={block.content}
                          alt="Preview"
                          className="w-full h-auto rounded-lg shadow-soft-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRefs.current[index]?.click()}
                          >
                            Replace
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateBlock(index, { content: '' })}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      <Input
                        value={block.metadata?.caption || ''}
                        onChange={(e) =>
                          updateBlock(index, {
                            metadata: { ...block.metadata, caption: e.target.value }
                          })
                        }
                        placeholder="Image caption (optional)..."
                        className="border-0 focus-visible:ring-0 text-sm text-muted-foreground"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                      <input
                        ref={(el) => {
                          if (el) fileInputRefs.current[index] = el;
                        }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(index, file);
                        }}
                        className="hidden"
                        disabled={uploadingIndex === index}
                      />
                      <button
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="w-full"
                        disabled={uploadingIndex === index}
                      >
                        <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm font-medium mb-1">
                          {uploadingIndex === index ? 'Uploading...' : 'Click to upload image'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Steps Block */}
              {block.type === 'steps' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <ListOrdered className="h-4 w-4" />
                    Step-by-Step Guide
                  </div>
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateBlock(index, { content: e.target.value })}
                    placeholder="Enter steps (one per line)..."
                    rows={6}
                    dir={detectLanguage(block.content)}
                    className="border-0 focus-visible:ring-0 resize-none"
                  />
                </div>
              )}
            </Card>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => deleteBlock(index)}
            className={`p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="Delete block"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 pb-32">
      {blocks.length === 0 && (
        <div className="text-center py-16">
          <Type className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-6">Start creating your article</p>
          <Button onClick={() => addBlock('paragraph')} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Block
          </Button>
        </div>
      )}

      {blocks.map((block, index) => renderBlockEditor(block, index))}

      {blocks.length > 0 && (
        <div className="pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full gap-2 hover:scale-[1.02] transition-all">
                <Plus className="h-4 w-4" />
                Add Block
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuItem onClick={() => addBlock('paragraph')}>
                <Type className="h-4 w-4 mr-2" />
                Paragraph
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addBlock('heading')}>
                <Type className="h-4 w-4 mr-2" />
                Heading
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addBlock('list')}>
                <List className="h-4 w-4 mr-2" />
                List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addBlock('callout')}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Callout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addBlock('image')}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addBlock('steps')}>
                <ListOrdered className="h-4 w-4 mr-2" />
                Steps
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
