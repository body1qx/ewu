import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, LogIn, Coffee, ArrowRight, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

export function AttendanceWidget() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  // جلب حالة الحضور من قاعدة البيانات
  const loadAttendanceStatus = async () => {
    if (!profile?.id) return;

    try {
      // البحث عن جلسة نشطة (session_end IS NULL)
      const { data: activeSession } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .is('session_end', null)
        .order('session_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeSession) {
        setIsCheckedIn(true);
        setCheckInTime(new Date(activeSession.session_start));
        // تحديث localStorage للتوافق
        localStorage.setItem('attendance_checkin', activeSession.session_start);
        localStorage.removeItem('attendance_checkout');
      } else {
        setIsCheckedIn(false);
        setCheckInTime(null);
      }
    } catch (error) {
      // تجاهل الأخطاء إذا كان المستخدم غير مصادق (أثناء تسجيل الخروج)
      if (profile?.id) {
        console.error('خطأ في تحميل حالة الحضور:', error);
      }
    }
  };

  useEffect(() => {
    // لا تحمل البيانات إذا لم يكن هناك ملف شخصي
    if (!profile?.id) return;

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadAttendanceStatus();
    
    // تحديث الحالة كل 30 ثانية
    const refreshInterval = setInterval(loadAttendanceStatus, 30000);
    
    return () => {
      clearInterval(timer);
      clearInterval(refreshInterval);
    };
  }, [profile?.id]);

  const getWorkDuration = () => {
    if (!checkInTime) return '00:00:00';
    const diff = currentTime.getTime() - checkInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary-glow/5 to-accent/10 border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-glow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between" dir="rtl">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>الحضور والبريكات 🎯</span>
          </div>
          <Badge variant={isCheckedIn ? 'default' : 'secondary'} className="text-xs">
            {isCheckedIn ? '✅ موجود' : '⏰ غير مسجل'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Time */}
        <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
          <div className="text-3xl font-bold text-foreground" dir="ltr">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <p className="text-xs text-muted-foreground mt-1" dir="rtl">
            {format(currentTime, 'EEEE، d MMMM')}
          </p>
        </div>

        {/* Status Display */}
        {isCheckedIn ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-right" dir="rtl">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  مدة العمل
                </p>
                <p className="text-xs text-muted-foreground">
                  بدأت الساعة {checkInTime ? format(checkInTime, 'HH:mm') : '--:--'}
                </p>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400" dir="ltr">
                {getWorkDuration()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/attendance')}
                className="glassmorphic border-accent/30 hover:border-accent group"
              >
                <Coffee className="h-4 w-4 mr-1" />
                <span dir="rtl">بريك</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/attendance')}
                className="shadow-glow group"
              >
                <span dir="rtl">انصراف</span>
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg border border-border text-center" dir="rtl">
              <p className="text-sm text-muted-foreground">
                👋 يا هلا! سجل حضورك عشان تبدأ يومك
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => navigate('/attendance')}
              className="w-full shadow-glow group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                <span dir="rtl">سجل حضورك الحين!</span>
                <Zap className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </span>
              <div className="absolute inset-0 shimmer" />
            </Button>
          </div>
        )}

        {/* Quick Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/attendance')}
          className="w-full text-xs text-muted-foreground hover:text-primary"
          dir="rtl"
        >
          اذهب لمركز الحضور والبريكات
          <ArrowRight className="h-3 w-3 mr-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
