import { useState, useEffect } from 'react';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { BranchCard } from '@/components/branches/BranchCard';
import { BranchDetailModal } from '@/components/branches/BranchDetailModal';
import { BranchForm } from '@/components/branches/BranchForm';
import { SearchAndFilters } from '@/components/branches/SearchAndFilters';
import {
  getBranches,
  getBranchCities,
  createBranch,
  updateBranch,
  deleteBranch,
  canManageBranches,
  addBranchImages,
  deleteBranchImagesByUrls,
} from '@/db/api';
import type { Branch, BranchStatus } from '@/types/types';
import { cn } from '@/lib/utils';

export default function BranchDirectory() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<BranchStatus | 'all'>('all');
  const [driveThruFilter, setDriveThruFilter] = useState<boolean | 'all'>('all');
  const [franchiseFilter, setFranchiseFilter] = useState<boolean | 'all'>('all');
  const [hours24Filter, setHours24Filter] = useState<boolean | 'all'>('all');
  
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [search, cityFilter, statusFilter, driveThruFilter, franchiseFilter, hours24Filter]);

  useEffect(() => {
    if (profile) {
      checkPermissions();
    }
  }, [profile]);

  const checkPermissions = async () => {
    if (!profile) return;
    try {
      const hasPermission = await canManageBranches(profile.id);
      setCanManage(hasPermission);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [branchesData, citiesData] = await Promise.all([
        getBranches({
          search: search || undefined,
          city: cityFilter !== 'all' ? cityFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          hasDriveThru: driveThruFilter !== 'all' ? driveThruFilter : undefined,
          isFranchise: franchiseFilter !== 'all' ? franchiseFilter : undefined,
          is24Hours: hours24Filter !== 'all' ? hours24Filter : undefined,
        }),
        getBranchCities(),
      ]);
      
      setBranches(branchesData);
      setCities(citiesData);
    } catch (error) {
      console.error('Error loading branches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load branches. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBranchClick = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedBranch(null);
  };

  const handleAddNew = () => {
    setEditingBranch(null);
    setShowForm(true);
  };

  const handleEdit = () => {
    if (selectedBranch) {
      setEditingBranch(selectedBranch);
      setShowDetailModal(false);
      setShowForm(true);
    }
  };

  const handleDelete = async () => {
    if (!selectedBranch) return;
    
    try {
      await deleteBranch(selectedBranch.id);
      toast({
        title: 'Success',
        description: 'Branch deleted successfully',
      });
      setShowDetailModal(false);
      setSelectedBranch(null);
      loadData();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete branch. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setFormLoading(true);
      
      // Extract image data
      const allImages = data.allImages || []; // For new branches
      const newImages = data.newImages || []; // For editing: new images to add
      const keepImages = data.keepImages || []; // For editing: existing images to keep
      const deletedImages = data.deletedImages || []; // For editing: images to delete
      
      console.log('📸 حفظ الفرع مع الصور:', {
        isEditing: !!editingBranch,
        allImages: allImages.length,
        newImages: newImages.length,
        keepImages: keepImages.length,
        deletedImages: deletedImages.length,
        mainImage: data.image_url
      });
      
      // Clean up data object
      delete data.allImages;
      delete data.newImages;
      delete data.keepImages;
      delete data.deletedImages;
      delete data.additionalImages;
      
      if (editingBranch) {
        // Update the branch
        await updateBranch(editingBranch.id, data);
        
        // Delete removed images from branch_images table
        if (deletedImages.length > 0) {
          console.log('🗑️ حذف', deletedImages.length, 'صور من جدول branch_images');
          await deleteBranchImagesByUrls(editingBranch.id, deletedImages);
        }
        
        // Add only NEW images to branch_images table
        if (newImages.length > 0) {
          console.log('➕ إضافة', newImages.length, 'صور جديدة إلى جدول branch_images');
          await addBranchImages(editingBranch.id, newImages);
        }
        
        toast({
          title: 'تم التحديث',
          description: `تم تحديث الفرع بنجاح${newImages.length > 0 ? ` مع إضافة ${newImages.length} صورة جديدة` : ''}${deletedImages.length > 0 ? ` وحذف ${deletedImages.length} صورة` : ''}`,
        });
      } else {
        // Create new branch
        const newBranch = await createBranch(data);
        console.log('✅ تم إنشاء الفرع:', newBranch.id);
        
        // Add all images to branch_images table
        if (allImages.length > 0 && newBranch?.id) {
          console.log('✅ إضافة', allImages.length, 'صور إلى جدول branch_images');
          await addBranchImages(newBranch.id, allImages);
        }
        
        toast({
          title: 'تم الإنشاء',
          description: `تم إنشاء الفرع بنجاح${allImages.length > 0 ? ` مع ${allImages.length} صورة` : ''}`,
        });
      }
      
      setShowForm(false);
      setEditingBranch(null);
      loadData();
    } catch (error: any) {
      console.error('❌ خطأ في حفظ الفرع:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل حفظ الفرع. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCityFilter('all');
    setStatusFilter('all');
    setDriveThruFilter('all');
    setFranchiseFilter('all');
    setHours24Filter('all');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(var(--accent-rgb),0.1),transparent_50%)]" />
        
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 backdrop-blur-sm mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent" dir="rtl">
                {t('branches.title')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto" dir="rtl">
                {t('branches.subtitle')}
              </p>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              <SearchAndFilters
                search={search}
                onSearchChange={setSearch}
                city={cityFilter}
                onCityChange={setCityFilter}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                hasDriveThru={driveThruFilter}
                onDriveThruChange={setDriveThruFilter}
                isFranchise={franchiseFilter}
                onFranchiseChange={setFranchiseFilter}
                is24Hours={hours24Filter}
                on24HoursChange={setHours24Filter}
                cities={cities}
                onReset={handleResetFilters}
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : branches.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-muted-foreground" dir="rtl">{t('branches.noBranches')}</h3>
                <p className="text-muted-foreground" dir="rtl">
                  {search || cityFilter !== 'all' || statusFilter !== 'all' || driveThruFilter !== 'all' || franchiseFilter !== 'all'
                    ? t('branches.tryAdjustFilters', 'جرب تغير الفلتر')
                    : t('branches.noBranchesYet', 'ما فيه فروع للحين')}
                </p>
              </div>
            ) : (
              <div 
                className={cn(
                  "grid gap-6",
                  "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
                  "animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
                )}
              >
                {branches.map((branch, index) => (
                  <div
                    key={branch.id}
                    className="animate-in fade-in slide-in-from-bottom-4"
                    style={{
                      animationDelay: `${300 + index * 50}ms`,
                      animationFillMode: 'backwards',
                    }}
                  >
                    <BranchCard
                      branch={branch}
                      onClick={() => handleBranchClick(branch)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {canManage && (
        <Button
          onClick={handleAddNew}
          size="lg"
          className={cn(
            "fixed bottom-8 right-8 z-40",
            "h-14 w-14 rounded-full shadow-2xl",
            "bg-primary hover:bg-primary/90",
            "transition-all duration-300",
            "hover:scale-110 hover:shadow-primary/50",
            "animate-in zoom-in duration-500 delay-500"
          )}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {selectedBranch && (
        <BranchDetailModal
          branch={selectedBranch}
          isOpen={showDetailModal}
          onClose={handleCloseDetail}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canManage={canManage}
        />
      )}

      <BranchForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingBranch(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingBranch || undefined}
        isLoading={formLoading}
      />
    </div>
  );
}
