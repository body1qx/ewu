import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ContentBlockRenderer from '@/components/kb/ContentBlockRenderer';
import type { ContentBlock } from '@/types/types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleAr?: string;
  description?: string;
  blocks: ContentBlock[];
}

export default function PreviewModal({
  isOpen,
  onClose,
  title,
  titleAr,
  description,
  blocks,
}: PreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Preview Mode</h2>
              <p className="text-sm text-muted-foreground">
                This is how your article will appear to readers
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Article Header */}
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {title || 'Untitled Article'}
            </h1>

            {titleAr && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground/80 mb-6 leading-tight" dir="rtl">
                {titleAr}
              </h2>
            )}

            {description && (
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Article Content */}
          <Card className="mb-12 shadow-soft-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <CardContent className="p-8 md:p-12">
              {blocks.length > 0 ? (
                <div className="article-content">
                  {blocks.map((block) => (
                    <ContentBlockRenderer key={block.id} block={block} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <p>No content blocks yet. Start adding content to see the preview.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
