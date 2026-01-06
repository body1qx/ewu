import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Eye, Megaphone, ArrowRight } from 'lucide-react';
import type { Announcement } from '@/types/types';
import { format } from 'date-fns';

interface AnnouncementSliderProps {
  announcements: Announcement[];
}

export default function AnnouncementSlider({ announcements }: AnnouncementSliderProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, announcements.length]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const isNew = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
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

  if (announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  const isUrgent = currentAnnouncement.category === 'urgent';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-3xl font-bold" dir="rtl">آخر الإعلانات 📢</h2>
            <p className="text-muted-foreground" dir="rtl">خلّك على اطلاع بآخر الأخبار (قبل لا يقولون عنك آخر من يدري! 😅)</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate('/announcements')}
          className="group"
          dir="rtl"
        >
          شوف الكل
          <ArrowRight className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform rotate-180" />
        </Button>
      </div>

      {/* Slider */}
      <div className="relative">
        <Card
          className={`
            glassmorphic overflow-hidden cursor-pointer group
            transition-all duration-500 hover:scale-[1.02]
            ${isUrgent ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse-glow' : 'border-accent/20 hover:border-accent hover:shadow-glow'}
          `}
          onClick={() => navigate(`/announcements/${currentAnnouncement.id}`)}
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
            {/* Image Side */}
            {currentAnnouncement.banner_image_url && (
              <div className="relative h-64 xl:h-full overflow-hidden">
                <img
                  src={currentAnnouncement.banner_image_url}
                  alt={currentAnnouncement.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t xl:bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                
                {/* Category Badge */}
                <div className={`absolute top-4 left-4 px-4 py-2 rounded-full bg-gradient-to-r ${getCategoryColor(currentAnnouncement.category)} text-white text-sm font-bold shadow-lg`}>
                  {currentAnnouncement.category.toUpperCase()}
                </div>

                {/* NEW Badge */}
                {isNew(currentAnnouncement.created_at) && (
                  <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-green-500 text-white text-sm font-bold shadow-lg animate-pulse" dir="rtl">
                    جديد! 🆕
                  </div>
                )}
              </div>
            )}

            {/* Content Side */}
            <div className="p-8 xl:p-12 flex flex-col justify-center">
              {!currentAnnouncement.banner_image_url && (
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={`bg-gradient-to-r ${getCategoryColor(currentAnnouncement.category)} text-white`}>
                    {currentAnnouncement.category.toUpperCase()}
                  </Badge>
                  {isNew(currentAnnouncement.created_at) && (
                    <Badge className="bg-green-500 text-white animate-pulse" dir="rtl">جديد! 🆕</Badge>
                  )}
                </div>
              )}

              <h3 className="text-3xl xl:text-4xl font-bold mb-4 line-clamp-2 group-hover:text-accent transition-colors" dir="rtl">
                {currentAnnouncement.title}
              </h3>

              <p className="text-muted-foreground text-lg mb-6 line-clamp-3" dir="rtl">
                {currentAnnouncement.message}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(currentAnnouncement.created_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span dir="rtl">{currentAnnouncement.view_count || 0} مشاهدة</span>
                </div>
                {currentAnnouncement.creator?.full_name && (
                  <div className="flex items-center gap-2">
                    <span dir="rtl">بواسطة {currentAnnouncement.creator.full_name}</span>
                  </div>
                )}
              </div>

              <Button
                className="w-fit bg-gradient-to-r from-accent to-primary-glow hover:opacity-90 text-primary shadow-glow"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/announcements/${currentAnnouncement.id}`);
                }}
                dir="rtl"
              >
                اقرأ المزيد 📖
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Navigation Arrows */}
        {announcements.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {announcements.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsAutoPlaying(false);
                }}
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${index === currentIndex
                    ? 'w-8 bg-accent'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }
                `}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
