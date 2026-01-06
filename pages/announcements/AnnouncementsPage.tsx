import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, Plus, Search, Megaphone, Sparkles, Info, AlertTriangle, FileText, Users, TrendingUp, Bookmark, Eye } from 'lucide-react';
import { getAnnouncements } from '@/db/api';
import type { Announcement } from '@/types/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { format } from 'date-fns';
import { useMousePosition } from '@/components/home/MouseTracker';
import { canWrite } from '@/lib/permissions';
import { useTranslation } from 'react-i18next';

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const mousePosition = useMousePosition();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('خطأ في تحميل الإعلانات:', error);
      toast.error('في مشكلة في تحميل الإعلانات! جرّب مرة ثانية 🤔');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'الكل 📢', icon: Megaphone },
    { id: 'urgent', label: 'عاجل ⚠️', icon: AlertTriangle },
    { id: 'update', label: 'تحديثات 🔄', icon: TrendingUp },
    { id: 'policy', label: 'سياسات 📜', icon: FileText },
    { id: 'team', label: 'الفريق 👥', icon: Users },
    { id: 'info', label: 'معلومات ℹ️', icon: Info },
  ];

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : Info;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent':
        return 'from-red-500 to-red-600';
      case 'update':
        return 'from-blue-500 to-blue-600';
      case 'policy':
        return 'from-purple-500 to-purple-600';
      case 'team':
        return 'from-green-500 to-green-600';
      default:
        return 'from-accent to-primary-glow';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || announcement.category === selectedCategory;
    return matchesSearch && matchesCategory && announcement.is_published;
  });

  const isNew = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  const canCreateAnnouncement = profile ? canWrite(profile.role) : false;

  // Parallax effect
  const parallaxX = mousePosition.x * 0.015;
  const parallaxY = mousePosition.y * 0.015;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background with parallax */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-primary via-secondary to-primary animate-gradient-shift opacity-95"
        style={{
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-40 w-80 h-80 bg-primary-glow/10 rounded-full blur-3xl animate-float animation-delay-2000" />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-accent-orange/10 rounded-full blur-3xl animate-float animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 container py-8 xl:py-12">
        {/* Header */}
        <div className="mb-8 xl:mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
              <Megaphone className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-5xl xl:text-6xl font-bold text-white text-center" dir="rtl">
              مركز الإعلانات 📢
            </h1>
            <div className="w-16 h-16 rounded-2xl bg-accent/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
          </div>
          <p className="text-white/90 text-xl xl:text-2xl font-medium text-center" dir="rtl">
            خلّك على اطلاع بآخر الأخبار والتحديثات (قبل لا يقولون عنك آخر من يدري! 😅)
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="mb-8 flex flex-col xl:flex-row gap-4 items-center">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <Input
              type="text"
              placeholder="ابحث عن إعلان... (اكتب اللي تبيه 🔍)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg backdrop-blur-sm"
              dir="rtl"
            />
          </div>

          {/* Create Button */}
          {canCreateAnnouncement && (
            <Button
              onClick={() => navigate('/announcements/create')}
              className="bg-gradient-to-r from-accent to-primary-glow hover:opacity-90 text-primary shadow-glow h-14 px-8 text-lg font-semibold"
              dir="rtl"
            >
              <Plus className="w-5 h-5 ml-2" />
              إنشاء إعلان جديد ➕
            </Button>
          )}
        </div>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-3 justify-center">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-6 py-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 font-medium
                  ${isActive
                    ? 'border-accent bg-accent/20 text-accent shadow-glow scale-105'
                    : 'border-white/20 bg-white/5 text-white/80 hover:border-accent/50 hover:bg-accent/10'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Announcements Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Megaphone className="w-12 h-12 text-white/60" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2" dir="rtl">ما لقينا إعلانات! 🤷</h3>
            <p className="text-white/70 text-lg" dir="rtl">
              {searchQuery ? 'ارجع بدّل كلمة البحث وجرّب مرة ثانية 🔍' : 'ارجع بعدين تلقى جديد 😊'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAnnouncements.map((announcement, index) => {
              const CategoryIcon = getCategoryIcon(announcement.category);
              const isNewAnnouncement = isNew(announcement.created_at);
              
              return (
                <div
                  key={announcement.id}
                  className="animate-fade-in-up group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card
                    onClick={() => navigate(`/announcements/${announcement.id}`)}
                    className="glassmorphic border-white/20 hover:border-accent transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col hover:shadow-glow hover:scale-105"
                  >
                    {/* Banner Image */}
                    {announcement.banner_image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={announcement.banner_image_url}
                          alt={announcement.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
                        {/* Category Badge on Image */}
                        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r ${getCategoryColor(announcement.category)} text-white text-sm font-semibold flex items-center gap-1.5 shadow-lg`}>
                          <CategoryIcon className="w-4 h-4" />
                          {announcement.category.toUpperCase()}
                        </div>

                        {/* NEW Badge */}
                        {isNewAnnouncement && (
                          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-green-500 text-white text-sm font-bold shadow-lg animate-pulse" dir="rtl">
                            جديد! 🆕
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Title */}
                      <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-accent transition-colors" dir="rtl">
                        {announcement.title}
                      </h3>

                      {/* Preview */}
                      <p className="text-white/70 text-sm mb-4 line-clamp-3 flex-1" dir="rtl">
                        {announcement.message}
                      </p>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-white/60 mb-4">
                        <div className="flex items-center gap-2">
                          <span dir="rtl">{announcement.creator?.full_name || 'الأدمن'}</span>
                        </div>
                        <span>{format(new Date(announcement.created_at), 'MMM d, yyyy')}</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-white/60 mb-4">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{announcement.view_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{announcement.is_bookmarked_by?.length || 0}</span>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <Button
                        className="w-full bg-gradient-to-r from-accent/20 to-primary-glow/20 hover:from-accent/30 hover:to-primary-glow/30 text-white border border-accent/30"
                        dir="rtl"
                      >
                        شوف التفاصيل 👀
                      </Button>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
