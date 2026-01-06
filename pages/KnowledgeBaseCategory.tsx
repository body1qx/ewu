import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Filter, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth/AuthProvider';
import { getCategoryById, getArticlesByCategory } from '@/db/api';
import type { KnowledgeCategory, KnowledgeArticle } from '@/types/types';
import { toast } from 'sonner';
import ArticleCard from '@/components/kb/ArticleCard';

export default function KnowledgeBaseCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [category, setCategory] = useState<KnowledgeCategory | null>(null);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const isWriterOrAdmin = profile?.role === 'writer' || profile?.role === 'admin';

  useEffect(() => {
    if (categoryId) {
      loadData();
    }
  }, [categoryId]);

  useEffect(() => {
    filterArticles();
  }, [articles, searchQuery]);

  const loadData = async () => {
    if (!categoryId) return;

    try {
      setLoading(true);
      const [categoryData, articlesData] = await Promise.all([
        getCategoryById(categoryId),
        getArticlesByCategory(categoryId),
      ]);

      setCategory(categoryData);
      
      // Sort: pinned first, then by updated date
      const sorted = articlesData.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      
      setArticles(sorted);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    if (!searchQuery.trim()) {
      setFilteredArticles(articles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query)
    );
    setFilteredArticles(filtered);
  };

  const pinnedArticles = filteredArticles.filter((a) => a.pinned);
  const regularArticles = filteredArticles.filter((a) => !a.pinned);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Skeleton className="h-8 w-48 mb-8 bg-muted" />
          <Skeleton className="h-12 w-full mb-8 bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Category Not Found</h2>
          <Button onClick={() => navigate('/knowledge-base')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/knowledge-base')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
              {category.description && (
                <p className="text-muted-foreground mt-1">{category.description}</p>
              )}
            </div>
          </div>

          {isWriterOrAdmin && (
            <Button
              onClick={() => navigate(`/knowledge-base/new?category=${categoryId}`)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Article
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search articles in this category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Articles Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Pinned Articles Section */}
        {pinnedArticles.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Pin className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-foreground">Pinned Articles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pinnedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  categoryName={category.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Articles Section */}
        {regularArticles.length > 0 && (
          <div>
            {pinnedArticles.length > 0 && (
              <h2 className="text-xl font-semibold text-foreground mb-6">All Articles</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  categoryName={category.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No articles found' : 'No articles yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Be the first to create an article in this category'}
            </p>
            {isWriterOrAdmin && !searchQuery && (
              <Button
                onClick={() => navigate(`/knowledge-base/new?category=${categoryId}`)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create First Article
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
