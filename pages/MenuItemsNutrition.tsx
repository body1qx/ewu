import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, X, Upload, Play, AlertCircle, Flame, Beef, Wheat, Droplet, ChevronRight, Link as LinkIcon, Video as VideoIcon, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import Video from '@/components/ui/video';
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuItemImage,
  uploadMenuItemVideo,
} from '@/db/api';
import type { MenuItem } from '@/types/types';
import { canWrite } from '@/lib/permissions';

const CATEGORIES = [
  'Sandwich',
  'Meal',
  'Side',
  'Dessert',
  'Drink',
  'Appetizer',
  'Combo',
];

const ALLERGENS = [
  'Gluten',
  'Dairy',
  'Nuts',
  'Eggs',
  'Soy',
  'Sesame',
  'Fish',
  'Shellfish',
];

const BREAD_TYPES = [
  'tortilla',
  'Lebanon bread',
  'garsan bread',
];

const SANDWICH_SIZES = [
  'Regular',
  'Large',
  'Extra Large',
];

const SANDWICH_TOPPINGS = [
  'Lettuce',
  'Tomato',
  'Onion',
  'Pickles',
  'Cheese',
  'Jalapeños',
  'Olives',
  'Cucumber',
];

const SANDWICH_SAUCES = [
  'tahini',
  'toumkazbr',
  'muthawm',
  'abokhalta',
  'modkhan',
  'debsi',
  'jalapeno',
  'pickles',
  'crunch',
  'toumnar',
];

const MEAL_SIZES = [
  'Regular',
  'Large',
  'Family',
];

const MEAL_SIDES = [
  'French Fries',
  'Coleslaw',
  'Hummus',
  'Pickles',
  'Garlic Sauce',
  'Salad',
  'Rice',
  'raj raj',
  'chicken bites',
  'sabbosa',
  'حلاو بقر',
  'gum',
  'basbousa',
];

// Helper function to check if URL is a YouTube link
const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Helper function to get YouTube embed URL
const getYouTubeEmbedUrl = (url: string): string => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

// Helper function to check if URL is a Vimeo link
const isVimeoUrl = (url: string): boolean => {
  return url.includes('vimeo.com');
};

// Helper function to get Vimeo embed URL
const getVimeoEmbedUrl = (url: string): string => {
  const regExp = /vimeo.com\/(\d+)/;
  const match = url.match(regExp);
  const videoId = match ? match[1] : null;
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
};

// Helper function to check if URL is a direct video file
const isDirectVideoUrl = (url: string): boolean => {
  return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
};

