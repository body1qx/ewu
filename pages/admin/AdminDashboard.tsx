import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  Calendar,
  CalendarCheck,
  Megaphone,
  BookOpen,
  Sparkles,
  ArrowRight,
  Shield,
  Settings,
  Clock,
  FileText,
  UserPlus,
  ClipboardList,
  Wrench,
  TrendingUp,
  Zap,
  Crown,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllProfiles, getAllLeaveRequests, getSchedulesByWeek } from '@/db/api';
import { format, startOfWeek } from 'date-fns';

interface DashboardStats {
  activeUsers: number;
  pendingApprovals: number;
  todayShifts: number;
  pendingLeave: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState<DashboardStats>({
    activeUsers: 0,
    pendingApprovals: 0,
    todayShifts: 0,
    pendingLeave: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      toast.error('ممنوع الدخول! لازم تكون أدمن 🚫');
      navigate('/');
      return;
    }
    fetchDashboardStats();
  }, [profile, navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [profiles, leaveRequests, schedules] = await Promise.all([
        getAllProfiles(),
        getAllLeaveRequests(),
        getSchedulesByWeek(startOfWeek(new Date())),
      ]);

      const activeCount = profiles.filter(p => p.status === 'active').length;
      const pendingCount = profiles.filter(p => p.status === 'pending').length;
      const pendingLeaveCount = leaveRequests.filter(lr => lr.status === 'pending').length;
      const todaySchedules = schedules.filter(s => 
        format(new Date(s.shift_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      ).length;

      setStats({
        activeUsers: activeCount,
        pendingApprovals: pendingCount,
        todayShifts: todaySchedules,
        pendingLeave: pendingLeaveCount,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('في مشكلة في تحميل الإحصائيات! 😬');
    } finally {
      setLoading(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!headerRef.current) return;
    const rect = headerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMousePosition({ x, y });
  };

  const statCards = [
    {
      title: 'المستخدمين النشطين',
      subtitle: '(اللي شغالين حالياً 💪)',
      value: stats.activeUsers,
      icon: Users,
      color: 'from-[#FFB300] to-[#FF7A00]',
      bgGlow: 'bg-[#FFB300]/10',
      emoji: '👥',
    },
    {
      title: 'طلبات الموافقة',
      subtitle: '(ناس تنتظر! ⏳)',
      value: stats.pendingApprovals,
      icon: UserCheck,
      color: 'from-[#FF7A00] to-[#FFB300]',
      bgGlow: 'bg-[#FF7A00]/10',
      emoji: '✋',
    },
    {
      title: 'شفتات اليوم',
      subtitle: '(اللي مجدولين اليوم 📅)',
      value: stats.todayShifts,
      icon: Calendar,
      color: 'from-[#FFB300] to-[#FF7A00]',
      bgGlow: 'bg-[#FFB300]/10',
      emoji: '📆',
    },
    {
      title: 'طلبات الإجازات',
      subtitle: '(يبون يرتاحون! 😴)',
      value: stats.pendingLeave,
      icon: CalendarCheck,
      color: 'from-[#FF7A00] to-[#FFB300]',
      bgGlow: 'bg-[#FF7A00]/10',
      emoji: '🏖️',
    },
  ];

  const managementTiles = [
    {
      title: 'إدارة المستخدمين والصلاحيات',
      subtitle: 'تحكم في الموظفين (أنت المدير! 👑)',
      icon: Users,
      path: '/admin/users',
      bullets: [
        'وافق على المستخدمين الجدد (خلّهم يدخلون! 🚪)',
        'عطّهم صلاحيات (موظف، مشرف، مدير 🎖️)',
        'علّق الحسابات أو فعّلها (أنت اللي تقرر! ⚡)',
      ],
      emoji: '👥',
    },
    {
      title: 'الجداول والشفتات',
      subtitle: 'نظّم الشفتات (خلّ كل واحد يعرف وقته! ⏰)',
      icon: Calendar,
      path: '/admin/schedules',
      bullets: [
        'سوّي جداول أسبوعية (خطط زين! 📋)',
        'وزّع الشفتات على الموظفين (عدل بينهم! ⚖️)',
        'صفّر الأسابيع الجاية (ابدأ من جديد! 🔄)',
      ],
      emoji: '📅',
    },
    {
      title: 'الإجازات والعطل السنوية',
      subtitle: 'راجع طلبات الإجازات (يستاهلون ولا لا؟ 🤔)',
      icon: CalendarCheck,
      path: '/admin/leave-management',
      bullets: [
        'وافق أو ارفض الإجازات (أنت اللي تحكم! ✅❌)',
        'راقب رصيد الإجازات (سنوية وطارئة 📊)',
        'عالج طلبات الإلغاء (لو بدّلوا رأيهم! 🔄)',
      ],
      emoji: '🏖️',
    },
    {
      title: 'التحذيرات والإنذارات',
      subtitle: 'نظام التحذيرات (لفت نظر وإنذارات! ⚠️)',
      icon: AlertTriangle,
      path: '/admin/warnings',
      bullets: [
        'أرسل تحذيرات للموظفين (لفت نظر أو إنذار! 👀)',
        'راجع سجل التحذيرات (شوف من انحذر! 📋)',
        'تتبع نقاط التحذير (احسب النقاط! 🔢)',
        'إدارة قوالب التحذيرات (جاهزة للاستخدام! 📝)',
      ],
      emoji: '⚠️',
    },
  ];

  const quickShortcuts = [
    { label: 'إدارة المستخدمين', icon: Users, path: '/admin/users', emoji: '👥' },
    { label: 'الجداول', icon: Calendar, path: '/admin/schedules', emoji: '📅' },
    { label: 'الإجازات السنوية', icon: CalendarCheck, path: '/admin/leave-management', emoji: '🏖️' },
    { label: 'مركز التحذيرات', icon: AlertTriangle, path: '/admin/warnings', emoji: '⚠️' },
    { label: 'لوحات المعلومات', icon: TrendingUp, path: '/admin/dashboards', emoji: '📊' },
    { label: 'تقرير الاستراحات', icon: Clock, path: '/admin/break-report', emoji: '☕' },
    { label: 'التقرير الشامل للحضور', icon: Clock, path: '/admin/comprehensive-report', emoji: '📊' },
    { label: 'قاعدة المعرفة', icon: BookOpen, path: '/knowledge-base', emoji: '📚' },
    { label: 'الإعلانات', icon: Megaphone, path: '/admin/announcements', emoji: '📢' },
    { label: 'إعدادات الذكاء الاصطناعي', icon: Sparkles, path: '/admin/ai-settings', emoji: '🤖' },
    { label: 'إعدادات النظام', icon: Settings, path: '/admin/system-settings', emoji: '⚙️' },
    { label: 'الأدوات', icon: Wrench, path: '/tools', emoji: '🛠️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#200711] via-[#4B1E27] to-[#12030A] p-4 md:p-8">
      {/* Interactive Header Section - مع حركات تفاعلية 🎨 */}
      <div
        ref={headerRef}
        onMouseMove={handleMouseMove}
        className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden mb-8"
        style={{ minHeight: '280px' }}
      >
        {/* Animated Background Elements - خلفية متحركة 🌟 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-10 right-20 w-64 h-64 bg-[#FFB300]/20 rounded-full blur-3xl animate-float"
            style={{
              transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
          <div
            className="absolute bottom-10 left-20 w-48 h-48 bg-[#FF7A00]/20 rounded-full blur-3xl animate-float-delayed"
            style={{
              transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-[#6A1B2C]/30 rounded-full blur-2xl animate-pulse" />
        </div>

        {/* Header Content - المحتوى الرئيسي 👑 */}
        <div className="relative z-10 h-full flex flex-col md:flex-row items-center justify-between p-6 md:p-8">
          {/* Left Side - الجانب الأيسر */}
          <div className="flex-1 text-center md:text-right w-full">
            <div className="flex items-center justify-center md:justify-end gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FFB300] to-[#FF7A00] shadow-lg">
                <Crown className="h-7 w-7 text-[#4B1E27]" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white" dir="rtl">
                مركز التحكم الإداري 👑
              </h1>
            </div>
            <p className="text-white/80 text-base md:text-lg mb-4 max-w-2xl mx-auto md:mx-0" dir="rtl">
              تحكم في كل شي من مكان واحد! (أنت المدير وأنت اللي تقرر! 💪✨)
            </p>
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 text-sm" dir="rtl">
              مسجل دخول: {profile?.full_name || 'الأدمن'} – صاحب النظام 🎖️
            </Badge>

            {/* Quick Action Buttons - أزرار سريعة ⚡ */}
            <div className="flex flex-wrap justify-center md:justify-end gap-3 mt-6">
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#FFB300] to-[#FF7A00] text-[#4B1E27] hover:scale-105 hover:shadow-[0_0_25px_rgba(255,179,0,0.5)] transition-all font-bold"
                onClick={() => navigate('/admin/users')}
                dir="rtl"
              >
                <UserPlus className="h-4 w-4 ml-2" />
                إضافة مستخدم ➕
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#FFB300] to-[#FF7A00] text-[#4B1E27] hover:scale-105 hover:shadow-[0_0_25px_rgba(255,179,0,0.5)] transition-all font-bold"
                onClick={() => navigate('/admin/employee-roles')}
                dir="rtl"
              >
                <Shield className="h-4 w-4 ml-2" />
                إدارة الصلاحيات 🎖️
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#FFB300] to-[#FF7A00] text-[#4B1E27] hover:scale-105 hover:shadow-[0_0_25px_rgba(255,179,0,0.5)] transition-all font-bold"
                onClick={() => navigate('/admin/leave-management')}
                dir="rtl"
              >
                <ClipboardList className="h-4 w-4 ml-2" />
                مراجعة الإجازات 📋
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#FFB300] to-[#FF7A00] text-[#4B1E27] hover:scale-105 hover:shadow-[0_0_25px_rgba(255,179,0,0.5)] transition-all font-bold"
                onClick={() => navigate('/shift-handover')}
                dir="rtl"
              >
                <FileText className="h-4 w-4 ml-2" />
                تسليم الشفتات 📝
              </Button>
            </div>
          </div>

          {/* Right Side - Decorative - الجانب الأيمن 🎨 */}
          <div className="hidden xl:block relative w-64 h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#FFB300]/30 to-[#FF7A00]/30 animate-pulse" />
                <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 text-white/40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Overview Cards - بطاقات الإحصائيات 📊 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 hover:-translate-y-2 hover:border-[#FFB300]/80 hover:shadow-[0_15px_40px_rgba(255,179,0,0.3)] transition-all duration-300 cursor-pointer animate-fade-in group"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => {
              if (stat.title === 'طلبات الموافقة') navigate('/admin/users');
              if (stat.title === 'شفتات اليوم') navigate('/admin/schedules');
              if (stat.title === 'طلبات الإجازات') navigate('/admin/leave-management');
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-6 w-6 text-[#4B1E27]" />
              </div>
              <span className="text-3xl">{stat.emoji}</span>
            </div>
            <div className="text-5xl font-bold text-white mb-3 group-hover:scale-110 transition-transform" dir="rtl">
              {loading ? '...' : stat.value}
            </div>
            <div className="text-white/90 text-base font-bold mb-1" dir="rtl">{stat.title}</div>
            <div className="text-white/60 text-xs" dir="rtl">{stat.subtitle}</div>
            <div className="text-white/40 text-xs mt-2" dir="rtl">محدّث مباشرة ⚡</div>
          </div>
        ))}
      </div>

      {/* Management Sections Grid - أقسام الإدارة 🎯 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {managementTiles.map((tile, index) => (
          <div
            key={tile.title}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 hover:scale-[1.02] hover:border-[#FFB300]/60 hover:shadow-[0_20px_50px_rgba(255,179,0,0.2)] transition-all duration-300 cursor-pointer group animate-fade-in"
            style={{ animationDelay: `${(index + 4) * 100}ms` }}
            onClick={() => navigate(tile.path)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF7A00] group-hover:scale-110 transition-transform">
                  <tile.icon className="h-6 w-6 text-[#4B1E27]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1" dir="rtl">{tile.title}</h3>
                  <p className="text-white/60 text-sm" dir="rtl">{tile.subtitle}</p>
                </div>
                <span className="text-3xl">{tile.emoji}</span>
              </div>
              <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-[#FFB300] group-hover:translate-x-1 transition-all" />
            </div>
            <ul className="space-y-2 mb-4">
              {tile.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-white/70 text-sm" dir="rtl">
                  <span className="text-[#FFB300] mt-1">✨</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              className="w-full text-[#FFB300] hover:bg-[#FFB300]/10 hover:text-[#FFB300] font-bold"
              dir="rtl"
            >
              إدارة القسم 🚀
              <ArrowRight className="h-4 w-4 mr-2" />
            </Button>
          </div>
        ))}
      </div>

      {/* Quick Shortcuts Section - اختصارات سريعة ⚡ */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 animate-fade-in" style={{ animationDelay: '800ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF7A00]">
            <Zap className="h-5 w-5 text-[#4B1E27]" />
          </div>
          <h3 className="text-2xl font-bold text-white" dir="rtl">اختصارات سريعة ⚡</h3>
          <span className="text-white/60 text-sm" dir="rtl">(وصول سريع لكل شي! 🚀)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {quickShortcuts.map((shortcut, index) => (
            <Button
              key={shortcut.label}
              variant="ghost"
              className="h-auto flex-col gap-3 p-4 backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#FFB300]/60 hover:scale-105 transition-all group animate-fade-in"
              style={{ animationDelay: `${(index + 8) * 50}ms` }}
              onClick={() => navigate(shortcut.path)}
            >
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#FFB300]/20 to-[#FF7A00]/20 group-hover:from-[#FFB300] group-hover:to-[#FF7A00] transition-all">
                <shortcut.icon className="h-6 w-6 text-[#FFB300] group-hover:text-[#4B1E27]" />
              </div>
              <span className="text-white/90 text-sm font-semibold text-center group-hover:text-[#FFB300]" dir="rtl">
                {shortcut.label}
              </span>
              <span className="text-2xl">{shortcut.emoji}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Fun Admin Tips Section - نصائح إدارية مضحكة 😄 */}
      <div className="mt-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 animate-fade-in" style={{ animationDelay: '900ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF7A00]">
            <TrendingUp className="h-5 w-5 text-[#4B1E27]" />
          </div>
          <h3 className="text-xl font-bold text-white" dir="rtl">نصائح إدارية (مع شوية مزح! 😄)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white/80 text-sm" dir="rtl">
              💡 <span className="font-bold text-[#FFB300]">نصيحة:</span> لا تنسى توافق على طلبات الموظفين الجدد! (ما يصير يظلون واقفين برّا! 😅)
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white/80 text-sm" dir="rtl">
              ⚡ <span className="font-bold text-[#FFB300]">تذكير:</span> راجع الجداول كل أسبوع! (عشان ما يصير فوضى! 📅)
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white/80 text-sm" dir="rtl">
              🎯 <span className="font-bold text-[#FFB300]">مهم:</span> الإجازات تبي موافقة سريعة! (الناس تنتظر! ⏰)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
