import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FileText, AlertCircle, CheckCircle, Clock, Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/hooks/use-i18n';
import {
  getAllCaseNotes,
  getCaseStatistics,
  deleteCaseNote,
  canManageCases,
  canViewAllCases,
} from '@/db/api';
import type { CaseNote, CaseStatistics, CaseStatus } from '@/types/types';
import CaseNoteCard from '@/components/case-notes/CaseNoteCard';
import CaseNoteFormModal from '@/components/case-notes/CaseNoteFormModal';
import CaseNoteDetailModal from '@/components/case-notes/CaseNoteDetailModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function CustomerCaseNotes() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [cases, setCases] = useState<CaseNote[]>([]);
  const [stats, setStats] = useState<CaseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [canViewAll, setCanViewAll] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseNote | null>(null);
  const [editingCase, setEditingCase] = useState<CaseNote | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
    checkPermissions();
  }, [profile]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [casesData, statsData] = await Promise.all([
        getAllCaseNotes(),
        getCaseStatistics(),
      ]);
      setCases(casesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading case notes:', error);
      toast.error(t('case_notes.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    if (profile?.id) {
      const [managePermission, viewAllPermission] = await Promise.all([
        canManageCases(profile.id),
        canViewAllCases(profile.id),
      ]);
      setCanManage(managePermission);
      setCanViewAll(viewAllPermission);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCaseNote(id);
      toast.success(t('case_notes.delete_success'));
      loadData();
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error(t('case_notes.delete_error'));
    }
  };

  const handleCreateCase = () => {
    setShowCreateModal(true);
  };

  const handleFormSuccess = () => {
    loadData();
  };

  const handleViewCase = (caseNote: CaseNote) => {
    setSelectedCase(caseNote);
    setShowDetailModal(true);
  };

  const handleEditCase = (caseNote: CaseNote) => {
    setEditingCase(caseNote);
    setShowDetailModal(false);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCase(null);
  };

  const handleCloseEditModal = () => {
    setEditingCase(null);
  };

  // Get unique categories from cases
  const uniqueCategories = useMemo(() => {
    const categories = cases.map(c => c.issue_category).filter(cat => cat && cat.trim() !== '');
    return Array.from(new Set(categories));
  }, [cases]);

  // Filter and search logic
  const filteredCases = useMemo(() => {
    let filtered = [...cases];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.customer_phone?.toLowerCase().includes(query) ||
          c.customer_name?.toLowerCase().includes(query) ||
          c.issue_category?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.action_taken?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((c) => c.issue_category === categoryFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      filtered = filtered.filter((c) => {
        const caseDate = new Date(c.created_at);
        switch (dateFilter) {
          case 'today':
            return caseDate >= today;
          case 'yesterday':
            return caseDate >= yesterday && caseDate < today;
          case 'week':
            return caseDate >= weekAgo;
          case 'month':
            return caseDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [cases, searchQuery, statusFilter, categoryFilter, dateFilter]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (categoryFilter !== 'all') count++;
    if (dateFilter !== 'all') count++;
    return count;
  }, [statusFilter, categoryFilter, dateFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/10 to-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">{t('case_notes.loading')}</p>
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
                {t('case_notes.title')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('case_notes.subtitle')}
              </p>
            </div>
            <Button
              size="lg"
              className="shadow-soft-lg ios-tap-feedback rounded-ios"
              onClick={handleCreateCase}
            >
              <Plus className="mr-2 h-5 w-5" />
              {t('case_notes.new_case')}
            </Button>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="glass-card rounded-ios-lg p-6 border-0 shadow-soft-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.total_cases}</p>
                    <p className="text-sm text-muted-foreground">{t('case_notes.total_cases')}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-ios-lg p-6 border-0 shadow-soft-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.open_cases}</p>
                    <p className="text-sm text-muted-foreground">{t('case_notes.open_cases')}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-ios-lg p-6 border-0 shadow-soft-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.escalated_cases}</p>
                    <p className="text-sm text-muted-foreground">{t('case_notes.escalated_cases')}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-ios-lg p-6 border-0 shadow-soft-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.closed_cases}</p>
                    <p className="text-sm text-muted-foreground">{t('case_notes.closed_cases')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filter Section */}
        {cases.length > 0 && (
          <div className="mb-8 space-y-4 animate-fade-in-scale">
            {/* Search Bar */}
            <div className="glass-card rounded-ios-lg p-4 border-0 shadow-soft-lg">
              <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('case_notes.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 rounded-ios border-0 bg-background/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setShowFilters(!showFilters)}
                  className="rounded-ios relative"
                >
                  <SlidersHorizontal className="mr-2 h-5 w-5" />
                  {t('case_notes.filters')}
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 bg-accent text-accent-foreground">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="glass-card rounded-ios-lg p-6 border-0 shadow-soft-lg animate-slide-down">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    {t('case_notes.filter_options')}
                  </h3>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="mr-2 h-4 w-4" />
                      {t('case_notes.clear_filters')}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('case_notes.filter_by_status')}
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="rounded-ios border-0 bg-background/50">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('case_notes.all_statuses')}</SelectItem>
                        <SelectItem value="open">{t('case_notes.status_open')}</SelectItem>
                        <SelectItem value="pending_tl">{t('case_notes.status_pending_tl')}</SelectItem>
                        <SelectItem value="escalated">{t('case_notes.status_escalated')}</SelectItem>
                        <SelectItem value="closed">{t('case_notes.status_closed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('case_notes.filter_by_category')}
                    </label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="rounded-ios border-0 bg-background/50">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('case_notes.all_categories')}</SelectItem>
                        {uniqueCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('case_notes.filter_by_date')}
                    </label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="rounded-ios border-0 bg-background/50">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('case_notes.all_dates')}</SelectItem>
                        <SelectItem value="today">{t('case_notes.today')}</SelectItem>
                        <SelectItem value="yesterday">{t('case_notes.yesterday')}</SelectItem>
                        <SelectItem value="week">{t('case_notes.last_week')}</SelectItem>
                        <SelectItem value="month">{t('case_notes.last_month')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t('case_notes.showing_results', {
                  count: filteredCases.length,
                  total: cases.length,
                })}
              </span>
              {(searchQuery || activeFiltersCount > 0) && (
                <span className="text-primary font-medium">
                  {t('case_notes.filters_active')}
                </span>
              )}
            </div>
          </div>
        )}

        {cases.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('case_notes.no_cases')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('case_notes.no_cases_description')}
            </p>
            <Button onClick={handleCreateCase}>
              <Plus className="mr-2 h-4 w-4" />
              {t('case_notes.create_first')}
            </Button>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('case_notes.no_results')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('case_notes.no_results_description')}
            </p>
            <Button onClick={clearFilters} variant="outline">
              <X className="mr-2 h-4 w-4" />
              {t('case_notes.clear_filters')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCases.map((caseNote, index) => (
              <div
                key={caseNote.id}
                className="animate-slide-up-fade"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CaseNoteCard
                  caseNote={caseNote}
                  onView={handleViewCase}
                  onEdit={canManage ? handleEditCase : undefined}
                  onDelete={canManage ? handleDelete : undefined}
                  canManage={canManage}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CaseNoteFormModal
        isOpen={showCreateModal || !!editingCase}
        onClose={() => {
          setShowCreateModal(false);
          handleCloseEditModal();
        }}
        onSuccess={handleFormSuccess}
        caseNote={editingCase}
      />

      {/* Detail View Modal */}
      <CaseNoteDetailModal
        caseNote={selectedCase}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        onEdit={canManage ? handleEditCase : undefined}
        canEdit={canManage}
      />
    </div>
  );
}