export default function MenuItemsNutrition() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const canEdit = profile ? canWrite(profile.role) : false;

  useEffect(() => {
    loadMenuItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [menuItems, searchQuery, selectedCategory]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await getAllMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast.error('في مشكلة في تحميل قائمة الأكل! جرّب مرة ثانية 😬🍽️');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...menuItems];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name_en?.toLowerCase().includes(query) ||
          item.name_ar?.toLowerCase().includes(query) ||
          item.tagline_en?.toLowerCase().includes(query) ||
          item.tagline_ar?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  };

  const handleViewDetails = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
    setIsDetailOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('متأكد تبي تحذف هذا الصنف؟ (ما فيه رجعة! 🗑️😅)')) return;

    try {
      await deleteMenuItem(id);
      toast.success('تم حذف الصنف بنجاح! (راح وما رجع! 👋✨)');
      loadMenuItems();
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('في مشكلة في الحذف! جرّب مرة ثانية 😬');
    }
  };

  const handleDuplicate = async (item: MenuItem) => {
    try {
      const duplicatedItem: Partial<MenuItem> = {
        name_en: `${item.name_en} (Copy)`,
        name_ar: item.name_ar ? `${item.name_ar} (نسخة)` : null,
        tagline_en: item.tagline_en,
        tagline_ar: item.tagline_ar,
        description_en: item.description_en,
        description_ar: item.description_ar,
        category: item.category,
        image_url: item.image_url,
        serving_size: item.serving_size,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        sugar: item.sugar,
        sodium: item.sodium,
        allergens: item.allergens,
        preparation_notes: item.preparation_notes,
        agent_notes: item.agent_notes,
        video_url: item.video_url,
        is_featured: false,
        display_order: 0,
        sandwich_bread_type: item.sandwich_bread_type,
        sandwich_size: item.sandwich_size,
        sandwich_toppings: item.sandwich_toppings,
        sandwich_sauces: item.sandwich_sauces,
        meal_main_item: item.meal_main_item,
        meal_sides: item.meal_sides,
        meal_drink_included: item.meal_drink_included,
        meal_size: item.meal_size,
        meal_components: item.meal_components,
      };

      await createMenuItem(duplicatedItem);
      toast.success('تم نسخ الصنف بنجاح! (نسخة طبق الأصل! 📋✨)');
      loadMenuItems();
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Error duplicating menu item:', error);
      toast.error('في مشكلة في النسخ! جرّب مرة ثانية 😬');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#200711] via-[#4B1E27] to-[#12030A] p-4 md:p-8">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header - العنوان الرئيسي 🍽️ */}
        <div className="mb-8">
          {/* Breadcrumb - مسار التنقل */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
            <button onClick={() => navigate('/')} className="hover:text-[#FFB300] transition-colors">
              الرئيسية
            </button>
            <ChevronRight className="h-4 w-4" />
            <button onClick={() => navigate('/knowledge-base')} className="hover:text-[#FFB300] transition-colors">
              قاعدة المعرفة
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#FFB300] font-bold">قائمة الأكل والقيم الغذائية</span>
          </nav>

          <div className="mt-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="text-center xl:text-right">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" dir="rtl">
                قائمة الأكل والقيم الغذائية 🍽️
              </h1>
              <p className="text-white/70 text-lg" dir="rtl">
                دليل شامل لمنتجات شاورمر مع المكونات والسعرات! (كل شي واضح! 📊✨)
              </p>
            </div>
            {canEdit && (
              <Button
                onClick={handleAddNew}
                className="bg-gradient-to-r from-[#FFB300] to-[#FF7A00] text-[#4B1E27] hover:scale-105 hover:shadow-[0_0_25px_rgba(255,179,0,0.5)] transition-all font-bold"
                dir="rtl"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة صنف جديد ➕
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters - البحث والفلاتر 🔍 */}
        <div className="mb-8 flex flex-col xl:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="ابحث عن صنف... (اكتب اسم الأكل! 🔍)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              dir="rtl"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white" dir="rtl">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">كل الفئات 🍴</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'Sandwich' && '🥙 ساندويتش'}
                    {cat === 'Meal' && '🍽️ وجبة'}
                    {cat === 'Side' && '🍟 إضافات'}
                    {cat === 'Dessert' && '🍰 حلويات'}
                    {cat === 'Drink' && '🥤 مشروبات'}
                    {cat === 'Appetizer' && '🥗 مقبلات'}
                    {cat === 'Combo' && '🎁 كومبو'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Menu Items Grid - شبكة الأصناف 🎯 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-white/5 backdrop-blur-sm rounded-2xl animate-pulse border border-white/10"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-white/70 text-xl" dir="rtl">ما فيه أصناف! (جرّب تبحث بطريقة ثانية! 🔍)</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <MenuItemCard
                key={item.id}
                item={item}
                index={index}
                onClick={() => handleViewDetails(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <MenuItemDetailModal
          item={selectedItem}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onEdit={canEdit ? () => handleEdit(selectedItem) : undefined}
          onDelete={canEdit ? () => handleDelete(selectedItem.id) : undefined}
          onDuplicate={canEdit ? () => handleDuplicate(selectedItem) : undefined}
        />
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <MenuItemFormModal
          item={editingItem}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={() => {
            loadMenuItems();
            setIsFormOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface MenuItemCardProps {
  item: MenuItem;
  index: number;
  onClick: () => void;
}

function MenuItemCard({ item, index, onClick }: MenuItemCardProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <div
      onClick={onClick}
      className="group relative bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-[#FFB300]/60 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_15px_40px_rgba(255,179,0,0.3)] cursor-pointer"
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Image - الصورة 📸 */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#FFB300]/20 to-[#FF7A00]/20">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={isArabic ? item.name_ar || item.name_en : item.name_en}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Beef className="h-16 w-16 text-white/20" />
          </div>
        )}
        {/* Overlay on hover - طبقة عند التمرير */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#4B1E27]/95 via-[#4B1E27]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
          <span className="text-[#FFB300] font-bold text-lg" dir="rtl">
            اضغط للتفاصيل! 👆✨
          </span>
        </div>
      </div>

      {/* Content - المحتوى */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-xl text-white group-hover:text-[#FFB300] transition-colors" dir="rtl">
            {isArabic ? item.name_ar || item.name_en : item.name_en}
          </h3>
          <Badge variant="secondary" className="mr-2 shrink-0 bg-[#FFB300]/20 text-[#FFB300] border-[#FFB300]/30">
            {item.category === 'Sandwich' && '🥙'}
            {item.category === 'Meal' && '🍽️'}
            {item.category === 'Side' && '🍟'}
            {item.category === 'Dessert' && '🍰'}
            {item.category === 'Drink' && '🥤'}
            {item.category === 'Appetizer' && '🥗'}
            {item.category === 'Combo' && '🎁'}
          </Badge>
        </div>
        <p className="text-sm text-white/60 line-clamp-2 mb-4" dir="rtl">
          {isArabic ? item.tagline_ar || item.tagline_en : item.tagline_en}
        </p>

        {/* Nutrition Highlights - القيم الغذائية 📊 */}
        <div className="flex flex-wrap gap-2">
          {item.calories && (
            <Badge variant="outline" className="text-xs bg-white/5 border-white/20 text-white/80">
              <Flame className="h-3 w-3 ml-1 text-[#FF7A00]" />
              {item.calories} سعرة
            </Badge>
          )}
          {item.protein && (
            <Badge variant="outline" className="text-xs bg-white/5 border-white/20 text-white/80">
              <Beef className="h-3 w-3 ml-1 text-[#FFB300]" />
              {item.protein}g بروتين
            </Badge>
          )}
          {item.carbs && (
            <Badge variant="outline" className="text-xs bg-white/5 border-white/20 text-white/80">
              <Wheat className="h-3 w-3 ml-1 text-[#FFB300]" />
              {item.carbs}g كارب
            </Badge>
          )}
          {item.fat && (
            <Badge variant="outline" className="text-xs bg-white/5 border-white/20 text-white/80">
              <Droplet className="h-3 w-3 ml-1 text-[#FF7A00]" />
              {item.fat}g دهون
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

interface MenuItemDetailModalProps {
  item: MenuItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

function MenuItemDetailModal({
  item,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onDuplicate,
}: MenuItemDetailModalProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#4B1E27] border-[#FFB300]/30" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-3xl text-white font-bold">
            {isArabic ? item.name_ar || item.name_en : item.name_en} 🍽️
          </DialogTitle>
          {(item.name_ar && !isArabic) || (item.name_en && isArabic) ? (
            <DialogDescription className="text-white/60 text-lg">
              {isArabic ? item.name_en : item.name_ar}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-6">
          {/* الصورة - Image */}
          {item.image_url && (
            <div className="relative h-64 rounded-xl overflow-hidden bg-gradient-to-br from-[#FFB300]/20 to-[#FF7A00]/20">
              <img
                src={item.image_url}
                alt={isArabic ? item.name_ar || item.name_en : item.name_en}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* المعلومات الأساسية - Basic Info */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="font-bold text-white text-xl mb-4">المعلومات الأساسية 📋</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/60 text-sm">الفئة</Label>
                <p className="font-semibold text-white text-lg">
                  {item.category === 'Sandwich' && '🥙 ساندويتش'}
                  {item.category === 'Meal' && '🍽️ وجبة'}
                  {item.category === 'Side' && '🍟 إضافات'}
                  {item.category === 'Dessert' && '🍰 حلويات'}
                  {item.category === 'Drink' && '🥤 مشروبات'}
                  {item.category === 'Appetizer' && '🥗 مقبلات'}
                  {item.category === 'Combo' && '🎁 كومبو'}
                </p>
              </div>
              {item.serving_size && (
                <div>
                  <Label className="text-white/60 text-sm">حجم الحصة</Label>
                  <p className="font-semibold text-white text-lg">{item.serving_size}</p>
                </div>
              )}
            </div>
            {item.allergens && item.allergens.length > 0 && (
              <div className="mt-4">
                <Label className="text-white/60 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#FF7A00]" />
                  تحذير: مواد مسببة للحساسية! ⚠️
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.allergens.map((allergen) => (
                    <Badge key={allergen} className="bg-[#FF7A00]/20 text-[#FF7A00] border-[#FF7A00]/30">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* القيم الغذائية - Nutrition */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="font-bold text-white text-xl mb-4">القيم الغذائية 📊</h3>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {item.calories && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                  <Flame className="h-6 w-6 text-[#FF7A00] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{item.calories}</p>
                  <p className="text-xs text-white/60">سعرة حرارية 🔥</p>
                </div>
              )}
              {item.protein && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                  <Beef className="h-6 w-6 text-[#FFB300] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{item.protein}g</p>
                  <p className="text-xs text-white/60">بروتين 💪</p>
                </div>
              )}
              {item.carbs && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                  <Wheat className="h-6 w-6 text-[#FFB300] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{item.carbs}g</p>
                  <p className="text-xs text-white/60">كربوهيدرات 🌾</p>
                </div>
              )}
              {item.fat && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-center">
                  <Droplet className="h-6 w-6 text-[#FF7A00] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{item.fat}g</p>
                  <p className="text-xs text-white/60">دهون 💧</p>
                </div>
              )}
            </div>
          </div>

          {/* تفاصيل الساندويتش - Sandwich Details */}
          {item.category === 'Sandwich' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-bold text-white text-xl mb-4">تفاصيل الساندويتش 🥙</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {item.sandwich_bread_type && (
                    <div>
                      <Label className="text-white/60 text-sm">نوع الخبز</Label>
                      <p className="font-semibold text-white">{item.sandwich_bread_type}</p>
                    </div>
                  )}
                  {item.sandwich_size && (
                    <div>
                      <Label className="text-white/60 text-sm">الحجم</Label>
                      <p className="font-semibold text-white">{item.sandwich_size}</p>
                    </div>
                  )}
                </div>
                {item.sandwich_toppings && item.sandwich_toppings.length > 0 && (
                  <div>
                    <Label className="text-white/60 text-sm">الإضافات المتاحة 🥬</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.sandwich_toppings.map((topping) => (
                        <Badge key={topping} className="bg-white/10 text-white border-white/20">
                          {topping}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {item.sandwich_sauces && item.sandwich_sauces.length > 0 && (
                  <div>
                    <Label className="text-white/60 text-sm">الصوصات المتاحة 🥫</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.sandwich_sauces.map((sauce) => (
                        <Badge key={sauce} className="bg-[#FFB300]/20 text-[#FFB300] border-[#FFB300]/30">
                          {sauce}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* تفاصيل الوجبة - Meal Details */}
          {item.category === 'Meal' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-bold text-white text-xl mb-4">تفاصيل الوجبة 🍽️</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {item.meal_main_item && (
                    <div>
                      <Label className="text-white/60 text-sm">الصنف الرئيسي</Label>
                      <p className="font-semibold text-white">{item.meal_main_item}</p>
                    </div>
                  )}
                  {item.meal_size && (
                    <div>
                      <Label className="text-white/60 text-sm">حجم الوجبة</Label>
                      <p className="font-semibold text-white">{item.meal_size}</p>
                    </div>
                  )}
                </div>
                {item.meal_drink_included !== null && (
                  <div>
                    <Label className="text-white/60 text-sm">يشمل مشروب؟</Label>
                    <p className="font-semibold text-white">
                      {item.meal_drink_included ? 'نعم ✅ (معاها مشروب!)' : 'لا ❌ (بدون مشروب)'}
                    </p>
                  </div>
                )}
                {item.meal_sides && item.meal_sides.length > 0 && (
                  <div>
                    <Label className="text-white/60 text-sm">الإضافات المشمولة 🍟</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.meal_sides.map((side) => (
                        <Badge key={side} className="bg-white/10 text-white border-white/20">
                          {side}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {item.sandwich_sauces && item.sandwich_sauces.length > 0 && (
                  <div>
                    <Label className="text-white/60 text-sm">الصوصات المشمولة 🥫</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.sandwich_sauces.map((sauce) => (
                        <Badge key={sauce} className="bg-[#FFB300]/20 text-[#FFB300] border-[#FFB300]/30">
                          {sauce}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {item.meal_components && Object.keys(item.meal_components).length > 0 && (
                  <div>
                    <Label className="text-white/60 text-sm">مكونات الوجبة 📦</Label>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-2">
                      <pre className="text-sm text-white/80 whitespace-pre-wrap">
                        {JSON.stringify(item.meal_components, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* الوصف - Description */}
          {(item.description_en || item.description_ar) && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-bold text-white text-xl mb-3">الوصف 📝</h3>
              <p className="text-white/70 whitespace-pre-wrap">
                {isArabic
                  ? item.description_ar || item.description_en
                  : item.description_en || item.description_ar}
              </p>
            </div>
          )}

          {/* ملاحظات التحضير - Preparation Notes */}
          {item.preparation_notes && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-bold text-white text-xl mb-3">
                ملاحظات التحضير والتقديم 👨‍🍳
              </h3>
              <p className="text-white/70 whitespace-pre-wrap">
                {item.preparation_notes}
              </p>
            </div>
          )}

          {/* فيديو تدريبي - Training Video */}
          {item.video_url && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-bold text-white text-xl mb-3">فيديو تدريبي 🎥</h3>
              {isYouTubeUrl(item.video_url) ? (
                <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={getYouTubeEmbedUrl(item.video_url)}
                    title="فيديو تدريبي"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : isVimeoUrl(item.video_url) ? (
                <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={getVimeoEmbedUrl(item.video_url)}
                    title="فيديو تدريبي"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : isDirectVideoUrl(item.video_url) ? (
                <div className="rounded-lg overflow-hidden">
                  <Video src={item.video_url} controls />
                </div>
              ) : (
                <Button variant="outline" asChild className="border-[#FFB300]/30 text-[#FFB300] hover:bg-[#FFB300]/10">
                  <a href={item.video_url} target="_blank" rel="noopener noreferrer">
                    <Play className="h-4 w-4 ml-2" />
                    شغّل الفيديو 🎬
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* ملاحظات للموظفين - Agent Notes */}
          {item.agent_notes && (
            <div className="bg-[#FFB300]/10 rounded-xl p-4 border border-[#FFB300]/30">
              <h3 className="font-bold text-[#FFB300] text-xl mb-3">ملاحظات مهمة للموظفين! 📌</h3>
              <p className="text-white/80 whitespace-pre-wrap">{item.agent_notes}</p>
            </div>
          )}

          {/* الإجراءات - Actions */}
          {(onEdit || onDelete || onDuplicate) && (
            <div className="flex gap-3 pt-4 border-t border-white/10">
              {onEdit && (
                <Button 
                  onClick={onEdit} 
                  className="flex-1 bg-gradient-to-r from-[#FFB300] to-[#FF7A00] text-[#4B1E27] hover:scale-105 transition-all font-bold"
                >
                  تعديل ✏️
                </Button>
              )}
              {onDuplicate && (
                <Button 
                  onClick={onDuplicate} 
                  variant="outline"
                  className="flex-1 border-[#FFB300]/30 text-[#FFB300] hover:bg-[#FFB300]/10"
                >
                  <Copy className="h-4 w-4 ml-2" />
                  نسخ 📋
                </Button>
              )}
              {onDelete && (
                <Button 
                  onClick={onDelete} 
                  className="flex-1 bg-[#FF7A00]/20 text-[#FF7A00] border-[#FF7A00]/30 hover:bg-[#FF7A00]/30"
                >
                  حذف 🗑️
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MenuItemFormModalProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function MenuItemFormModal({
  item,
  open,
  onOpenChange,
  onSuccess,
}: MenuItemFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    item?.image_url || null
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(
    item?.video_url || null
  );
  const [videoInputType, setVideoInputType] = useState<'url' | 'upload'>('url');
  const [formData, setFormData] = useState({
    name_en: item?.name_en || '',
    name_ar: item?.name_ar || '',
    tagline_en: item?.tagline_en || '',
    tagline_ar: item?.tagline_ar || '',
    description_en: item?.description_en || '',
    description_ar: item?.description_ar || '',
    category: item?.category || 'Sandwich',
    serving_size: item?.serving_size || '',
    calories: item?.calories?.toString() || '',
    protein: item?.protein?.toString() || '',
    carbs: item?.carbs?.toString() || '',
    fat: item?.fat?.toString() || '',
    sugar: item?.sugar?.toString() || '',
    sodium: item?.sodium?.toString() || '',
    allergens: item?.allergens || [],
    preparation_notes: item?.preparation_notes || '',
    agent_notes: item?.agent_notes || '',
    video_url: item?.video_url || '',
    is_featured: item?.is_featured || false,
    display_order: item?.display_order?.toString() || '0',
    sandwich_bread_type: item?.sandwich_bread_type || '',
    sandwich_size: item?.sandwich_size || '',
    sandwich_toppings: item?.sandwich_toppings || [],
    sandwich_sauces: item?.sandwich_sauces || [],
    meal_main_item: item?.meal_main_item || '',
    meal_sides: item?.meal_sides || [],
    meal_drink_included: item?.meal_drink_included || false,
    meal_size: item?.meal_size || '',
    meal_components: item?.meal_components || {},
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('الصورة كبيرة! لازم تكون أصغر من 1 ميجا 📸😅');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('الفيديو كبير! لازم يكون أصغر من 50 ميجا 🎥😅');
        return;
      }
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUrlChange = (url: string) => {
    setFormData({ ...formData, video_url: url });
    setVideoPreview(url);
    setVideoFile(null);
  };

  const handleAllergenToggle = (allergen: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  const handleSandwichToppingToggle = (topping: string) => {
    setFormData((prev) => ({
      ...prev,
      sandwich_toppings: prev.sandwich_toppings.includes(topping)
        ? prev.sandwich_toppings.filter((t) => t !== topping)
        : [...prev.sandwich_toppings, topping],
    }));
  };

  const handleSandwichSauceToggle = (sauce: string) => {
    setFormData((prev) => ({
      ...prev,
      sandwich_sauces: prev.sandwich_sauces.includes(sauce)
        ? prev.sandwich_sauces.filter((s) => s !== sauce)
        : [...prev.sandwich_sauces, sauce],
    }));
  };

  const handleMealSideToggle = (side: string) => {
    setFormData((prev) => ({
      ...prev,
      meal_sides: prev.meal_sides.includes(side)
        ? prev.meal_sides.filter((s) => s !== side)
        : [...prev.meal_sides, side],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = item?.image_url || '';
      let videoUrl = item?.video_url || '';

      if (imageFile) {
        imageUrl = await uploadMenuItemImage(imageFile);
      }

      if (videoFile) {
        videoUrl = await uploadMenuItemVideo(videoFile);
      } else if (formData.video_url) {
        videoUrl = formData.video_url;
      }

      const menuItemData: Partial<MenuItem> = {
        name_en: formData.name_en,
        name_ar: formData.name_ar || null,
        tagline_en: formData.tagline_en || null,
        tagline_ar: formData.tagline_ar || null,
        description_en: formData.description_en || null,
        description_ar: formData.description_ar || null,
        category: formData.category,
        image_url: imageUrl || null,
        serving_size: formData.serving_size || null,
        calories: formData.calories ? parseInt(formData.calories) : null,
        protein: formData.protein ? parseFloat(formData.protein) : null,
        carbs: formData.carbs ? parseFloat(formData.carbs) : null,
        fat: formData.fat ? parseFloat(formData.fat) : null,
        sugar: formData.sugar ? parseFloat(formData.sugar) : null,
        sodium: formData.sodium ? parseFloat(formData.sodium) : null,
        allergens: formData.allergens.length > 0 ? formData.allergens : null,
        preparation_notes: formData.preparation_notes || null,
        agent_notes: formData.agent_notes || null,
        video_url: videoUrl || null,
        is_featured: formData.is_featured,
        display_order: parseInt(formData.display_order) || 0,
        sandwich_bread_type: formData.category === 'Sandwich' ? (formData.sandwich_bread_type || null) : null,
        sandwich_size: formData.category === 'Sandwich' ? (formData.sandwich_size || null) : null,
        sandwich_toppings: formData.category === 'Sandwich' && formData.sandwich_toppings.length > 0 ? formData.sandwich_toppings : null,
        sandwich_sauces: (formData.category === 'Sandwich' || formData.category === 'Meal') && formData.sandwich_sauces.length > 0 ? formData.sandwich_sauces : null,
        meal_main_item: formData.category === 'Meal' ? (formData.meal_main_item || null) : null,
        meal_sides: formData.category === 'Meal' && formData.meal_sides.length > 0 ? formData.meal_sides : null,
        meal_drink_included: formData.category === 'Meal' ? formData.meal_drink_included : null,
        meal_size: formData.category === 'Meal' ? (formData.meal_size || null) : null,
        meal_components: formData.category === 'Meal' && Object.keys(formData.meal_components).length > 0 ? formData.meal_components : null,
      };

      if (item) {
        await updateMenuItem(item.id, menuItemData);
        toast.success('تم تحديث الصنف بنجاح! (تمام التمام! ✅✨)');
      } else {
        await createMenuItem(menuItemData);
        toast.success('تم إضافة الصنف بنجاح! (صنف جديد في القائمة! 🎉🍽️)');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('في مشكلة في الحفظ! جرّب مرة ثانية 😬');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#4B1E27] border-[#FFB300]/30" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            {item ? 'تعديل صنف من القائمة ✏️' : 'إضافة صنف جديد ➕'}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {item ? 'عدّل المعلومات اللي تبيها (خلّها حلوة! 😄)' : 'عبّي كل التفاصيل عن الصنف الجديد (لا تنسى شي! 📝✨)'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* رفع الصورة - Image Upload */}
          <div>
            <Label className="text-white">صورة المنتج 📸</Label>
            <div className="mt-2">
              {imagePreview && (
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-[#FFB300]/20 to-[#FF7A00]/20">
                  <img
                    src={imagePreview}
                    alt="معاينة"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-white/60 mt-1">
                الحد الأقصى: 1 ميجابايت (لا تكبّر الصورة! 😅)
              </p>
            </div>
          </div>

          {/* الأسماء - Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">الاسم (بالإنجليزي) *</Label>
              <Input
                value={formData.name_en}
                onChange={(e) =>
                  setFormData({ ...formData, name_en: e.target.value })
                }
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">الاسم (بالعربي)</Label>
              <Input
                value={formData.name_ar}
                onChange={(e) =>
                  setFormData({ ...formData, name_ar: e.target.value })
                }
                dir="rtl"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* الشعارات - Taglines */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">الشعار (بالإنجليزي)</Label>
              <Input
                value={formData.tagline_en}
                onChange={(e) =>
                  setFormData({ ...formData, tagline_en: e.target.value })
                }
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white">الشعار (بالعربي)</Label>
              <Input
                value={formData.tagline_ar}
                onChange={(e) =>
                  setFormData({ ...formData, tagline_ar: e.target.value })
                }
                dir="rtl"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* الفئة وحجم الحصة - Category and Serving Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">الفئة *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'Sandwich' && '🥙 ساندويتش'}
                      {cat === 'Meal' && '🍽️ وجبة'}
                      {cat === 'Side' && '🍟 إضافات'}
                      {cat === 'Dessert' && '🍰 حلويات'}
                      {cat === 'Drink' && '🥤 مشروبات'}
                      {cat === 'Appetizer' && '🥗 مقبلات'}
                      {cat === 'Combo' && '🎁 كومبو'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Serving Size</Label>
              <Input
                value={formData.serving_size}
                onChange={(e) =>
                  setFormData({ ...formData, serving_size: e.target.value })
                }
                placeholder="e.g., 1 sandwich, 250g"
              />
            </div>
          </div>

          {/* Nutrition */}
          <div>
            <Label className="text-lg font-semibold">Nutrition Information</Label>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-2">
              <div>
                <Label>Calories</Label>
                <Input
                  type="number"
                  value={formData.calories}
                  onChange={(e) =>
                    setFormData({ ...formData, calories: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.protein}
                  onChange={(e) =>
                    setFormData({ ...formData, protein: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.carbs}
                  onChange={(e) =>
                    setFormData({ ...formData, carbs: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Fat (g)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.fat}
                  onChange={(e) =>
                    setFormData({ ...formData, fat: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Allergens */}
          <div>
            <Label>Allergens</Label>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-2">
              {ALLERGENS.map((allergen) => (
                <div key={allergen} className="flex items-center space-x-2">
                  <Checkbox
                    id={allergen}
                    checked={formData.allergens.includes(allergen)}
                    onCheckedChange={() => handleAllergenToggle(allergen)}
                  />
                  <label
                    htmlFor={allergen}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {allergen}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sandwich-Specific Fields */}
          {formData.category === 'Sandwich' && (
            <div className="space-y-6 p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
              <h3 className="text-lg font-semibold text-primary">Sandwich Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bread Type</Label>
                  <Select
                    value={formData.sandwich_bread_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sandwich_bread_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bread type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BREAD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Size</Label>
                  <Select
                    value={formData.sandwich_size}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sandwich_size: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {SANDWICH_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Available Toppings</Label>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-2">
                  {SANDWICH_TOPPINGS.map((topping) => (
                    <div key={topping} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topping-${topping}`}
                        checked={formData.sandwich_toppings.includes(topping)}
                        onCheckedChange={() => handleSandwichToppingToggle(topping)}
                      />
                      <label
                        htmlFor={`topping-${topping}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {topping}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Available Sauces</Label>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-2">
                  {SANDWICH_SAUCES.map((sauce) => (
                    <div key={sauce} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sauce-${sauce}`}
                        checked={formData.sandwich_sauces.includes(sauce)}
                        onCheckedChange={() => handleSandwichSauceToggle(sauce)}
                      />
                      <label
                        htmlFor={`sauce-${sauce}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {sauce}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Meal-Specific Fields */}
          {formData.category === 'Meal' && (
            <div className="space-y-6 p-6 bg-accent/5 rounded-lg border-2 border-accent/20">
              <h3 className="text-lg font-semibold text-accent">Meal Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Main Item</Label>
                  <Input
                    value={formData.meal_main_item}
                    onChange={(e) =>
                      setFormData({ ...formData, meal_main_item: e.target.value })
                    }
                    placeholder="e.g., Grilled Chicken, Beef Shawarma"
                  />
                </div>
                <div>
                  <Label>Meal Size</Label>
                  <Select
                    value={formData.meal_size}
                    onValueChange={(value) =>
                      setFormData({ ...formData, meal_size: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal size" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="meal_drink_included"
                  checked={formData.meal_drink_included}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, meal_drink_included: checked as boolean })
                  }
                />
                <label
                  htmlFor="meal_drink_included"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Drink Included
                </label>
              </div>

              <div>
                <Label>Included Sides</Label>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-2">
                  {MEAL_SIDES.map((side) => (
                    <div key={side} className="flex items-center space-x-2">
                      <Checkbox
                        id={`side-${side}`}
                        checked={formData.meal_sides.includes(side)}
                        onCheckedChange={() => handleMealSideToggle(side)}
                      />
                      <label
                        htmlFor={`side-${side}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {side}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Included Sauces</Label>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-2">
                  {SANDWICH_SAUCES.map((sauce) => (
                    <div key={sauce} className="flex items-center space-x-2">
                      <Checkbox
                        id={`meal-sauce-${sauce}`}
                        checked={formData.sandwich_sauces.includes(sauce)}
                        onCheckedChange={() => handleSandwichSauceToggle(sauce)}
                      />
                      <label
                        htmlFor={`meal-sauce-${sauce}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {sauce}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Meal Components (JSON)</Label>
                <Textarea
                  value={JSON.stringify(formData.meal_components, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, meal_components: parsed });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={6}
                  placeholder='{"protein_options": ["Chicken", "Beef"], "customizations": ["Extra Sauce", "No Onions"]}'
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter valid JSON for flexible meal component structure
                </p>
              </div>
            </div>
          )}

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Description (English)</Label>
              <Textarea
                value={formData.description_en}
                onChange={(e) =>
                  setFormData({ ...formData, description_en: e.target.value })
                }
                rows={4}
              />
            </div>
            <div>
              <Label>Description (Arabic)</Label>
              <Textarea
                value={formData.description_ar}
                onChange={(e) =>
                  setFormData({ ...formData, description_ar: e.target.value })
                }
                rows={4}
                dir="rtl"
              />
            </div>
          </div>

          {/* Preparation Notes */}
          <div>
            <Label>Preparation & Presentation Notes</Label>
            <Textarea
              value={formData.preparation_notes}
              onChange={(e) =>
                setFormData({ ...formData, preparation_notes: e.target.value })
              }
              rows={4}
            />
          </div>

          {/* Agent Notes */}
          <div>
            <Label>Notes for Call Center Agents</Label>
            <Textarea
              value={formData.agent_notes}
              onChange={(e) =>
                setFormData({ ...formData, agent_notes: e.target.value })
              }
              rows={4}
            />
          </div>

          {/* Video URL */}
          <div>
            <Label>Training Video</Label>
            <Tabs value={videoInputType} onValueChange={(v) => setVideoInputType(v as 'url' | 'upload')} className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Video URL
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <VideoIcon className="h-4 w-4 mr-2" />
                  Upload Video
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4">
                <Input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="https://youtube.com/... or https://vimeo.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Supports YouTube, Vimeo, or direct video file URLs
                </p>
                {videoPreview && !videoFile && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    {isYouTubeUrl(videoPreview) ? (
                      <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={getYouTubeEmbedUrl(videoPreview)}
                          title="Video Preview"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : isVimeoUrl(videoPreview) ? (
                      <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={getVimeoEmbedUrl(videoPreview)}
                          title="Video Preview"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : isDirectVideoUrl(videoPreview) ? (
                      <div className="rounded-lg overflow-hidden">
                        <Video src={videoPreview} controls />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Enter a valid video URL to see preview</p>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                {videoPreview && videoFile && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <div className="rounded-lg overflow-hidden">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full rounded-lg"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/mov"
                  onChange={handleVideoChange}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 50MB. Supported formats: MP4, WebM, OGG, MOV
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Featured and Display Order */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_featured: checked as boolean })
                }
              />
              <label
                htmlFor="is_featured"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Featured on home page
              </label>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: e.target.value })
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : item ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
