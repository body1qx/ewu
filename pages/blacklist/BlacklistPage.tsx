import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Eye,
  Filter,
  ChevronRight
} from 'lucide-react';
import { 
  getAllBlacklistCustomers, 
  getBlacklistStats, 
  canManageBlacklist 
} from '@/db/api';
import { BlacklistCustomerWithCreator } from '@/types/types';
import BlacklistEntryCard from './components/BlacklistEntryCard';
import BlacklistDetailModal from './components/BlacklistDetailModal';
import BlacklistEntryForm from './components/BlacklistEntryForm';
import { useTranslation } from 'react-i18next';

export default function BlacklistPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<BlacklistCustomerWithCreator[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<BlacklistCustomerWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, highRisk: 0, recentlyAdded: 0 });
  const [canManage, setCanManage] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [fraudTypeFilter, setFraudTypeFilter] = useState('all');
  
  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<BlacklistCustomerWithCreator | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<BlacklistCustomerWithCreator | null>(null);

  useEffect(() => {
    loadData();
    checkPermissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, searchQuery, riskFilter, statusFilter, fraudTypeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersData, statsData] = await Promise.all([
        getAllBlacklistCustomers(),
        getBlacklistStats()
      ]);
      setCustomers(customersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading blacklist data:', error);
      toast.error('في مشكلة في تحميل القائمة! جرّب مرة ثانية 😬');
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    const hasPermission = await canManageBlacklist();
    setCanManage(hasPermission);
  };

  const applyFilters = () => {
    let filtered = [...customers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.customer_name?.toLowerCase().includes(query) ||
        c.phone_number?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
      );
    }

    // Risk level filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(c => c.risk_level === riskFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Fraud type filter
    if (fraudTypeFilter !== 'all') {
      filtered = filtered.filter(c => c.fraud_types.includes(fraudTypeFilter as any));
    }

    setFilteredCustomers(filtered);
  };

  const handleViewDetails = (customer: BlacklistCustomerWithCreator) => {
    setSelectedCustomer(customer);
    setDetailModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormModalOpen(true);
  };

  const handleEdit = (customer: BlacklistCustomerWithCreator) => {
    setEditingCustomer(customer);
    setFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    setFormModalOpen(false);
    setEditingCustomer(null);
    loadData();
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'low': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'under_review': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'cleared': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2" dir="rtl">
              <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors">
                الرئيسية
              </button>
              <ChevronRight className="h-4 w-4" />
              <button onClick={() => navigate('/knowledge-base')} className="hover:text-foreground transition-colors">
                قاعدة المعرفة
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('blacklist.title')}</span>
            </nav>
            <h1 className="text-3xl font-bold" dir="rtl">{t('blacklist.title')}</h1>
            <p className="text-muted-foreground mt-1" dir="rtl">
              {t('blacklist.subtitle')}
            </p>
          </div>
          {canManage && (
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              <span dir="rtl">{t('blacklist.addEntry')}</span>
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" dir="rtl">{t('blacklist.stats.totalTitle')}</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1" dir="rtl">{t('blacklist.stats.totalDesc')}</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 hover:border-red-500/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" dir="rtl">{t('blacklist.stats.highRiskTitle')}</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.highRisk}</div>
              <p className="text-xs text-muted-foreground mt-1" dir="rtl">{t('blacklist.stats.highRiskDesc')}</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:border-accent/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium" dir="rtl">{t('blacklist.stats.recentTitle')}</CardTitle>
              <TrendingUp className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentlyAdded}</div>
              <p className="text-xs text-muted-foreground mt-1" dir="rtl">{t('blacklist.stats.recentDesc')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" dir="rtl">
              <Filter className="w-5 h-5" />
              الفلاتر والبحث 🔍
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث بالاسم، الجوال، الإيميل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  dir="rtl"
                />
              </div>

              {/* Risk Level Filter */}
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="مستوى الأهمية" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل المستويات</SelectItem>
                  <SelectItem value="high">🔔 مهم جداً (انتبه!)</SelectItem>
                  <SelectItem value="medium">⚠️ مهم</SelectItem>
                  <SelectItem value="low">💡 عادي</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="active">🔴 نشط (تابعه!)</SelectItem>
                  <SelectItem value="under_review">🔵 تحت المراجعة</SelectItem>
                  <SelectItem value="cleared">✅ تم الحل (كويس!)</SelectItem>
                </SelectContent>
              </Select>

              {/* Fraud Type Filter */}
              <Select value={fraudTypeFilter} onValueChange={setFraudTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع المشكلة" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  <SelectItem value="fake_complaint">😤 شكوى مبالغ فيها</SelectItem>
                  <SelectItem value="repeated_compensation">💰 طلبات تعويض متكررة</SelectItem>
                  <SelectItem value="abusive_language">🗣️ تعامل غير لائق</SelectItem>
                  <SelectItem value="delivery_fraud">🚗 مشاكل توصيل</SelectItem>
                  <SelectItem value="refund_abuse">💸 طلبات استرجاع كثيرة</SelectItem>
                  <SelectItem value="other">❓ أنواع أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span dir="rtl">عرض {filteredCustomers.length} من {customers.length} عميل</span>
              {(searchQuery || riskFilter !== 'all' || statusFilter !== 'active' || fraudTypeFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setRiskFilter('all');
                    setStatusFilter('active');
                    setFraudTypeFilter('all');
                  }}
                >
                  <span dir="rtl">مسح الفلاتر</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground" dir="rtl">
                جاري تحميل القائمة... 🔄
              </CardContent>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground" dir="rtl">{t('blacklist.noEntries')}</p>
                {canManage && (
                  <Button onClick={handleAddNew} className="mt-4" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    <span dir="rtl">{t('blacklist.addEntry')}</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <BlacklistEntryCard
                  key={customer.id}
                  customer={customer}
                  onViewDetails={handleViewDetails}
                  onEdit={canManage ? handleEdit : undefined}
                  getRiskBadgeColor={getRiskBadgeColor}
                  getStatusBadgeColor={getStatusBadgeColor}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <BlacklistDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        customer={selectedCustomer}
        canManage={canManage}
        onEdit={handleEdit}
        onSuccess={loadData}
        getRiskBadgeColor={getRiskBadgeColor}
        getStatusBadgeColor={getStatusBadgeColor}
      />

      {/* Form Modal */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Blacklist Entry' : 'Add New Blacklist Entry'}
            </DialogTitle>
          </DialogHeader>
          <BlacklistEntryForm
            customer={editingCustomer}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
