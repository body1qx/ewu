import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  getAllCategories,
  getArticleById, 
  createArticle, 
  updateArticle 
} from '@/db/api';
import type { ContentBlock } from '@/types/types';
import { toast } from 'sonner';
import MetadataPanel from '@/components/kb/editor/MetadataPanel';
import EnhancedBlockEditor from '@/components/kb/editor/EnhancedBlockEditor';
import PreviewModal from '@/components/kb/editor/PreviewModal';

export default function KnowledgeBaseEditor() {
  const { articleId } = useParams<{ articleId?: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Metadata state
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [pinned, setPinned] = useState(false);

  // Content state
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isWriterOrAdmin = profile?.role === 'writer' || profile?.role === 'admin';
  const isEditMode = !!articleId;

  useEffect(() => {
    if (!isWriterOrAdmin) {
      toast.error('Access denied');
      navigate('/knowledge-base');
      return;
    }

    loadData();
  }, [articleId]);

  // Autosave every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges || !isEditMode) return;

    const timer = setTimeout(() => {
      handleSaveDraft(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, blocks, title, description, categoryId, tags, status, pinned]);

  // Track changes
  useEffect(() => {
    if (loading) return;
    setHasUnsavedChanges(true);
  }, [blocks, title, titleAr, description, categoryId, tags, status, pinned]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch all categories to find "Refund & Complaints"
      const categories = await getAllCategories();
      const refundCategory = categories.find(
        cat => cat.name === 'Refund & Complaints'
      );

      // Load existing article
      if (articleId) {
        const article = await getArticleById(articleId);
        if (article) {
          // Check permissions
          if (article.author_id !== user?.id && profile?.role !== 'admin') {
            toast.error('You can only edit your own articles');
            navigate('/knowledge-base');
            return;
          }

          setTitle(article.title);
          setTitleAr(article.title_ar || '');
          setDescription(article.description || '');
          // Always use Refund & Complaints category
          setCategoryId(refundCategory?.id || article.category_id || '');
          setTags(article.tags || []);
          setStatus(article.status);
          setPinned(article.pinned || false);

          // Load content blocks
          if (article.content_blocks?.blocks) {
            setBlocks(article.content_blocks.blocks);
          } else if (article.content) {
            // Fallback: convert old content to paragraph block
            setBlocks([
              {
                id: crypto.randomUUID(),
                type: 'paragraph',
                content: article.content,
              },
            ]);
          }
        }
      } else {
        // For new articles, automatically set to Refund & Complaints category
        if (refundCategory) {
          setCategoryId(refundCategory.id);
        } else {
          toast.error('Refund & Complaints category not found. Please contact administrator.');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load editor');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (isAutosave = false) => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!categoryId) {
      toast.error('Category not set. Please reload the page.');
      return;
    }

    try {
      setSaving(true);

      const articleData = {
        title: title.trim(),
        title_ar: titleAr.trim() || undefined,
        description: description.trim() || undefined,
        category_id: categoryId,
        tags,
        status: 'draft' as const,
        pinned,
        content: '', // Keep for backward compatibility
        content_blocks: {
          version: '1.0' as const,
          blocks,
        },
        author_id: user?.id,
      };

      if (isEditMode && articleId) {
        await updateArticle(articleId, articleData);
      } else {
        const newArticle = await createArticle(articleData);
        if (newArticle?.id) {
          navigate(`/knowledge-base/edit/${newArticle.id}`, { replace: true });
        }
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      if (!isAutosave) {
        toast.success('Draft saved successfully');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!categoryId) {
      toast.error('Category not set. Please reload the page.');
      return;
    }

    if (blocks.length === 0) {
      toast.error('Please add some content');
      return;
    }

    try {
      setSaving(true);

      const articleData = {
        title: title.trim(),
        title_ar: titleAr.trim() || undefined,
        description: description.trim() || undefined,
        category_id: categoryId,
        tags,
        status: 'published' as const,
        pinned,
        content: '', // Keep for backward compatibility
        content_blocks: {
          version: '1.0' as const,
          blocks,
        },
        author_id: user?.id,
      };

      let finalArticleId = articleId;

      if (isEditMode && articleId) {
        await updateArticle(articleId, articleData);
      } else {
        const newArticle = await createArticle(articleData);
        finalArticleId = newArticle?.id;
      }

      setHasUnsavedChanges(false);
      toast.success('Article published successfully!');
      
      if (finalArticleId) {
        navigate(`/knowledge-base/article/${finalArticleId}`);
      } else {
        navigate('/knowledge-base');
      }
    } catch (error) {
      console.error('Error publishing article:', error);
      toast.error('Failed to publish article');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Top Bar */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    navigate('/knowledge-base');
                  }
                } else {
                  navigate('/knowledge-base');
                }
              }}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {isEditMode ? 'Edit Article' : 'Create New Article'}
              </h1>
              {hasUnsavedChanges && (
                <p className="text-xs text-muted-foreground">Unsaved changes</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Metadata */}
        <div className="w-[350px] flex-shrink-0 overflow-hidden">
          <MetadataPanel
            title={title}
            titleAr={titleAr}
            description={description}
            tags={tags}
            status={status}
            pinned={pinned}
            lastSaved={lastSaved}
            saving={saving}
            onTitleChange={setTitle}
            onTitleArChange={setTitleAr}
            onDescriptionChange={setDescription}
            onTagsChange={setTags}
            onStatusChange={setStatus}
            onPinnedChange={setPinned}
            onSaveDraft={() => handleSaveDraft(false)}
            onPreview={handlePreview}
            onPublish={handlePublish}
          />
        </div>

        {/* Right Panel - Editor */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-12">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Content Editor</h2>
              <p className="text-sm text-muted-foreground">
                Create beautiful content with blocks. Drag to reorder, click + to add new blocks.
              </p>
            </div>

            <EnhancedBlockEditor
              blocks={blocks}
              onChange={setBlocks}
              articleId={articleId || 'temp'}
            />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        titleAr={titleAr}
        description={description}
        blocks={blocks}
      />
    </div>
  );
}
