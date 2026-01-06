import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen, FolderOpen } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { format } from 'date-fns';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  created_at: string;
}

interface Article {
  id: string;
  category_id: string;
  title: string;
  content: string;
  author_id: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  kb_categories?: { name: string };
}

export default function KnowledgeManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
    display_order: 0
  });

  const [articleForm, setArticleForm] = useState({
    category_id: '',
    title: '',
    content: '',
    status: 'published' as 'draft' | 'published'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCategories(), loadArticles()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('kb_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
    setCategories(data || []);
  };

  const loadArticles = async () => {
    const { data, error } = await supabase
      .from('kb_articles')
      .select('*, kb_categories(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading articles:', error);
      throw error;
    }
    setArticles(data || []);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('kb_categories')
          .update(categoryForm)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('kb_categories')
          .insert([categoryForm]);

        if (error) throw error;
        toast.success('Category created successfully');
      }

      setCategoryDialogOpen(false);
      resetCategoryForm();
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingArticle) {
        const { error } = await supabase
          .from('kb_articles')
          .update({
            ...articleForm,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingArticle.id);

        if (error) throw error;
        toast.success('Article updated successfully');
      } else {
        const { error } = await supabase
          .from('kb_articles')
          .insert([{
            ...articleForm,
            author_id: user.id
          }]);

        if (error) throw error;
        toast.success('Article created successfully');
      }

      setArticleDialogOpen(false);
      resetArticleForm();
      loadArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Failed to save article');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      display_order: category.display_order
    });
    setCategoryDialogOpen(true);
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setArticleForm({
      category_id: article.category_id,
      title: article.title,
      content: article.content,
      status: article.status
    });
    setArticleDialogOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure? This will delete all articles in this category.')) return;

    try {
      const { error } = await supabase
        .from('kb_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const { error } = await supabase
        .from('kb_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Article deleted successfully');
      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      icon: '',
      display_order: 0
    });
    setEditingCategory(null);
  };

  const resetArticleForm = () => {
    setArticleForm({
      category_id: '',
      title: '',
      content: '',
      status: 'published'
    });
    setEditingArticle(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Base Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="articles">
              <BookOpen className="w-4 h-4 mr-2" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="categories">
              <FolderOpen className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={articleDialogOpen} onOpenChange={(open) => {
                setArticleDialogOpen(open);
                if (!open) resetArticleForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Article
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingArticle ? 'Edit Article' : 'Create New Article'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateArticle} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="article-title">Title *</Label>
                      <Input
                        id="article-title"
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                        required
                        placeholder="Enter article title"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="article-category">Category *</Label>
                        <Select
                          value={articleForm.category_id}
                          onValueChange={(value) => setArticleForm({ ...articleForm, category_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="article-status">Status</Label>
                        <Select
                          value={articleForm.status}
                          onValueChange={(value: 'draft' | 'published') => 
                            setArticleForm({ ...articleForm, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="article-content">Content *</Label>
                      <Textarea
                        id="article-content"
                        value={articleForm.content}
                        onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                        required
                        placeholder="Enter article content"
                        rows={12}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setArticleDialogOpen(false);
                          resetArticleForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingArticle ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading articles...</div>
            ) : articles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No articles yet. Create your first article!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {article.kb_categories?.name || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                          {article.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(article.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditArticle(article)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArticle(article.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
                setCategoryDialogOpen(open);
                if (!open) resetCategoryForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'Edit Category' : 'Create New Category'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cat-name">Name *</Label>
                      <Input
                        id="cat-name"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        required
                        placeholder="Enter category name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cat-description">Description</Label>
                      <Textarea
                        id="cat-description"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        placeholder="Enter category description"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cat-icon">Icon (Emoji)</Label>
                        <Input
                          id="cat-icon"
                          value={categoryForm.icon}
                          onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                          placeholder="📚"
                          maxLength={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cat-order">Display Order</Label>
                        <Input
                          id="cat-order"
                          type="number"
                          value={categoryForm.display_order}
                          onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCategoryDialogOpen(false);
                          resetCategoryForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingCategory ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No categories yet. Create your first category!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="text-2xl">{category.icon}</TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell>{category.display_order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
