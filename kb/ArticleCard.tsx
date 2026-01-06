import { useNavigate } from 'react-router-dom';
import { Clock, Eye, Pin, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { KnowledgeArticle } from '@/types/types';
import { format, isAfter, subDays } from 'date-fns';

interface ArticleCardProps {
  article: KnowledgeArticle;
  categoryName?: string;
}

export default function ArticleCard({ article, categoryName }: ArticleCardProps) {
  const navigate = useNavigate();

  const isNew = isAfter(new Date(article.created_at), subDays(new Date(), 7));
  const isRecentlyUpdated = isAfter(new Date(article.updated_at), subDays(new Date(), 3));

  const handleClick = () => {
    navigate(`/knowledge-base/article/${article.id}`);
  };

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-soft-lg hover:scale-[1.02] relative overflow-hidden"
      onClick={handleClick}
    >
      {/* Pinned Indicator */}
      {article.pinned && (
        <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 rounded-bl-lg flex items-center gap-1 text-xs font-medium">
          <Pin className="h-3 w-3" />
          Pinned
        </div>
      )}

      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
            {article.title}
          </h3>
          
          {/* Status Badges */}
          <div className="flex flex-col gap-1">
            {isNew && (
              <Badge className="bg-green-500 text-white text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                NEW
              </Badge>
            )}
            {!isNew && isRecentlyUpdated && (
              <Badge className="bg-blue-500 text-white text-xs">
                Updated
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {article.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
            {article.description}
          </p>
        )}

        {/* Metadata Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
          <div className="flex items-center gap-4">
            {categoryName && (
              <span className="font-medium text-primary">{categoryName}</span>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(article.updated_at), 'MMM dd, yyyy')}</span>
            </div>
          </div>
          
          {article.view_count !== undefined && article.view_count > 0 && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{article.view_count} views</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
