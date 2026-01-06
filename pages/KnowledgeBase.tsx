import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  UtensilsCrossed,
  Info,
  Smartphone,
  Code2,
  Truck,
  Megaphone,
  MessageSquare,
  ShieldBan,
  FileText,
  Tag,
} from 'lucide-react';
import { getAllCategories, getAllArticles } from '@/db/api';
import type { KnowledgeCategory, KnowledgeArticle } from '@/types/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import CategoryCard from '@/components/knowledge/CategoryCard';
import KnowledgeSearchBar from '@/components/knowledge/KnowledgeSearchBar';
import { canWrite } from '@/lib/permissions';
import { useTranslation } from 'react-i18next';

const PREDEFINED_CATEGORY_STYLES: Record<string, { icon: any; titleAr: string; gradient: string; descriptionAr?: string }> = {
  'Branch Information': {
    icon: Building2,
    titleAr: 'معلومات الفروع',
    gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
  },
  'Menu Information': {
    icon: UtensilsCrossed,
    titleAr: 'معلومات المنيو + البروتين',
    gradient: 'bg-gradient-to-br from-orange-500/20 to-amber-500/20',
  },
  'Menu & Ingredients': {
    icon: UtensilsCrossed,
    titleAr: 'معلومات المنيو + البروتين',
    gradient: 'bg-gradient-to-br from-orange-500/20 to-amber-500/20',
  },
  'General Information': {
    icon: Info,
    titleAr: 'معلومات عامة',
    gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
  },
  'App Information': {
    icon: Smartphone,
    titleAr: 'معلومات التطبيق',
    gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
  },
  'Mobile App Usage': {
    icon: Smartphone,
    titleAr: 'معلومات التطبيق',
    gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
  },
  'Codes & POS Notes': {
    icon: Code2,
    titleAr: 'الأكواد',
    gradient: 'bg-gradient-to-br from-red-500/20 to-rose-500/20',
  },
  'Delivery & Pickup': {
    icon: Truck,
    titleAr: 'التوصيل والاستلام',
    gradient: 'bg-gradient-to-br from-indigo-500/20 to-violet-500/20',
  },
  'Delivery & Pickup Policies': {
    icon: Truck,
    titleAr: 'التوصيل والاستلام',
    gradient: 'bg-gradient-to-br from-indigo-500/20 to-violet-500/20',
  },
  'Staff Announcements': {
    icon: Megaphone,
    titleAr: 'إعلانات',
    gradient: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
  },
  'Customer Service Scripts': {
    icon: MessageSquare,
    titleAr: 'سكريبتات خدمة العملاء',
    gradient: 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20',
  },
  'Refund & Complaints': {
    icon: FileText,
    titleAr: 'شكاوي و تعويضات… يا ليل كل هذي قوانين و تعليمات؟ 😅💸',
    gradient: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20',
    descriptionAr: 'خلنا نحل الموضوع بهدوء ونعطي العميل حقه بدون لخبطة 😌🌯',
  },
};

