import { useState } from 'react';
import { Info, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import type { ContentBlock } from '@/types/types';
import ImageLightbox from './ImageLightbox';

interface ContentBlockRendererProps {
  block: ContentBlock;
  onImageClick?: (images: string[], index: number) => void;
}

export default function ContentBlockRenderer({ block, onImageClick }: ContentBlockRendererProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleImageClick = (images: string[], index: number) => {
    if (onImageClick) {
      onImageClick(images, index);
    } else {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  // Paragraph Block
  if (block.type === 'paragraph') {
    return (
      <div className="prose prose-lg max-w-none mb-6">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {block.content}
        </p>
        {block.contentAr && (
          <p className="text-foreground leading-relaxed whitespace-pre-wrap mt-2 text-right" dir="rtl">
            {block.contentAr}
          </p>
        )}
      </div>
    );
  }

  // Heading Block
  if (block.type === 'heading') {
    const level = block.metadata?.level || 2;
    const sizeClasses = {
      1: 'text-3xl font-bold',
      2: 'text-2xl font-semibold',
      3: 'text-xl font-semibold'
    };

    const className = `${sizeClasses[level]} text-foreground mb-4 mt-8`;

    if (level === 1) {
      return (
        <h1 className={className}>
          {block.content}
          {block.contentAr && (
            <span className="block mt-2 text-right" dir="rtl">
              {block.contentAr}
            </span>
          )}
        </h1>
      );
    }

    if (level === 3) {
      return (
        <h3 className={className}>
          {block.content}
          {block.contentAr && (
            <span className="block mt-2 text-right" dir="rtl">
              {block.contentAr}
            </span>
          )}
        </h3>
      );
    }

    return (
      <h2 className={className}>
        {block.content}
        {block.contentAr && (
          <span className="block mt-2 text-right" dir="rtl">
            {block.contentAr}
          </span>
        )}
      </h2>
    );
  }

  // List Block
  if (block.type === 'list') {
    const items = block.content.split('\n').filter(item => item.trim());
    const ListTag = block.metadata?.ordered ? 'ol' : 'ul';
    
    return (
      <div className="mb-6">
        <ListTag className={`space-y-2 ${block.metadata?.ordered ? 'list-decimal' : 'list-disc'} list-inside`}>
          {items.map((item, idx) => (
            <li key={idx} className="text-foreground leading-relaxed">
              {item}
            </li>
          ))}
        </ListTag>
      </div>
    );
  }

  // Callout Block
  if (block.type === 'callout') {
    const style = block.metadata?.style || 'info';
    const styles = {
      info: {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
        text: 'text-blue-900 dark:text-blue-100'
      },
      warning: {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
        text: 'text-amber-900 dark:text-amber-100'
      },
      success: {
        bg: 'bg-green-50 dark:bg-green-950/30',
        border: 'border-green-200 dark:border-green-800',
        icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
        text: 'text-green-900 dark:text-green-100'
      },
      tip: {
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        border: 'border-purple-200 dark:border-purple-800',
        icon: <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
        text: 'text-purple-900 dark:text-purple-100'
      }
    };

    const currentStyle = styles[style];

    return (
      <div className={`${currentStyle.bg} ${currentStyle.border} border-l-4 p-4 rounded-r-lg mb-6`}>
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">{currentStyle.icon}</div>
          <div className={`flex-1 ${currentStyle.text}`}>
            <p className="leading-relaxed whitespace-pre-wrap">{block.content}</p>
            {block.contentAr && (
              <p className="leading-relaxed whitespace-pre-wrap mt-2 text-right" dir="rtl">
                {block.contentAr}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Image Block
  if (block.type === 'image') {
    return (
      <div className="mb-8">
        <div 
          className="relative rounded-xl overflow-hidden shadow-soft-lg cursor-pointer group"
          onClick={() => handleImageClick([block.content], 0)}
        >
          <img
            src={block.content}
            alt={block.metadata?.caption || 'Article image'}
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
        {(block.metadata?.caption || block.metadata?.captionAr) && (
          <div className="mt-3 text-center">
            {block.metadata.caption && (
              <p className="text-sm text-muted-foreground">{block.metadata.caption}</p>
            )}
            {block.metadata.captionAr && (
              <p className="text-sm text-muted-foreground mt-1 text-right" dir="rtl">
                {block.metadata.captionAr}
              </p>
            )}
          </div>
        )}
        <ImageLightbox
          images={[block.content]}
          initialIndex={0}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          captions={block.metadata?.caption ? [block.metadata.caption] : []}
        />
      </div>
    );
  }

  // Gallery Block
  if (block.type === 'gallery') {
    const images = block.metadata?.images || [];
    
    return (
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative rounded-lg overflow-hidden shadow-soft-md cursor-pointer group aspect-square"
              onClick={() => handleImageClick(images, idx)}
            >
              <img
                src={img}
                alt={`Gallery image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
        {(block.metadata?.caption || block.metadata?.captionAr) && (
          <div className="mt-3 text-center">
            {block.metadata.caption && (
              <p className="text-sm text-muted-foreground">{block.metadata.caption}</p>
            )}
            {block.metadata.captionAr && (
              <p className="text-sm text-muted-foreground mt-1 text-right" dir="rtl">
                {block.metadata.captionAr}
              </p>
            )}
          </div>
        )}
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </div>
    );
  }

  // Steps Block
  if (block.type === 'steps') {
    const steps = block.content.split('\n').filter(step => step.trim());
    
    return (
      <div className="mb-8 space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
              {idx + 1}
            </div>
            <div className="flex-1 pt-1">
              <p className="text-foreground leading-relaxed">{step}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table Block
  if (block.type === 'table') {
    const columns = block.metadata?.columns || [];
    const rows = block.metadata?.rows || [];
    
    return (
      <div className="mb-8 overflow-x-auto">
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-soft-md">
          <thead>
            <tr className="bg-muted">
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-3 text-sm text-foreground border-b">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
