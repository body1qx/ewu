import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '@/db/api';
import type { KnowledgeCategory } from '@/types/types';
import { useToast } from '@/hooks/use-toast';

export default function KnowledgeBaseCategoryManager() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    display_order: 0,
  });

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/knowledge-base');
      return;
    }
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: KnowledgeCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        display_order: category.display_order,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        icon: '',
        display_order: categories.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
      display_order: 0,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a category name',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
      } else {
        await createCategory(formData);
        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
      }

      handleCloseDialog();
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: 'Failed to save category',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete);
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
      setCategoryToDelete(null);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category. It may contain articles.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-secondary py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <Button
            onClick={() => navigate('/knowledge-base')}
            variant="ghost"
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold text-white">
                Manage Categories
              </h1>
              <p className="text-white/80 mt-1">
                Organize your knowledge base structure
              </p>
            </div>

            <Button
              onClick={() => handleOpenDialog()}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No categories yet. Create your first category to get started.
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Category
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl flex-shrink-0">
                      {category.icon || '📚'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {category.description || 'No description'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleOpenDialog(category)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setCategoryToDelete(category.id)}
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details below'
                : 'Create a new knowledge base category'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Menu & Nutrition"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., 🍽️"
                maxLength={2}
              />
              <p className="text-xs text-muted-foreground">
                Use an emoji to represent this category
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? All articles in this category will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
