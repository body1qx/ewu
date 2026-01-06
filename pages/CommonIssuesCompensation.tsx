import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  MessageSquare,
  Gift,
  RefreshCw,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Star,
  StarOff,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { canWrite } from '@/lib/permissions';
import {
  getAllCommonIssues,
  getCommonIssueById,
  searchCommonIssues,
  filterCommonIssues,
  createCommonIssue,
  updateCommonIssue,
  deleteCommonIssue,
  toggleCommonIssueFeatured,
} from '@/db/api';
import type { CommonIssue, IssueCategory, CompensationType } from '@/types/types';

const CATEGORY_OPTIONS: { value: IssueCategory; label: string; labelAr: string }[] = [
  { value: 'delivery', label: 'Delivery', labelAr: 'التوصيل' },
  { value: 'product', label: 'Product', labelAr: 'المنتج' },
  { value: 'app', label: 'App', labelAr: 'التطبيق' },
  { value: 'payment', label: 'Payment', labelAr: 'الدفع' },
  { value: 'service', label: 'Service', labelAr: 'الخدمة' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
];

const COMPENSATION_OPTIONS: { value: CompensationType; label: string; labelAr: string }[] = [
  { value: 'none', label: 'No Compensation', labelAr: 'بدون تعويض' },
  { value: 'apology_only', label: 'Apology Only', labelAr: 'اعتذار فقط' },
  { value: 'discount', label: 'Discount', labelAr: 'خصم' },
  { value: 'free_item', label: 'Free Item', labelAr: 'صنف مجاني' },
  { value: 'refund', label: 'Refund', labelAr: 'استرجاع' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
];

const getCompensationColor = (type: CompensationType): string => {
  switch (type) {
    case 'none':
      return 'bg-muted/50 text-muted-foreground border-muted';
    case 'apology_only':
    case 'discount':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'free_item':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'refund':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    default:
      return 'bg-muted/50 text-muted-foreground border-muted';
  }
};

const getCategoryColor = (category: IssueCategory): string => {
  switch (category) {
    case 'delivery':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'product':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'app':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'payment':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'service':
      return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
    default:
      return 'bg-muted/50 text-muted-foreground border-muted';
  }
};

const getCompensationIcon = (type: CompensationType) => {
  switch (type) {
    case 'none':
      return <XCircle className="h-4 w-4" />;
    case 'apology_only':
      return <MessageSquare className="h-4 w-4" />;
    case 'discount':
      return <DollarSign className="h-4 w-4" />;
    case 'free_item':
      return <Gift className="h-4 w-4" />;
    case 'refund':
      return <RefreshCw className="h-4 w-4" />;
    default:
      return <CheckCircle2 className="h-4 w-4" />;
  }
};

export default function CommonIssuesCompensation() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [issues, setIssues] = useState<CommonIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<CommonIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [compensationFilter, setCompensationFilter] = useState<string>('all');
  const [escalationFilter, setEscalationFilter] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<CommonIssue | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<CommonIssue | null>(null);

  const canEdit = profile ? canWrite(profile.role) : false;

  useEffect(() => {
    loadIssues();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [issues, searchQuery, categoryFilter, compensationFilter, escalationFilter]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await getAllCommonIssues();
      setIssues(data);
    } catch (error) {
      console.error('Error loading issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      let filtered = issues;

      if (searchQuery.trim()) {
        const searchResults = await searchCommonIssues(searchQuery);
        filtered = searchResults;
      }

      if (categoryFilter !== 'all') {
        filtered = filtered.filter(issue => issue.issue_category === categoryFilter);
      }

      if (compensationFilter !== 'all') {
        filtered = filtered.filter(issue => issue.compensation_type === compensationFilter);
      }

      if (escalationFilter) {
        filtered = filtered.filter(issue => issue.escalation_required);
      }

      setFilteredIssues(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const handleViewDetails = async (issue: CommonIssue) => {
    try {
      const fullIssue = await getCommonIssueById(issue.id);
      if (fullIssue) {
        setSelectedIssue(fullIssue);
        setDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error loading issue details:', error);
      toast.error('Failed to load issue details');
    }
  };

  const handleEdit = (issue: CommonIssue) => {
    setEditingIssue(issue);
    setFormOpen(true);
  };

  const handleDelete = async (issue: CommonIssue) => {
    if (!confirm(`Are you sure you want to delete "${issue.issue_title_en}"?`)) return;

    try {
      await deleteCommonIssue(issue.id);
      toast.success('Issue deleted successfully');
      loadIssues();
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast.error('Failed to delete issue');
    }
  };

  const handleToggleFeatured = async (issue: CommonIssue) => {
    try {
      await toggleCommonIssueFeatured(issue.id, !issue.is_featured);
      toast.success(issue.is_featured ? 'Removed from featured' : 'Added to featured');
      loadIssues();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update featured status');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setCompensationFilter('all');
    setEscalationFilter(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0f] via-[#2d1319] to-[#1a0a0f] relative overflow-hidden">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="container mx-auto px-4 py-8 xl:py-12 relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('/')} className="hover:text-amber-400 transition-colors">
            Home
          </button>
          <ChevronRight className="h-4 w-4" />
          <button onClick={() => navigate('/knowledge-base')} className="hover:text-amber-400 transition-colors">
            Knowledge Base
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-amber-400">Complaints & Refund</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold mb-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                Complaints & Refund
              </h1>
              <p className="text-xl text-amber-400/80" dir="rtl">
                الشكاوى والاسترجاع
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Standard handling rules, actions, and refund guidelines
              </p>
            </div>
            {canEdit && (
              <Button
                onClick={() => {
                  setEditingIssue(null);
                  setFormOpen(true);
                }}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Issue
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters - Premium Design */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Search with Focus Glow */}
            <div className="xl:col-span-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-amber-400 transition-colors" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="xl:col-span-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 hover:border-amber-400/50 transition-all duration-300">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d1319] border-white/10">
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORY_OPTIONS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compensation Filter */}
            <div className="xl:col-span-3">
              <Select value={compensationFilter} onValueChange={setCompensationFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 hover:border-amber-400/50 transition-all duration-300">
                  <SelectValue placeholder="All Compensation Types" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d1319] border-white/10">
                  <SelectItem value="all">All Compensation Types</SelectItem>
                  {COMPENSATION_OPTIONS.map(comp => (
                    <SelectItem key={comp.value} value={comp.value}>
                      {comp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Escalation Toggle & Reset */}
            <div className="xl:col-span-2 flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Switch
                  checked={escalationFilter}
                  onCheckedChange={setEscalationFilter}
                  id="escalation-filter"
                />
                <Label htmlFor="escalation-filter" className="text-sm cursor-pointer">
                  Escalation Only
                </Label>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={resetFilters}
                title="Reset Filters"
                className="border-white/10 hover:border-amber-400/50 hover:bg-amber-400/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || categoryFilter !== 'all' || compensationFilter !== 'all' || escalationFilter) && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-amber-400/80">
                Showing {filteredIssues.length} of {issues.length} issues
              </p>
            </div>
          )}
        </div>

        {/* Issues Grid - Premium Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
                <div className="h-32 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Filter className="h-12 w-12 mx-auto mb-4 text-amber-400/50" />
            <h3 className="text-xl font-semibold mb-2 text-white">No Issues Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button variant="outline" onClick={resetFilters} className="border-amber-400/50 hover:bg-amber-400/10">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredIssues.map((issue, index) => (
              <div
                key={issue.id}
                className="group relative overflow-hidden cursor-pointer backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/20 hover:border-amber-400/50 animate-fade-in-scale"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleViewDetails(issue)}
              >
                {/* Gradient Glow on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent pointer-events-none" />
                
                {/* Neon Border Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl shadow-[0_0_20px_rgba(251,191,36,0.3)] pointer-events-none" />

                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${getCategoryColor(issue.issue_category)}`}>
                          {CATEGORY_OPTIONS.find(c => c.value === issue.issue_category)?.label}
                        </span>
                        {issue.is_featured && (
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400 animate-pulse" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors duration-300 line-clamp-2 mb-2">
                        {issue.issue_title_en}
                      </h3>
                      <p className="text-sm text-amber-400/70 group-hover:text-amber-400/90 transition-colors" dir="rtl">
                        {issue.issue_title_ar}
                      </p>
                    </div>
                  </div>

                  {/* Issue Code */}
                  <div className="mb-4">
                    <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-xs font-mono font-semibold text-amber-400 border border-amber-400/20">
                      {issue.issue_code}
                    </span>
                  </div>

                  {/* Description Preview with Fade */}
                  {issue.description_en && (
                    <div className="relative mb-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {issue.description_en}
                      </p>
                      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#2d1319]/50 to-transparent pointer-events-none" />
                    </div>
                  )}

                  {/* Compensation Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm ${getCompensationColor(issue.compensation_type)}`}>
                      {getCompensationIcon(issue.compensation_type)}
                      <span className="text-xs font-semibold">
                        {COMPENSATION_OPTIONS.find(c => c.value === issue.compensation_type)?.label}
                      </span>
                    </div>
                  </div>

                  {/* Escalation Warning */}
                  {issue.escalation_required && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4 backdrop-blur-sm">
                      <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
                      <span className="text-xs font-semibold text-red-400">
                        Escalation Required
                      </span>
                    </div>
                  )}

                  {/* View Details Button - Appears on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 mb-4">
                    <Button 
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(issue);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(issue);
                        }}
                        className="hover:bg-white/10 hover:text-amber-400"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFeatured(issue);
                        }}
                        className="hover:bg-white/10 hover:text-amber-400"
                      >
                        {issue.is_featured ? (
                          <>
                            <StarOff className="h-4 w-4 mr-1" />
                            Unfeature
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-1" />
                            Feature
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(issue);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}

                  {/* View Details Indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Sheet */}
      <IssueDetailsSheet
        issue={selectedIssue}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        canEdit={canEdit}
        onEdit={handleEdit}
      />

      {/* Add/Edit Form Dialog */}
      <IssueFormDialog
        issue={editingIssue}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          loadIssues();
          setFormOpen(false);
          setEditingIssue(null);
        }}
      />
    </div>
  );
}

// Premium Issue Details Dialog Component - Centered Modal
function IssueDetailsSheet({
  issue,
  open,
  onOpenChange,
  canEdit,
  onEdit,
}: {
  issue: CommonIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  onEdit: (issue: CommonIssue) => void;
}) {
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    handling: true,
    compensation: true,
  });

  if (!issue) return null;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-[#1a0a0f] via-[#2d1319] to-[#1a0a0f] border-2 border-amber-400/30 shadow-2xl shadow-amber-500/20">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header with Glassmorphism */}
        <div className="relative z-10 px-12 pt-8 pb-6 backdrop-blur-xl bg-gradient-to-r from-[#2d1319]/90 via-[#3d1f29]/90 to-[#2d1319]/90 border-b border-amber-400/30">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
                {issue.issue_title_en}
              </h2>
              <p className="text-3xl text-amber-400/90 font-semibold" dir="rtl">
                {issue.issue_title_ar}
              </p>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  onEdit(issue);
                  onOpenChange(false);
                }}
                className="border-amber-400/50 hover:bg-amber-400/20 hover:text-amber-400 hover:border-amber-400 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {/* Premium Badges */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm text-lg font-mono font-bold text-amber-400 border-2 border-amber-400/40 shadow-lg shadow-amber-500/20">
              {issue.issue_code}
            </span>
            <span className={`px-6 py-3 rounded-xl text-lg font-bold border-2 backdrop-blur-sm shadow-lg ${getCategoryColor(issue.issue_category)}`}>
              {CATEGORY_OPTIONS.find(c => c.value === issue.issue_category)?.label}
            </span>
            <div className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 backdrop-blur-sm shadow-lg ${getCompensationColor(issue.compensation_type)}`}>
              {getCompensationIcon(issue.compensation_type)}
              <span className="text-lg font-bold">
                {COMPENSATION_OPTIONS.find(c => c.value === issue.compensation_type)?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="relative z-10 overflow-y-auto max-h-[calc(95vh-220px)] px-12 py-8 custom-scrollbar">

        <div className="space-y-6">
          {/* Issue Description Section */}
          {issue.description_en && (
            <div className="group backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-amber-400/20 rounded-2xl overflow-hidden transition-all duration-500 hover:border-amber-400/40 hover:shadow-2xl hover:shadow-amber-500/20">
              <button
                onClick={() => toggleSection('description')}
                className="w-full p-6 flex items-center justify-between hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 transition-all duration-300"
              >
                <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-400/30">
                    <Eye className="h-6 w-6 text-amber-400" />
                  </div>
                  Issue Description
                </h3>
                <ChevronRight className={`h-7 w-7 text-amber-400 transition-all duration-500 ${expandedSections.description ? 'rotate-90 scale-110' : ''}`} />
              </button>
              {expandedSections.description && (
                <div className="px-8 pb-8 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-8 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-sm shadow-lg">
                      <p className="text-xl text-white whitespace-pre-wrap leading-relaxed">{issue.description_en}</p>
                    </div>
                    {issue.description_ar && (
                      <div className="p-8 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30 backdrop-blur-sm shadow-lg">
                        <p className="text-xl text-amber-400/90 whitespace-pre-wrap leading-relaxed" dir="rtl">
                          {issue.description_ar}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Standard Handling Section */}
          {issue.standard_action_en && (
            <div className="group backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-green-400/20 rounded-2xl overflow-hidden transition-all duration-500 hover:border-green-400/40 hover:shadow-2xl hover:shadow-green-500/20">
              <button
                onClick={() => toggleSection('handling')}
                className="w-full p-6 flex items-center justify-between hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 transition-all duration-300"
              >
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-green-500/20 border border-green-400/30">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                  Standard Handling
                </h3>
                <ChevronRight className={`h-7 w-7 text-green-400 transition-all duration-500 ${expandedSections.handling ? 'rotate-90 scale-110' : ''}`} />
              </button>
              {expandedSections.handling && (
                <div className="px-8 pb-8 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-8 rounded-xl bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-400/30 backdrop-blur-sm shadow-lg">
                      <div className="text-xl text-white whitespace-pre-wrap leading-relaxed">{issue.standard_action_en}</div>
                    </div>
                    {issue.standard_action_ar && (
                      <div className="p-8 rounded-xl bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-400/30 backdrop-blur-sm shadow-lg">
                        <div className="text-xl text-green-400/90 whitespace-pre-wrap leading-relaxed" dir="rtl">
                          {issue.standard_action_ar}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compensation Rules Section */}
          <div className="group backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-amber-400/20 rounded-2xl overflow-hidden transition-all duration-500 hover:border-amber-400/40 hover:shadow-2xl hover:shadow-amber-500/20">
            <button
              onClick={() => toggleSection('compensation')}
              className="w-full p-6 flex items-center justify-between hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 transition-all duration-300"
            >
              <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-400/30">
                  <DollarSign className="h-6 w-6 text-amber-400" />
                </div>
                Compensation Rules
              </h3>
              <ChevronRight className={`h-7 w-7 text-amber-400 transition-all duration-500 ${expandedSections.compensation ? 'rotate-90 scale-110' : ''}`} />
            </button>
            {expandedSections.compensation && (
              <div className="px-8 pb-8 animate-fade-in">
                <div className={`p-10 rounded-xl border-2 backdrop-blur-sm shadow-lg ${getCompensationColor(issue.compensation_type)}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-white/10">
                      {getCompensationIcon(issue.compensation_type)}
                    </div>
                    <span className="font-bold text-2xl">
                      {COMPENSATION_OPTIONS.find(c => c.value === issue.compensation_type)?.label}
                    </span>
                  </div>
                  {issue.compensation_details_en && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div className="p-6 rounded-xl bg-white/5 border border-white/20">
                        <p className="text-xl whitespace-pre-wrap leading-relaxed">{issue.compensation_details_en}</p>
                      </div>
                      {issue.compensation_details_ar && (
                        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-400/30">
                          <p className="text-xl text-amber-400/90 whitespace-pre-wrap leading-relaxed" dir="rtl">
                            {issue.compensation_details_ar}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {issue.max_compensation_value && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-2 border-amber-400/50 backdrop-blur-sm shadow-xl">
                      <p className="text-xl font-bold text-amber-400 flex items-center gap-3">
                        <DollarSign className="h-7 w-7" />
                        Maximum Compensation: {issue.max_compensation_value} SAR
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Escalation Warning */}
          {issue.escalation_required && (
            <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-400/30 rounded-2xl p-8 shadow-2xl shadow-red-500/20">
              <div className="flex items-start gap-5">
                <div className="p-4 rounded-xl bg-red-500/30 border border-red-400/40">
                  <AlertTriangle className="h-8 w-8 text-red-400 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-red-400 mb-3">Escalation Required</h3>
                  <p className="text-xl text-white/90 mb-4">
                    This issue requires escalation to higher management
                  </p>
                  {issue.escalation_to && (
                    <div className="p-5 rounded-lg bg-red-500/20 border border-red-400/30">
                      <p className="text-lg text-white">
                        <span className="font-bold text-red-400">Escalate to:</span> {issue.escalation_to}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes / Exceptions */}
          {issue.notes_en && (
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-3">
                <MessageSquare className="h-7 w-7" />
                Notes / Exceptions
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xl text-white whitespace-pre-wrap leading-relaxed">{issue.notes_en}</p>
                </div>
                {issue.notes_ar && (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xl text-amber-400/80 whitespace-pre-wrap leading-relaxed" dir="rtl">
                      {issue.notes_ar}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Issue Form Dialog Component
function IssueFormDialog({
  issue,
  open,
  onOpenChange,
  onSuccess,
}: {
  issue: CommonIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<Partial<CommonIssue>>({
    issue_code: '',
    issue_title_en: '',
    issue_title_ar: '',
    issue_category: 'other',
    description_en: '',
    description_ar: '',
    standard_action_en: '',
    standard_action_ar: '',
    compensation_type: 'none',
    compensation_details_en: '',
    compensation_details_ar: '',
    max_compensation_value: null,
    escalation_required: false,
    escalation_to: '',
    notes_en: '',
    notes_ar: '',
    is_active: true,
    is_featured: false,
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (issue) {
      setFormData(issue);
    } else {
      setFormData({
        issue_code: '',
        issue_title_en: '',
        issue_title_ar: '',
        issue_category: 'other',
        description_en: '',
        description_ar: '',
        standard_action_en: '',
        standard_action_ar: '',
        compensation_type: 'none',
        compensation_details_en: '',
        compensation_details_ar: '',
        max_compensation_value: null,
        escalation_required: false,
        escalation_to: '',
        notes_en: '',
        notes_ar: '',
        is_active: true,
        is_featured: false,
        display_order: 0,
      });
    }
  }, [issue, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.issue_code || !formData.issue_title_en || !formData.issue_title_ar) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      if (issue) {
        await updateCommonIssue(issue.id, formData);
        toast.success('Issue updated successfully');
      } else {
        await createCommonIssue(formData);
        toast.success('Issue created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving issue:', error);
      toast.error('Failed to save issue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-[#1a0a0f] via-[#2d1319] to-[#1a0a0f] border-2 border-amber-400/30 shadow-2xl shadow-amber-500/20">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header */}
        <div className="relative z-10 px-10 pt-10 pb-6 backdrop-blur-xl bg-gradient-to-r from-[#2d1319]/90 via-[#3d1f29]/90 to-[#2d1319]/90 border-b border-amber-400/30">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
              {issue ? 'Edit Issue' : 'Add New Issue'}
            </DialogTitle>
            <DialogDescription className="text-lg text-amber-400/80 mt-2">
              {issue ? 'Update the issue details below' : 'Fill in the details to create a new issue'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Form Content */}
        <div className="relative z-10 overflow-y-auto max-h-[calc(90vh-180px)] px-10 py-8 custom-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info Section */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-amber-400/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-400/30">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="issue_code" className="text-white text-base">Issue Code *</Label>
                <Input
                  id="issue_code"
                  value={formData.issue_code}
                  onChange={(e) => setFormData({ ...formData, issue_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., DELAYED_ORDER"
                  className="mt-2 bg-white/5 border-amber-400/30 text-white placeholder:text-white/40 focus:border-amber-400"
                  required
                />
              </div>
              <div>
                <Label htmlFor="issue_category" className="text-white text-base">Category *</Label>
                <Select
                  value={formData.issue_category}
                  onValueChange={(value) => setFormData({ ...formData, issue_category: value as IssueCategory })}
                >
                  <SelectTrigger className="mt-2 bg-white/5 border-amber-400/30 text-white focus:border-amber-400">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Titles Section */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-green-400/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/20 border border-green-400/30">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              Issue Titles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="issue_title_en" className="text-white text-base">Title (English) *</Label>
                <Input
                  id="issue_title_en"
                  value={formData.issue_title_en}
                  onChange={(e) => setFormData({ ...formData, issue_title_en: e.target.value })}
                  className="mt-2 bg-white/5 border-green-400/30 text-white placeholder:text-white/40 focus:border-green-400"
                  required
                />
              </div>
              <div>
                <Label htmlFor="issue_title_ar" className="text-white text-base">Title (Arabic) *</Label>
                <Input
                  id="issue_title_ar"
                  value={formData.issue_title_ar}
                  onChange={(e) => setFormData({ ...formData, issue_title_ar: e.target.value })}
                  dir="rtl"
                  className="mt-2 bg-white/5 border-green-400/30 text-white placeholder:text-white/40 focus:border-green-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Descriptions Section */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-blue-400/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Descriptions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="description_en" className="text-white text-base">Description (English)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en || ''}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={4}
                  className="mt-2 bg-white/5 border-blue-400/30 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="description_ar" className="text-white text-base">Description (Arabic)</Label>
              <Textarea
                id="description_ar"
                value={formData.description_ar || ''}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                dir="rtl"
                rows={4}
                className="mt-2 bg-white/5 border-blue-400/30 text-white placeholder:text-white/40 focus:border-blue-400"
              />
            </div>
          </div>
          </div>

          {/* Standard Actions Section */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-purple-400/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-400/30">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              Standard Handling Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="standard_action_en" className="text-white text-base">Standard Action (English)</Label>
                <Textarea
                  id="standard_action_en"
                  value={formData.standard_action_en || ''}
                  onChange={(e) => setFormData({ ...formData, standard_action_en: e.target.value })}
                  rows={6}
                  placeholder="Step-by-step handling instructions..."
                  className="mt-2 bg-white/5 border-purple-400/30 text-white placeholder:text-white/40 focus:border-purple-400"
                />
              </div>
              <div>
                <Label htmlFor="standard_action_ar" className="text-white text-base">Standard Action (Arabic)</Label>
                <Textarea
                  id="standard_action_ar"
                  value={formData.standard_action_ar || ''}
                  onChange={(e) => setFormData({ ...formData, standard_action_ar: e.target.value })}
                  dir="rtl"
                  rows={6}
                  placeholder="خطوات المعالجة..."
                  className="mt-2 bg-white/5 border-purple-400/30 text-white placeholder:text-white/40 focus:border-purple-400"
                />
              </div>
            </div>
          </div>

          {/* Compensation Section */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-amber-400/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-400/30">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Compensation Rules
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="compensation_type" className="text-white text-base">Compensation Type *</Label>
                  <Select
                    value={formData.compensation_type}
                    onValueChange={(value) => setFormData({ ...formData, compensation_type: value as CompensationType })}
                  >
                    <SelectTrigger className="mt-2 bg-white/5 border-amber-400/30 text-white focus:border-amber-400">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPENSATION_OPTIONS.map(comp => (
                        <SelectItem key={comp.value} value={comp.value}>
                          {comp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="max_compensation_value" className="text-white text-base">Max Compensation Value (SAR)</Label>
                  <Input
                    id="max_compensation_value"
                    type="number"
                    value={formData.max_compensation_value || ''}
                    onChange={(e) => setFormData({ ...formData, max_compensation_value: e.target.value ? Number(e.target.value) : null })}
                    placeholder="e.g., 25"
                    className="mt-2 bg-white/5 border-amber-400/30 text-white placeholder:text-white/40 focus:border-amber-400"
                  />
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="compensation_details_en" className="text-white text-base">Compensation Details (English)</Label>
                <Textarea
                  id="compensation_details_en"
                  value={formData.compensation_details_en || ''}
                  onChange={(e) => setFormData({ ...formData, compensation_details_en: e.target.value })}
                  rows={4}
                  className="mt-2 bg-white/5 border-amber-400/30 text-white placeholder:text-white/40 focus:border-amber-400"
                />
              </div>
              <div>
                <Label htmlFor="compensation_details_ar" className="text-white text-base">Compensation Details (Arabic)</Label>
                <Textarea
                  id="compensation_details_ar"
                  value={formData.compensation_details_ar || ''}
                  onChange={(e) => setFormData({ ...formData, compensation_details_ar: e.target.value })}
                  dir="rtl"
                  rows={4}
                  className="mt-2 bg-white/5 border-amber-400/30 text-white placeholder:text-white/40 focus:border-amber-400"
                />
              </div>
            </div>
          </div>
          </div>

          {/* Escalation Section */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-red-400/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-400/30">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              Escalation Settings
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/30">
                <Switch
                  id="escalation_required"
                  checked={formData.escalation_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, escalation_required: checked })}
                  className="data-[state=checked]:bg-red-500"
                />
                <Label htmlFor="escalation_required" className="cursor-pointer text-white text-base font-semibold">
                  Escalation Required
                </Label>
              </div>
              {formData.escalation_required && (
                <div>
                  <Label htmlFor="escalation_to" className="text-white text-base">Escalate To</Label>
                  <Input
                    id="escalation_to"
                    value={formData.escalation_to || ''}
                    onChange={(e) => setFormData({ ...formData, escalation_to: e.target.value })}
                    placeholder="e.g., Technical Team / Supervisor"
                    className="mt-2 bg-white/5 border-red-400/30 text-white placeholder:text-white/40 focus:border-red-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-cyan-400/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              Notes & Exceptions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="notes_en" className="text-white text-base">Notes / Exceptions (English)</Label>
                <Textarea
                  id="notes_en"
                  value={formData.notes_en || ''}
                  onChange={(e) => setFormData({ ...formData, notes_en: e.target.value })}
                  rows={3}
                  className="mt-2 bg-white/5 border-cyan-400/30 text-white placeholder:text-white/40 focus:border-cyan-400"
                />
              </div>
              <div>
                <Label htmlFor="notes_ar" className="text-white text-base">Notes / Exceptions (Arabic)</Label>
                <Textarea
                  id="notes_ar"
                  value={formData.notes_ar || ''}
                  onChange={(e) => setFormData({ ...formData, notes_ar: e.target.value })}
                  dir="rtl"
                  rows={3}
                  className="mt-2 bg-white/5 border-cyan-400/30 text-white placeholder:text-white/40 focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Display Settings Section */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-indigo-400/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-indigo-400 mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-400/30">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              Display Settings
            </h3>
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-400/30">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  className="data-[state=checked]:bg-indigo-500"
                />
                <Label htmlFor="is_active" className="cursor-pointer text-white text-base font-semibold">
                  Active
                </Label>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-400/30">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  className="data-[state=checked]:bg-amber-500"
                />
                <Label htmlFor="is_featured" className="cursor-pointer text-white text-base font-semibold">
                  Featured (Show on Home Page)
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="display_order" className="text-white text-base font-semibold">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  className="w-24 bg-white/5 border-indigo-400/30 text-white focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="px-8 py-3 text-base border-2 border-white/20 hover:bg-white/10 hover:border-white/40 text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="px-8 py-3 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/30 border-2 border-amber-400/50"
            >
              {saving ? 'Saving...' : issue ? 'Update Issue' : 'Create Issue'}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
