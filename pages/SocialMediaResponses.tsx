import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Layers, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  getAllCannedResponses,
  getUniqueCategories,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
  canManageCannedResponses,
} from '@/db/api';
import type { SocialCannedResponse } from '@/types/types';
import ResponseCard from '@/components/canned-responses/ResponseCard';
import ResponseDetailModal from '@/components/canned-responses/ResponseDetailModal';
import ResponseForm from '@/components/canned-responses/ResponseForm';
import FilterBar from '@/components/canned-responses/FilterBar';
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

export default function SocialMediaResponses() {
  const { profile } = useAuth();
  const [responses, setResponses] = useState<SocialCannedResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<SocialCannedResponse[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);

  const [selectedResponse, setSelectedResponse] = useState<SocialCannedResponse | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<SocialCannedResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    platform: 'all',
    category: 'all',
    language: 'all',
    tone: 'all',
    sentiment: 'all',
  });

  useEffect(() => {
    loadData();
    checkPermissions();
  }, [profile]);

  useEffect(() => {
    applyFilters();
  }, [responses, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [responsesData, categoriesData] = await Promise.all([
        getAllCannedResponses(),
        getUniqueCategories(),
      ]);
      setResponses(responsesData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Failed to load canned responses');
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    if (profile?.id) {
      const hasPermission = await canManageCannedResponses(profile.id);
      setCanManage(hasPermission);
    }
  };

  const applyFilters = () => {
    let filtered = [...responses];

    if (filters.platform !== 'all') {
      filtered = filtered.filter(r => r.platform === filters.platform);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(r => r.category === filters.category);
    }

    if (filters.language !== 'all') {
      filtered = filtered.filter(r => r.language === filters.language);
    }

    if (filters.tone !== 'all') {
      filtered = filtered.filter(r => r.tone === filters.tone);
    }

    if (filters.sentiment !== 'all') {
      filtered = filtered.filter(r => r.sentiment === filters.sentiment);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchLower) ||
        r.reply_ar.toLowerCase().includes(searchLower) ||
        r.reply_en?.toLowerCase().includes(searchLower) ||
        r.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredResponses(filtered);
  };

  const handleViewResponse = (response: SocialCannedResponse) => {
    setSelectedResponse(response);
    setDetailModalOpen(true);
  };

  const handleCreateResponse = () => {
    setEditingResponse(null);
    setFormModalOpen(true);
  };

  const handleEditResponse = (response: SocialCannedResponse) => {
    setEditingResponse(response);
    setFormModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setResponseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!responseToDelete) return;

    try {
      await deleteCannedResponse(responseToDelete);
      toast.success('Response deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete response');
    } finally {
      setDeleteDialogOpen(false);
      setResponseToDelete(null);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingResponse) {
        await updateCannedResponse(editingResponse.id, data);
        toast.success('Response updated successfully');
      } else {
        await createCannedResponse(data);
        toast.success('Response created successfully');
      }
      loadData();
    } catch (error) {
      toast.error(`Failed to ${editingResponse ? 'update' : 'create'} response`);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/10 to-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading responses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto px-4 py-8 xl:py-12 max-w-7xl">
        <div className="mb-12 animate-fade-in-scale">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold mb-3 gradient-text-kb">
                Social Media Canned Responses
              </h1>
              <p className="text-lg text-muted-foreground">
                Quick-access library of ready-made replies for social media and CRM channels
              </p>
            </div>
            {canManage && (
              <Button
                onClick={handleCreateResponse}
                className="shadow-soft-lg ios-tap-feedback rounded-ios"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                New Response
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card rounded-ios-lg p-6 border-0 shadow-soft-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{responses.length}</p>
                  <p className="text-sm text-muted-foreground">Total Responses</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-ios-lg p-6 border-0 shadow-soft-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent-orange/20">
                  <Layers className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{categories.length}</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-ios-lg p-6 border-0 shadow-soft-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-accent-orange/20 to-primary/20">
                  <Globe className="h-6 w-6 text-accent-orange" />
                </div>
                <div>
                  <p className="text-3xl font-bold">7</p>
                  <p className="text-sm text-muted-foreground">Platforms</p>
                </div>
              </div>
            </div>
          </div>

          <FilterBar
            search={filters.search}
            platform={filters.platform}
            category={filters.category}
            language={filters.language}
            tone={filters.tone}
            sentiment={filters.sentiment}
            categories={categories}
            onSearchChange={(value) => setFilters({ ...filters, search: value })}
            onPlatformChange={(value) => setFilters({ ...filters, platform: value })}
            onCategoryChange={(value) => setFilters({ ...filters, category: value })}
            onLanguageChange={(value) => setFilters({ ...filters, language: value })}
            onToneChange={(value) => setFilters({ ...filters, tone: value })}
            onSentimentChange={(value) => setFilters({ ...filters, sentiment: value })}
          />
        </div>

        {filteredResponses.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No responses found</h3>
            <p className="text-muted-foreground mb-6">
              {filters.search || filters.platform !== 'all' || filters.category !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first canned response'}
            </p>
            {canManage && (
              <Button onClick={handleCreateResponse}>
                <Plus className="mr-2 h-4 w-4" />
                Create Response
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredResponses.map((response, index) => (
              <div
                key={response.id}
                className="animate-slide-up-fade"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ResponseCard
                  response={response}
                  onView={handleViewResponse}
                  onEdit={canManage ? handleEditResponse : undefined}
                  onDelete={canManage ? handleDeleteClick : undefined}
                  canManage={canManage}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <ResponseDetailModal
        response={selectedResponse}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />

      <ResponseForm
        response={editingResponse}
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        categories={categories}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Response</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this canned response? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
