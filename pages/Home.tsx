import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPublishedAnnouncements, getProfile } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Announcement } from '@/types/types';
import { BookOpen, Bot, Wrench, FolderOpen, User, MessageSquare, Sparkles, Calendar, ArrowRight, Zap, TrendingUp, FileText, MapPin } from 'lucide-react';
import { useMousePosition } from '@/components/home/MouseTracker';
import { ParticleField } from '@/components/home/ParticleField';
import { InteractiveCard } from '@/components/home/InteractiveCard';
import { GlassmorphicHero } from '@/components/home/GlassmorphicHero';
import ShiftHandoverHub from '@/components/home/ShiftHandoverHub';
import AnnouncementSlider from '@/components/announcements/AnnouncementSlider';
import LatestCaseNotesWidget from '@/components/home/LatestCaseNotesWidget';
import HotIssues from '@/components/home/HotIssues';
import FeaturedOffers from '@/components/home/FeaturedOffers';
import DashboardViewer from '@/components/dashboard/DashboardViewer';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth/AuthProvider';
import { getRotatingWelcomeMessage } from '@/data/welcomeMessages';
import { AttendanceWidget } from '@/components/home/AttendanceWidget';
import WarningsWidget from '@/components/home/WarningsWidget';

export default function Home() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const navigate = useNavigate();
  const mousePosition = useMousePosition();

  useEffect(() => {
    loadData();
    
    // Load initial welcome message
    setWelcomeMessage(getRotatingWelcomeMessage());
    
    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Check for welcome message rotation every minute
    const welcomeTimer = setInterval(() => {
      setWelcomeMessage(getRotatingWelcomeMessage());
    }, 60 * 1000); // Check every minute
    
    return () => {
      clearInterval(timer);
      clearInterval(welcomeTimer);
    };
  }, []);

  const loadData = async () => {
    try {
      const [announcementsData, { data: { user } }] = await Promise.all([
        getPublishedAnnouncements(),
        supabase.auth.getUser(),
      ]);
      
      setAnnouncements(announcementsData.slice(0, 5));
      
      if (user) {
        const profile = await getProfile(user.id);
        setUserName(profile?.full_name || profile?.email?.split('@')[0] || 'User');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const quickAccessModules = [
    {
      title: t('home.modules.knowledge_base.title'),
      description: t('home.modules.knowledge_base.description'),
      icon: BookOpen,
      path: '/knowledge-base',
      gradient: 'from-primary via-primary-glow to-secondary',
      stats: t('home.modules.knowledge_base.stats'),
    },
    {
      title: t('home.modules.ai_assistant.title'),
      description: t('home.modules.ai_assistant.description'),
      icon: Bot,
      path: '/ai-assistant',
      gradient: 'from-accent-orange via-accent to-primary',
      stats: t('home.modules.ai_assistant.stats'),
    },
    {
      title: t('home.modules.schedule.title'),
      description: t('home.modules.schedule.description'),
      icon: Calendar,
      path: '/schedules',
      gradient: 'from-accent via-accent-orange to-secondary',
      stats: t('home.modules.schedule.stats'),
    },
    {
      title: t('home.modules.food_poisoning.title'),
      description: t('home.modules.food_poisoning.description'),
      icon: FileText,
      path: '/food-poisoning-cases',
      gradient: 'from-primary via-accent-orange to-accent',
      stats: t('home.modules.food_poisoning.stats'),
    },
    {
      title: t('home.modules.tools.title'),
      description: t('home.modules.tools.description'),
      icon: Wrench,
      path: '/tools',
      gradient: 'from-secondary via-primary to-accent',
      stats: t('home.modules.tools.stats'),
    },
    {
      title: t('home.modules.branch_directory.title'),
      description: t('home.modules.branch_directory.description'),
      icon: MapPin,
      path: '/branches',
      gradient: 'from-purple-600 via-purple-500 to-purple-400',
      stats: t('home.modules.branch_directory.stats'),
    },
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleField mouseX={mousePosition.x} mouseY={mousePosition.y} />

      <GlassmorphicHero
        mouseX={mousePosition.x}
        mouseY={mousePosition.y}
        className="relative z-10 py-24 xl:py-32"
      >
        <div className="container">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glassmorphic animate-fade-in">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-primary-foreground">
                {format(currentTime, 'EEEE, MMMM d, yyyy • HH:mm:ss')}
              </span>
            </div>

            <div className="space-y-4 animate-fade-in animation-delay-200">
              <h1 className="text-5xl xl:text-6xl font-bold text-primary-foreground tracking-tight" dir="rtl">
                {welcomeMessage 
                  ? `${welcomeMessage} يا ${userName || 'بطل'}` 
                  : `${getGreeting()}، ${userName || t('home.welcome')}`}
              </h1>
              <p className="text-lg xl:text-xl text-primary-foreground/80 max-w-3xl mx-auto" dir="rtl">
                {t('home.tagline')}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center animate-fade-in animation-delay-400">
              <Button
                size="lg"
                onClick={() => navigate('/knowledge-base')}
                className="shadow-glow group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t('home.modules.knowledge_base.title')}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 shimmer" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/ai-assistant')}
                className="glassmorphic border-accent/30 hover:border-accent group"
              >
                <Sparkles className="mr-2 h-5 w-5 text-accent" />
                {t('home.modules.ai_assistant.title')}
                <TrendingUp className="ml-2 h-4 w-4 group-hover:translate-y-[-2px] transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </GlassmorphicHero>

      {/* Shift Handover Hub - First block below hero */}
      <div className="container relative z-10 pt-12 xl:pt-16 pb-8 xl:pb-12">
        <ShiftHandoverHub />
      </div>

      <div className="container relative z-10 py-12 xl:py-16 space-y-16">
        {/* Attendance Widget - For all users */}
        {profile && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <AttendanceWidget />
            <WarningsWidget />
          </section>
        )}

        {/* Dashboard Viewer - Show assigned dashboards */}
        {profile && (
          <section className="space-y-8">
            <DashboardViewer userId={profile.id} />
          </section>
        )}

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold mb-2">{t('home.command_center')}</h2>
              <p className="text-muted-foreground">{t('home.command_center_subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {quickAccessModules.map((module, index) => {
              const Icon = module.icon;
              return (
                <InteractiveCard
                  key={module.path}
                  onClick={() => navigate(module.path)}
                  className={`animate-fade-in-up cursor-pointer`}
                  style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-glow group-hover:scale-110 transition-smooth`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {module.stats}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <CardTitle className="text-2xl">{module.title}</CardTitle>
                    <CardDescription className="text-base">{module.description}</CardDescription>
                    <div className="pt-2 flex items-center text-accent font-medium group-hover:gap-2 transition-all">
                      <span>{t('home.access_now')}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </InteractiveCard>
              );
            })}
          </div>
        </section>

        {announcements.length > 0 && (
          <section>
            <AnnouncementSlider announcements={announcements} />
          </section>
        )}

        <section>
          <LatestCaseNotesWidget />
        </section>

        <section>
          <HotIssues />
        </section>

        <section>
          <FeaturedOffers />
        </section>

        <section className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <InteractiveCard className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Sparkles className="h-6 w-6 text-accent" />
                  {t('home.knowledge_tools')}
                </CardTitle>
                <CardDescription>{t('home.knowledge_tools_subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2 hover:border-accent transition-smooth"
                    onClick={() => navigate('/files')}
                  >
                    <FolderOpen className="h-5 w-5 text-accent" />
                    <div className="text-left">
                      <div className="font-semibold">{t('home.modules.file_hub.title')}</div>
                      <div className="text-xs text-muted-foreground">{t('home.modules.file_hub.description')}</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2 hover:border-accent transition-smooth"
                    onClick={() => navigate('/profile')}
                  >
                    <User className="h-5 w-5 text-accent" />
                    <div className="text-left">
                      <div className="font-semibold">{t('home.modules.my_profile.title')}</div>
                      <div className="text-xs text-muted-foreground">{t('home.modules.my_profile.description')}</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </InteractiveCard>

            <InteractiveCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  {t('home.quick_tip')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {t('home.quick_tip_content')}
                </p>
              </CardContent>
            </InteractiveCard>
          </div>
        </section>
      </div>
    </div>
  );
}
