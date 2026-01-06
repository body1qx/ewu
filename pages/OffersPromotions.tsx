import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { canWrite } from '@/lib/permissions';
import { 
  getAllPromotions, 
  searchPromotions, 
  filterPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  togglePromotionHighlight,
  duplicatePromotion
} from '@/db/api';
import type { Promotion, PromoType, PromoStatus, PromoChannel, DiscountType } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Plus,
  Filter,
  Tag,
  Percent,
  Wallet,
  Gift,
  Clock,
  MoreVertical,
  Copy,
  Edit,
  Trash2,
  Pause,
  Play,
  Star,
  ChevronRight,
  ChevronDown,
  Calendar,
  MapPin,
  Users,
  FileText,
  Smartphone,
  Globe,
  Phone,
  Store,
  Truck,
  Package,
  Home as HomeIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const OffersPromotions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const canEdit = profile ? canWrite(profile.role) : false;

  useEffect(() => {
    loadPromotions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [promotions, searchQuery, statusFilter, typeFilter, channelFilter]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await getAllPromotions();
      setPromotions(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load promotions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      let filtered = [...promotions];

      if (searchQuery.trim()) {
        const searchResults = await searchPromotions(searchQuery);
        filtered = searchResults;
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === statusFilter);
      }

      if (typeFilter !== 'all') {
        filtered = filtered.filter(p => p.type === typeFilter);
      }

      if (channelFilter !== 'all') {
        filtered = filtered.filter(p => p.channels.includes(channelFilter as PromoChannel));
      }

      setFilteredPromotions(filtered);
    } catch (error: any) {
      console.error('Filter error:', error);
      setFilteredPromotions(promotions);
    }
  };

  const handleViewDetails = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setDetailSheetOpen(true);
  };

  const handleCreateNew = () => {
    setEditingPromotion(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      await deletePromotion(id);
      toast({
        title: 'Success',
        description: 'Promotion deleted successfully',
      });
      loadPromotions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete promotion',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: PromoStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await togglePromotionStatus(id, newStatus);
      toast({
        title: 'Success',
        description: `Promotion ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });
      loadPromotions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleToggleHighlight = async (id: string, currentHighlight: boolean) => {
    try {
      await togglePromotionHighlight(id, !currentHighlight);
      toast({
        title: 'Success',
        description: `Promotion ${!currentHighlight ? 'highlighted' : 'unhighlighted'}`,
      });
      loadPromotions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update highlight',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicatePromotion(id);
      toast({
        title: 'Success',
        description: 'Promotion duplicated successfully',
      });
      loadPromotions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to duplicate promotion',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Promo code copied to clipboard',
    });
  };

  const getStatusBadgeVariant = (status: PromoStatus) => {
    switch (status) {
      case 'active': return 'default';
      case 'scheduled': return 'secondary';
      case 'paused': return 'outline';
      case 'expired': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusColor = (status: PromoStatus) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'scheduled': return 'text-blue-600';
      case 'paused': return 'text-orange-600';
      case 'expired': return 'text-muted-foreground';
      default: return 'text-foreground';
    }
  };

  const getTypeIcon = (type: PromoType) => {
    switch (type) {
      case 'discount': return <Percent className="h-5 w-5" />;
      case 'cashback': return <Wallet className="h-5 w-5" />;
      case 'free_item': return <Gift className="h-5 w-5" />;
      case 'bundle': return <Package className="h-5 w-5" />;
      case 'voucher': return <Tag className="h-5 w-5" />;
      default: return <Tag className="h-5 w-5" />;
    }
  };

  const getChannelIcon = (channel: PromoChannel) => {
    switch (channel) {
      case 'app': return <Smartphone className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      case 'call_center': return <Phone className="h-4 w-4" />;
      case 'dine_in': return <Store className="h-4 w-4" />;
      case 'delivery': return <Truck className="h-4 w-4" />;
      case 'pickup': return <Package className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const formatChannelName = (channel: PromoChannel) => {
    return channel.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 xl:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 animate-fade-in">
          <button onClick={() => navigate('/home')} className="hover:text-foreground transition-colors">
            Home
          </button>
          <ChevronRight className="h-4 w-4" />
          <button onClick={() => navigate('/knowledge-base')} className="hover:text-foreground transition-colors">
            Knowledge Base
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground" dir="rtl">{t('offers.title')}</span>
        </div>

        {/* Header */}
        <div className="mb-8 animate-fade-in-scale">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent" dir="rtl">
                {t('offers.title')}
              </h1>
              <p className="text-xl text-muted-foreground" dir="rtl">
                {t('offers.subtitle')}
              </p>
              <p className="text-sm text-muted-foreground mt-2" dir="rtl">
                {t('knowledgeBase.offersPromotionsDesc')}
              </p>
            </div>
            {canEdit && (
              <Button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Promotion
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6 glass-card border-0 shadow-soft-lg animate-fade-in">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div className="xl:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, title, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="discount">Discount</SelectItem>
                <SelectItem value="cashback">Cashback</SelectItem>
                <SelectItem value="bundle">Bundle</SelectItem>
                <SelectItem value="free_item">Free Item</SelectItem>
                <SelectItem value="voucher">Voucher</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Channel Filter */}
          <div className="mt-4">
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="app">App</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="call_center">Call Center</SelectItem>
                <SelectItem value="talabat">Talabat</SelectItem>
                <SelectItem value="jahez">Jahez</SelectItem>
                <SelectItem value="hungerstation">HungerStation</SelectItem>
                <SelectItem value="dine_in">Dine In</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Promotions Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading promotions...</p>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <Card className="p-12 text-center glass-card border-0 shadow-soft-lg">
            <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No promotions found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || channelFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first promotion to get started'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredPromotions.map((promo, index) => (
              <Card
                key={promo.id}
                className="group relative overflow-hidden cursor-pointer ios-card-hover glass-card shadow-soft-lg rounded-ios-lg border-0 animate-fade-in-scale"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleViewDetails(promo)}
              >
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br from-primary/30 to-orange-500/30" />
                
                <div className="relative p-6">
                  {/* Image */}
                  {promo.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={promo.image_url}
                        alt={promo.title_en}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-orange-500/20">
                        {getTypeIcon(promo.type)}
                      </div>
                      {promo.highlight && (
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(promo.status)} className={getStatusColor(promo.status)}>
                        {promo.status}
                      </Badge>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(promo); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStatus(promo.id, promo.status); }}>
                              {promo.status === 'active' ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleHighlight(promo.id, promo.highlight); }}>
                              <Star className="h-4 w-4 mr-2" />
                              {promo.highlight ? 'Remove Highlight' : 'Highlight'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(promo.id); }}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); handleDelete(promo.id); }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {promo.title_en}
                    </h3>
                    <p className="text-sm text-muted-foreground" dir="rtl">
                      {promo.title_ar}
                    </p>
                  </div>

                  {/* Promo Code */}
                  {promo.promo_code && (
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-sm">
                        {promo.promo_code}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(promo.promo_code!);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {promo.description_en}
                  </p>

                  {/* Discount Info */}
                  {promo.discount_value && (
                    <div className="mb-3 p-2 rounded-lg bg-primary/10">
                      <p className="text-sm font-semibold text-primary">
                        {promo.discount_type === 'percentage' && `${promo.discount_value}% off`}
                        {promo.discount_type === 'fixed_amount' && `${promo.discount_value} SAR off`}
                        {promo.min_order_amount && ` on orders above ${promo.min_order_amount} SAR`}
                        {promo.max_discount_amount && ` (max ${promo.max_discount_amount} SAR)`}
                      </p>
                    </div>
                  )}

                  {/* Validity */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(promo.start_date), 'dd MMM yyyy')} - {format(new Date(promo.end_date), 'dd MMM yyyy')}
                    </span>
                  </div>

                  {/* Channels */}
                  <div className="flex flex-wrap gap-2">
                    {promo.channels.slice(0, 3).map((channel) => (
                      <div
                        key={channel}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs"
                      >
                        {getChannelIcon(channel)}
                        <span>{formatChannelName(channel)}</span>
                      </div>
                    ))}
                    {promo.channels.length > 3 && (
                      <div className="flex items-center px-2 py-1 rounded-md bg-muted text-xs">
                        +{promo.channels.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <PromotionDetailSheet
        promotion={selectedPromotion}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onEdit={canEdit ? handleEdit : undefined}
        copyToClipboard={copyToClipboard}
        getTypeIcon={getTypeIcon}
        getChannelIcon={getChannelIcon}
        formatChannelName={formatChannelName}
        getStatusColor={getStatusColor}
      />

      {/* Form Dialog */}
      <PromotionFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        editingPromotion={editingPromotion}
        onSuccess={loadPromotions}
      />
    </div>
  );
};

// Promotion Detail Sheet Component
interface PromotionDetailSheetProps {
  promotion: Promotion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (promotion: Promotion) => void;
  copyToClipboard: (text: string) => void;
  getTypeIcon: (type: PromoType) => React.ReactElement;
  getChannelIcon: (channel: PromoChannel) => React.ReactElement;
  formatChannelName: (channel: PromoChannel) => string;
  getStatusColor: (status: PromoStatus) => string;
}

const PromotionDetailSheet = ({
  promotion,
  open,
  onOpenChange,
  onEdit,
  copyToClipboard,
  getTypeIcon,
  getChannelIcon,
  formatChannelName,
  getStatusColor,
}: PromotionDetailSheetProps) => {
  const [termsEnOpen, setTermsEnOpen] = useState(false);
  const [termsArOpen, setTermsArOpen] = useState(false);

  if (!promotion) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full xl:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Promotion Details</SheetTitle>
          <SheetDescription>Complete information about this promotion</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Banner Image */}
          {promotion.image_url && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={promotion.image_url}
                alt={promotion.title_en}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getTypeIcon(promotion.type)}
              <Badge className={getStatusColor(promotion.status)}>
                {promotion.status}
              </Badge>
              {promotion.highlight && (
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-1">{promotion.title_en}</h2>
            <p className="text-lg text-muted-foreground" dir="rtl">{promotion.title_ar}</p>
          </div>

          {/* Promo Code */}
          {promotion.promo_code && (
            <div>
              <Label className="text-xs text-muted-foreground">Promo Code</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-mono text-lg px-4 py-2">
                  {promotion.promo_code}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(promotion.promo_code!)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          )}

          {/* Overview */}
          <div>
            <h3 className="font-semibold mb-2">Overview</h3>
            <p className="text-sm text-muted-foreground mb-2">{promotion.description_en}</p>
            <p className="text-sm text-muted-foreground" dir="rtl">{promotion.description_ar}</p>
          </div>

          {/* Discount Details */}
          {promotion.discount_value && (
            <div className="p-4 rounded-lg bg-primary/10">
              <h3 className="font-semibold mb-2">Discount Details</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Value:</span>{' '}
                  {promotion.discount_type === 'percentage' && `${promotion.discount_value}%`}
                  {promotion.discount_type === 'fixed_amount' && `${promotion.discount_value} SAR`}
                </p>
                {promotion.min_order_amount && (
                  <p>
                    <span className="font-medium">Minimum Order:</span> {promotion.min_order_amount} SAR
                  </p>
                )}
                {promotion.max_discount_amount && (
                  <p>
                    <span className="font-medium">Maximum Discount:</span> {promotion.max_discount_amount} SAR
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Where it can be used */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Where it can be used
            </h3>
            <div className="flex flex-wrap gap-2">
              {promotion.channels.map((channel) => (
                <div
                  key={channel}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
                >
                  {getChannelIcon(channel)}
                  <span className="text-sm">{formatChannelName(channel)}</span>
                </div>
              ))}
            </div>
            {promotion.applicable_cities && promotion.applicable_cities.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Cities:</span> {promotion.applicable_cities.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Eligibility & Usage Rules */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Eligibility & Usage Rules
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Target:</span> {promotion.target_segment.replace(/_/g, ' ')}
              </p>
              {promotion.usage_limit_per_customer && (
                <p>
                  <span className="font-medium">Per Customer:</span> {promotion.usage_limit_per_customer} uses
                </p>
              )}
              {promotion.global_usage_limit && (
                <p>
                  <span className="font-medium">Total Limit:</span> {promotion.global_usage_limit} uses
                </p>
              )}
              <p>
                <span className="font-medium">Current Usage:</span> {promotion.current_usage_count} uses
              </p>
            </div>
          </div>

          {/* Status & Timeline */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Status & Timeline
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className={getStatusColor(promotion.status)}>{promotion.status}</span>
              </p>
              <p>
                <span className="font-medium">Start Date:</span>{' '}
                {format(new Date(promotion.start_date), 'dd MMM yyyy, HH:mm')}
              </p>
              <p>
                <span className="font-medium">End Date:</span>{' '}
                {format(new Date(promotion.end_date), 'dd MMM yyyy, HH:mm')}
              </p>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Terms & Conditions
            </h3>
            
            <Collapsible open={termsEnOpen} onOpenChange={setTermsEnOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <span className="font-medium text-sm">Terms (English)</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${termsEnOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{promotion.terms_en}</p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={termsArOpen} onOpenChange={setTermsArOpen} className="mt-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <span className="font-medium text-sm" dir="rtl">الشروط والأحكام (Arabic)</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${termsArOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap" dir="rtl">{promotion.terms_ar}</p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Edit Button */}
          {onEdit && (
            <Button
              onClick={() => {
                onEdit(promotion);
                onOpenChange(false);
              }}
              className="w-full"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Promotion
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Promotion Form Dialog Component
interface PromotionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPromotion: Promotion | null;
  onSuccess: () => void;
}

const PromotionFormDialog = ({
  open,
  onOpenChange,
  editingPromotion,
  onSuccess,
}: PromotionFormDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    promo_code: '',
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    type: 'discount' as PromoType,
    discount_value: '',
    discount_type: 'percentage' as DiscountType,
    min_order_amount: '',
    max_discount_amount: '',
    channels: [] as PromoChannel[],
    applicable_cities: '',
    start_date: '',
    end_date: '',
    status: 'scheduled' as PromoStatus,
    usage_limit_per_customer: '',
    global_usage_limit: '',
    target_segment: 'all_customers',
    terms_en: '',
    terms_ar: '',
    image_url: '',
    highlight: false,
  });

  useEffect(() => {
    if (editingPromotion) {
      setFormData({
        promo_code: editingPromotion.promo_code || '',
        title_en: editingPromotion.title_en,
        title_ar: editingPromotion.title_ar,
        description_en: editingPromotion.description_en,
        description_ar: editingPromotion.description_ar,
        type: editingPromotion.type,
        discount_value: editingPromotion.discount_value?.toString() || '',
        discount_type: editingPromotion.discount_type,
        min_order_amount: editingPromotion.min_order_amount?.toString() || '',
        max_discount_amount: editingPromotion.max_discount_amount?.toString() || '',
        channels: editingPromotion.channels,
        applicable_cities: editingPromotion.applicable_cities?.join(', ') || '',
        start_date: editingPromotion.start_date.split('T')[0],
        end_date: editingPromotion.end_date.split('T')[0],
        status: editingPromotion.status,
        usage_limit_per_customer: editingPromotion.usage_limit_per_customer?.toString() || '',
        global_usage_limit: editingPromotion.global_usage_limit?.toString() || '',
        target_segment: editingPromotion.target_segment,
        terms_en: editingPromotion.terms_en,
        terms_ar: editingPromotion.terms_ar,
        image_url: editingPromotion.image_url || '',
        highlight: editingPromotion.highlight,
      });
    } else {
      // Reset form for new promotion
      setFormData({
        promo_code: '',
        title_en: '',
        title_ar: '',
        description_en: '',
        description_ar: '',
        type: 'discount',
        discount_value: '',
        discount_type: 'percentage',
        min_order_amount: '',
        max_discount_amount: '',
        channels: [],
        applicable_cities: '',
        start_date: '',
        end_date: '',
        status: 'scheduled',
        usage_limit_per_customer: '',
        global_usage_limit: '',
        target_segment: 'all_customers',
        terms_en: '',
        terms_ar: '',
        image_url: '',
        highlight: false,
      });
    }
  }, [editingPromotion, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const promotionData: Partial<Promotion> = {
        promo_code: formData.promo_code || null,
        title_en: formData.title_en,
        title_ar: formData.title_ar,
        description_en: formData.description_en,
        description_ar: formData.description_ar,
        type: formData.type,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        discount_type: formData.discount_type,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        channels: formData.channels,
        applicable_cities: formData.applicable_cities ? formData.applicable_cities.split(',').map(c => c.trim()) : null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        status: formData.status,
        usage_limit_per_customer: formData.usage_limit_per_customer ? parseInt(formData.usage_limit_per_customer) : null,
        global_usage_limit: formData.global_usage_limit ? parseInt(formData.global_usage_limit) : null,
        target_segment: formData.target_segment,
        terms_en: formData.terms_en,
        terms_ar: formData.terms_ar,
        image_url: formData.image_url || null,
        highlight: formData.highlight,
      };

      if (editingPromotion) {
        await updatePromotion(editingPromotion.id, promotionData);
        toast({
          title: 'Success',
          description: 'Promotion updated successfully',
        });
      } else {
        await createPromotion(promotionData);
        toast({
          title: 'Success',
          description: 'Promotion created successfully',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save promotion',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (channel: PromoChannel) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const allChannels: PromoChannel[] = [
    'app',
    'website',
    'call_center',
    'talabat',
    'jahez',
    'hungerstation',
    'dine_in',
    'delivery',
    'pickup',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for the promotion
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title_en">Title (English) *</Label>
                <Input
                  id="title_en"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="title_ar">Title (Arabic) *</Label>
                <Input
                  id="title_ar"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  dir="rtl"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="promo_code">Promo Code (Optional)</Label>
              <Input
                id="promo_code"
                value={formData.promo_code}
                onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                placeholder="e.g., SAVE20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description_en">Description (English) *</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description_ar">Description (Arabic) *</Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  dir="rtl"
                  rows={3}
                  required
                />
              </div>
            </div>
          </div>

          {/* Type & Discount */}
          <div className="space-y-4">
            <h3 className="font-semibold">Discount Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as PromoType })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="cashback">Cashback</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="free_item">Free Item</SelectItem>
                    <SelectItem value="voucher">Voucher</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value as DiscountType })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="discount_value">Discount Value</Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="min_order_amount">Min Order (SAR)</Label>
                <Input
                  id="min_order_amount"
                  type="number"
                  step="0.01"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="max_discount_amount">Max Discount (SAR)</Label>
                <Input
                  id="max_discount_amount"
                  type="number"
                  step="0.01"
                  value={formData.max_discount_amount}
                  onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Channels */}
          <div className="space-y-4">
            <h3 className="font-semibold">Channels *</h3>
            <div className="grid grid-cols-3 gap-3">
              {allChannels.map((channel) => (
                <div key={channel} className="flex items-center space-x-2">
                  <Checkbox
                    id={channel}
                    checked={formData.channels.includes(channel)}
                    onCheckedChange={() => toggleChannel(channel)}
                  />
                  <Label htmlFor={channel} className="cursor-pointer">
                    {channel.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Dates & Status */}
          <div className="space-y-4">
            <h3 className="font-semibold">Schedule & Status</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as PromoStatus })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="space-y-4">
            <h3 className="font-semibold">Usage Limits & Target</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="usage_limit_per_customer">Per Customer</Label>
                <Input
                  id="usage_limit_per_customer"
                  type="number"
                  value={formData.usage_limit_per_customer}
                  onChange={(e) => setFormData({ ...formData, usage_limit_per_customer: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="global_usage_limit">Global Limit</Label>
                <Input
                  id="global_usage_limit"
                  type="number"
                  value={formData.global_usage_limit}
                  onChange={(e) => setFormData({ ...formData, global_usage_limit: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="target_segment">Target Segment *</Label>
                <Input
                  id="target_segment"
                  value={formData.target_segment}
                  onChange={(e) => setFormData({ ...formData, target_segment: e.target.value })}
                  placeholder="e.g., all_customers"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="applicable_cities">Applicable Cities (comma-separated)</Label>
              <Input
                id="applicable_cities"
                value={formData.applicable_cities}
                onChange={(e) => setFormData({ ...formData, applicable_cities: e.target.value })}
                placeholder="e.g., Riyadh, Jeddah, Dammam"
              />
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-4">
            <h3 className="font-semibold">Terms & Conditions</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="terms_en">Terms (English) *</Label>
                <Textarea
                  id="terms_en"
                  value={formData.terms_en}
                  onChange={(e) => setFormData({ ...formData, terms_en: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="terms_ar">Terms (Arabic) *</Label>
                <Textarea
                  id="terms_ar"
                  value={formData.terms_ar}
                  onChange={(e) => setFormData({ ...formData, terms_ar: e.target.value })}
                  dir="rtl"
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Image & Highlight */}
          <div className="space-y-4">
            <h3 className="font-semibold">Media & Visibility</h3>
            
            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="highlight"
                checked={formData.highlight}
                onCheckedChange={(checked) => setFormData({ ...formData, highlight: checked })}
              />
              <Label htmlFor="highlight" className="cursor-pointer">
                Highlight on homepage (Featured)
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingPromotion ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OffersPromotions;