export default function KnowledgeBase() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canEdit = profile ? canWrite(profile.role) : false;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, articlesData] = await Promise.all([
        getAllCategories(),
        getAllArticles(),
      ]);
      setCategories(categoriesData);
      setArticles(articlesData);
    } catch (error) {
      toast.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    const results = articles
      .filter(
        article =>
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.content?.toLowerCase().includes(query.toLowerCase())
      )
      .map(article => ({
        id: article.id,
        title: article.title,
        category: getCategoryName(article.category_id),
        excerpt: article.content?.substring(0, 150) || '',
      }))
      .slice(0, 5);

    setSearchResults(results);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  };

  const getArticleCount = (categoryId: string) => {
    return articles.filter(a => a.category_id === categoryId).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/10 to-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">{t('knowledgeBase.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background momentum-scroll">
      <div className="container mx-auto px-4 py-8 xl:py-12 max-w-7xl">
        <div className="mb-12 animate-fade-in-scale">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold mb-3 gradient-text-kb">
                {t('knowledgeBase.title')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('knowledgeBase.subtitle')}
              </p>
            </div>
          </div>

          <KnowledgeSearchBar onSearch={handleSearch} results={searchResults} />
        </div>

        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-accent-orange/20">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-2xl xl:text-3xl font-bold">{t('knowledgeBase.browseByCategory')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Special Card for Branch Directory */}
            <Card
              onClick={() => navigate('/branches')}
              className="group relative overflow-hidden cursor-pointer ios-card-hover glass-card shadow-soft-lg rounded-ios-lg border-0 animate-fade-in-scale"
              style={{ animationDelay: '0ms' }}
            >
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br from-indigo-500/30 to-violet-500/30" />
              
              <div className="relative p-6 xl:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="h-8 w-8 text-indigo-600" />
                  </div>
                  
                  <div className="px-3 py-1 rounded-full bg-indigo-500/10 backdrop-blur-sm">
                    <span className="text-xs font-medium text-indigo-600">
                      {t('knowledgeBase.quickAccess')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <h3 className="text-xl xl:text-2xl font-bold text-foreground group-hover:text-indigo-600 transition-colors duration-300">
                    {t('knowledgeBase.branchDirectory')}
                  </h3>
                  <p className="text-lg xl:text-xl font-semibold text-muted-foreground" dir="rtl">
                    دليل الفروع
                  </p>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {t('knowledgeBase.branchDirectoryDesc')}
                </p>

                <div className="mt-6 flex items-center text-indigo-600 group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm font-medium">{t('knowledgeBase.viewBranches')}</span>
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Card>

            {/* Special Card for Blacklist */}
            <Card
              onClick={() => navigate('/blacklist')}
              className="group relative overflow-hidden cursor-pointer ios-card-hover glass-card shadow-soft-lg rounded-ios-lg border-0 animate-fade-in-scale"
              style={{ animationDelay: '100ms' }}
            >
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br from-red-500/30 to-rose-500/30" />
              
              <div className="relative p-6 xl:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 group-hover:scale-110 transition-transform duration-300">
                    <ShieldBan className="h-8 w-8 text-red-600" />
                  </div>
                  
                  <div className="px-3 py-1 rounded-full bg-red-500/10 backdrop-blur-sm">
                    <span className="text-xs font-medium text-red-600">
                      {t('knowledgeBase.quickAccess')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <h3 className="text-xl xl:text-2xl font-bold text-foreground group-hover:text-red-600 transition-colors duration-300">
                    {t('knowledgeBase.blacklistManagement')}
                  </h3>
                  <p className="text-lg xl:text-xl font-semibold text-muted-foreground" dir="rtl">
                    عملاء لهم طبع خاص
                  </p>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {t('knowledgeBase.blacklistDesc')}
                </p>

                <div className="mt-6 flex items-center text-red-600 group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm font-medium">{t('knowledgeBase.manageBlacklist')}</span>
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Card>
            
            {/* Special Card for Social Media Canned Responses */}
            <Card
              onClick={() => navigate('/social-media-responses')}
              className="group relative overflow-hidden cursor-pointer ios-card-hover glass-card shadow-soft-lg rounded-ios-lg border-0 animate-fade-in-scale"
              style={{ animationDelay: '200ms' }}
            >
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br from-emerald-500/30 to-green-500/30" />
              
              <div className="relative p-6 xl:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="h-8 w-8 text-emerald-600" />
                  </div>
                  
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 backdrop-blur-sm">
                    <span className="text-xs font-medium text-emerald-600">
                      {t('knowledgeBase.quickAccess')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <h3 className="text-xl xl:text-2xl font-bold text-foreground group-hover:text-emerald-600 transition-colors duration-300">
                    {t('knowledgeBase.socialMediaResponses')}
                  </h3>
                  <p className="text-lg xl:text-xl font-semibold text-muted-foreground" dir="rtl">
                    ردود وسائل التواصل الاجتماعي
                  </p>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {t('knowledgeBase.socialMediaDesc')}
                </p>

                <div className="mt-6 flex items-center text-emerald-600 group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm font-medium">{t('knowledgeBase.openLibrary')}</span>
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Card>

            {/* Special Card for Customer Case Notes */}
            <Card
              onClick={() => navigate('/case-notes')}
              className="group relative overflow-hidden cursor-pointer ios-card-hover glass-card shadow-soft-lg rounded-ios-lg border-0 animate-fade-in-scale"
              style={{ animationDelay: '300ms' }}
            >
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br from-amber-500/30 to-orange-500/30" />
              
              <div className="relative p-6 xl:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-8 w-8 text-amber-600" />
                  </div>
                  
                  <div className="px-3 py-1 rounded-full bg-amber-500/10 backdrop-blur-sm">
                    <span className="text-xs font-medium text-amber-600">
                      {t('knowledgeBase.quickAccess')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <h3 className="text-xl xl:text-2xl font-bold text-foreground group-hover:text-amber-600 transition-colors duration-300">
                    {t('knowledgeBase.customerCaseNotes')}
                  </h3>
                  <p className="text-lg xl:text-xl font-semibold text-muted-foreground" dir="rtl">
                    ملاحظات حالات العملاء
                  </p>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {t('knowledgeBase.customerCaseDesc')}
                </p>

                <div className="mt-6 flex items-center text-amber-600 group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm font-medium">{t('knowledgeBase.viewCases')}</span>
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Card>

            {/* Special Card for Menu Items & Nutrition */}
            <Card
              onClick={() => navigate('/menu-nutrition')}
              className="group relative overflow-hidden cursor-pointer ios-card-hover glass-card shadow-soft-lg rounded-ios-lg border-0 animate-fade-in-scale"
              style={{ animationDelay: '400ms' }}
            >
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br from-orange-500/30 to-amber-500/30" />
              
              <div className="relative p-6 xl:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                    <UtensilsCrossed className="h-8 w-8 text-orange-600" />
                  </div>
                  
                  <div className="px-3 py-1 rounded-full bg-orange-500/10 backdrop-blur-sm">
                    <span className="text-xs font-medium text-orange-600">
                      {t('knowledgeBase.quickAccess')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <h3 className="text-xl xl:text-2xl font-bold text-foreground group-hover:text-orange-600 transition-colors duration-300">
                    {t('knowledgeBase.menuNutrition')}
                  </h3>
                  <p className="text-lg xl:text-xl font-semibold text-muted-foreground" dir="rtl">
                    المنيو والمعلومات الغذائية
                  </p>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {t('knowledgeBase.menuNutritionDesc')}
                </p>

                <div className="mt-6 flex items-center text-orange-600 group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm font-medium">{t('knowledgeBase.explore')}</span>
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Card>

            {/* Special Card for Offers & Promotions */}
            <Card
              onClick={() => navigate('/offers-promotions')}
              className="group relative overflow-hidden cursor-pointer ios-card-hover glass-card shadow-soft-lg rounded-ios-lg border-0 animate-fade-in-scale"
              style={{ animationDelay: '500ms' }}
            >
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br from-amber-500/30 to-orange-500/30" />
              
              <div className="relative p-6 xl:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Tag className="h-8 w-8 text-amber-600" />
                  </div>
                  
                  <div className="px-3 py-1 rounded-full bg-amber-500/10 backdrop-blur-sm">
                    <span className="text-xs font-medium text-amber-600">
                      {t('knowledgeBase.quickAccess')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <h3 className="text-xl xl:text-2xl font-bold text-foreground group-hover:text-amber-600 transition-colors duration-300">
                    {t('knowledgeBase.offersPromotions')}
                  </h3>
                  <p className="text-lg xl:text-xl font-semibold text-muted-foreground" dir="rtl">
                    العروض والخصومات
                  </p>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {t('knowledgeBase.offersPromotionsDesc')}
                </p>

                <div className="mt-6 flex items-center text-amber-600 group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm font-medium">{t('knowledgeBase.explore')}</span>
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Card>

            {/* Regular Category Cards */}
            {categories
              .filter(category => 
                category.name !== 'Customer Service Scripts' && 
                category.name !== 'Delivery & Pickup' && 
                category.name !== 'Emergency Handling' &&
                category.name !== 'Menu Information' &&
                category.name !== 'Menu & Ingredients' &&
                category.name !== 'Menu & Nutrition' &&
                category.name !== 'Promo Codes' &&
                category.name !== 'App & Technical' &&
                category.name !== 'Payment Methods' &&
                category.name !== 'Policies & Procedures'
              )
              .map((category, index) => {
                const style = PREDEFINED_CATEGORY_STYLES[category.name] || {
                  icon: Info,
                  titleAr: category.name,
                  gradient: 'bg-gradient-to-br from-muted/20 to-muted/40',
                };
                
                return (
                  <CategoryCard
                    key={category.id}
                    id={category.id}
                    icon={style.icon}
                    titleEn={category.name}
                    titleAr={style.titleAr}
                    description={style.descriptionAr || category.description || ''}
                    articleCount={getArticleCount(category.id)}
                    gradient={style.gradient}
                    delay={(index + 3) * 100}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
