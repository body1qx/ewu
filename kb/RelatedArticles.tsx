import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getAllArticles } from '@/db/api';
import type { KnowledgeArticle } from '@/types/types';

interface RelatedArticlesProps {
  currentArticleId: string;
  categoryId: string | null;
  maxArticles?: number;
}

export default function RelatedArticles({
  currentArticleId,
  categoryId,
  maxArticles = 3
}: RelatedArticlesProps) {
  const navigate = useNavigate();
  const [relatedArticles, setRelatedArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelatedArticles();
  }, [currentArticleId, categoryId]);

  const loadRelatedArticles = async () => {
    try {
      setLoading(true);
      const articles = await getAllArticles();
      
      // Filter: same category, published, not current article
      const filtered = articles
        .filter(
          (a) =>
            a.id !== currentArticleId &&
            a.status === 'published' &&
            a.category_id === categoryId
        )
        .slice(0, maxArticles);

      setRelatedArticles(filtered);
    } catch (error) {
      console.error('Error loading related articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Related Articles
      </h3>
      
      <div className="space-y-3">
        {relatedArticles.map((article) => (
          <Card
            key={article.id}
            className="p-4 cursor-pointer transition-all duration-300 hover:shadow-soft-lg hover:scale-[1.02] group"
            onClick={() => navigate(`/knowledge-base/article/${article.id}`)}
          >
            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {article.title}
            </h4>
            
            {article.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {article.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(article.updated_at)}</span>
              </div>
              {article.view_count !== undefined && article.view_count > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{article.view_count} views</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
