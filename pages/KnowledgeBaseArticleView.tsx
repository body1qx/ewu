import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Clock, User, Tag, BookOpen, 
  Share2, Printer, ChevronRight, AlertCircle, Heart, Eye, Copy
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  getArticleById, 
  deleteArticle, 
  getCategoryById,
  incrementArticleViews,
  addFavorite,
  removeFavorite,
  isFavorited,
  duplicateArticle
} from '@/db/api';
import type { KnowledgeArticle, KnowledgeCategory } from '@/types/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ContentBlockRenderer from '@/components/kb/ContentBlockRenderer';
import ReadingProgressBar from '@/components/kb/ReadingProgressBar';
import RelatedArticles from '@/components/kb/RelatedArticles';

export default function KnowledgeBaseArticleView() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [category, setCategory] = useState<KnowledgeCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const isWriterOrAdmin = profile?.role === 'writer' || profile?.role === 'admin';
  const canEdit = isWriterOrAdmin && (profile?.role === 'admin' || article?.author_id === profile?.id);

  useEffect(() => {
    if (articleId) {
      loadArticle();
      checkFavoriteStatus();
    }
  }, [articleId]);

  const loadArticle = async () => {
    if (!articleId) return;
    
    try {
      setLoading(true);
      const data = await getArticleById(articleId);
      
      if (!data) {
        toast.error('Article not found');
        return;
      }

      setArticle(data);

      // Increment view count
      if (data.status === 'published') {
        await incrementArticleViews(articleId);
      }

      // Load category
      if (data.category_id) {
        const cat = await getCategoryById(data.category_id);
        setCategory(cat);
      }
    } catch (error) {
      console.error('Error loading article:', error);
      toast.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!articleId || !profile?.id) return;
    
    try {
      const status = await isFavorited(articleId, profile.id);
      setFavorited(status);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!articleId || !profile?.id) return;
    
    try {
      setFavLoading(true);
      if (favorited) {
        await removeFavorite(articleId, profile.id);
        setFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await addFavorite(articleId, profile.id);
        setFavorited(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    } finally {
      setFavLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!articleId) return;
    
    try {
      setDeleting(true);
      await deleteArticle(articleId);
      toast.success('Article deleted successfully');
      navigate('/knowledge-base');
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleCopyArticle = async () => {
    if (!articleId || !profile?.id) return;
    
    try {
      setCopying(true);
      const copiedArticle = await duplicateArticle(articleId, profile.id);
      
      if (copiedArticle) {
        toast.success('Article copied successfully');
        // Navigate to edit the copied article
        navigate(`/knowledge-base/edit/${copiedArticle.id}`);
      }
    } catch (error) {
      console.error('Error copying article:', error);
      toast.error('Failed to copy article');
    } finally {
      setCopying(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Skeleton className="h-8 w-48 mb-8 bg-muted" />
          <Skeleton className="h-12 w-full mb-4 bg-muted" />
          <Skeleton className="h-6 w-3/4 mb-8 bg-muted" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full bg-muted" />
            <Skeleton className="h-4 w-full bg-muted" />
            <Skeleton className="h-4 w-2/3 bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Article Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/knowledge-base')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Knowledge Base
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse content blocks
  const contentBlocks = article.content_blocks?.blocks || [];
  const hasBlocks = contentBlocks.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <ReadingProgressBar />
      
      {/* Header Actions */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/knowledge-base')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              disabled={favLoading}
              className={favorited ? 'text-red-500 hover:text-red-600' : ''}
            >
              <Heart className={`h-5 w-5 ${favorited ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrint}>
              <Printer className="h-5 w-5" />
            </Button>
            {isWriterOrAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyArticle}
                disabled={copying}
                title="Copy Article"
              >
                <Copy className="h-5 w-5" />
              </Button>
            )}
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/knowledge-base/edit/${articleId}`)}
                >
                  <Edit className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors">
            Home
          </button>
          <ChevronRight className="h-4 w-4" />
          <button onClick={() => navigate('/knowledge-base')} className="hover:text-foreground transition-colors">
            Knowledge Base
          </button>
          {category && (
            <>
              <ChevronRight className="h-4 w-4" />
              <button 
                onClick={() => navigate(`/knowledge-base/category/${category.id}`)}
                className="hover:text-foreground transition-colors"
              >
                {category.name}
              </button>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium truncate max-w-xs">{article.title}</span>
        </nav>

        {/* Article Header */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {article.pinned && (
            <Badge className="mb-4 bg-amber-500 text-white">
              📌 Pinned Article
            </Badge>
          )}
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {article.title}
          </h1>

          {article.description && (
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            {category && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{category.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Updated {format(new Date(article.updated_at), 'MMM dd, yyyy')}</span>
            </div>
            {article.view_count !== undefined && article.view_count > 0 && (
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{article.view_count} views</span>
              </div>
            )}
          </div>
        </div>

        {/* Article Content */}
        <Card className="mb-12 shadow-soft-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <CardContent className="p-8 md:p-12">
            {hasBlocks ? (
              <div className="article-content">
                {contentBlocks.map((block) => (
                  <ContentBlockRenderer key={block.id} block={block} />
                ))}
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <div 
                  className="text-foreground leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Articles */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <RelatedArticles
            currentArticleId={article.id}
            categoryId={article.category_id}
            maxArticles={3}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
