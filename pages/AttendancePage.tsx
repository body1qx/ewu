import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LogIn, 
  LogOut, 
  Coffee,
  Clock, 
  Calendar,
  CheckCircle2,
  Timer,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { BreakControlPanel } from '@/components/break/BreakControlPanel';
import { MyBreaksToday } from '@/components/break/MyBreaksToday';
import { LiveEmployeeStatus } from '@/components/break/LiveEmployeeStatus';
import { supabase } from '@/db/supabase';

// مدة الجلسة القصوى: 15 ساعة بالميلي ثانية
const MAX_SESSION_DURATION = 15 * 60 * 60 * 1000; // 15 hours in milliseconds

export default function AttendancePage() {
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // التحقق من انتهاء مدة الجلسة وتسجيل الخروج التلقائي
  const checkAndAutoCheckout = async () => {
    if (!isCheckedIn || !checkInTime || !currentSessionId) return;

    const now = new Date();
    const elapsedTime = now.getTime() - checkInTime.getTime();

    // إذا مرت 15 ساعة، قم بتسجيل الخروج تلقائياً
    if (elapsedTime >= MAX_SESSION_DURATION) {
      try {
        // تحديث جلسة الحضور بوقت الانصراف التلقائي
        const { error } = await supabase
          .from('attendance_sessions')
          .update({
            session_end: now.toISOString(),
          })
          .eq('id', currentSessionId);

        if (error) {
          console.error('خطأ في تسجيل الانصراف التلقائي:', error);
          return;
        }

        // تحديث الحالة المحلية
        setIsCheckedIn(false);
        setCheckOutTime(now);
        setCurrentSessionId(null);
        
        // تحديث localStorage
        localStorage.setItem('attendance_checkout', now.toISOString());
        
        toast.warning('تم تسجيل انصرافك تلقائياً بعد 15 ساعة ⏰', {
          description: 'مرت 15 ساعة على تسجيل حضورك. تم تسجيل الانصراف تلقائياً.',
          duration: 7000,
        });
      } catch (error) {
        console.error('خطأ في تسجيل الانصراف التلقائي:', error);
      }
    }
  };

  // جلب حالة الحضور من قاعدة البيانات
  const loadAttendanceStatus = async () => {
    if (!profile?.id) return;

    try {
      // البحث عن جلسة نشطة (session_end IS NULL)
      const { data: activeSession, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .is('session_end', null)
        .order('session_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('خطأ في جلب حالة الحضور:', error);
        return;
      }

      if (activeSession) {
        const sessionStartTime = new Date(activeSession.session_start);
        const now = new Date();
        const elapsedTime = now.getTime() - sessionStartTime.getTime();

        // التحقق من انتهاء مدة الجلسة (15 ساعة)
        if (elapsedTime >= MAX_SESSION_DURATION) {
          // تسجيل الخروج التلقائي
          const { error: updateError } = await supabase
            .from('attendance_sessions')
            .update({
              session_end: now.toISOString(),
            })
            .eq('id', activeSession.id);

          if (!updateError) {
            setIsCheckedIn(false);
            setCheckInTime(sessionStartTime);
            setCheckOutTime(now);
            setCurrentSessionId(null);
            localStorage.setItem('attendance_checkout', now.toISOString());
            
            toast.warning('تم تسجيل انصرافك تلقائياً بعد 15 ساعة ⏰', {
              description: 'مرت 15 ساعة على تسجيل حضورك. تم تسجيل الانصراف تلقائياً.',
              duration: 7000,
            });
          }
        } else {
          // المستخدم مسجل دخول حالياً والجلسة لا تزال صالحة
          setIsCheckedIn(true);
          setCheckInTime(sessionStartTime);
          setCurrentSessionId(activeSession.id);
          setCheckOutTime(null);
          
          // تحديث localStorage
          localStorage.setItem('attendance_checkin', activeSession.session_start);
          localStorage.removeItem('attendance_checkout');
        }
      } else {
        // البحث عن آخر جلسة مكتملة اليوم
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: lastSession } = await supabase
          .from('attendance_sessions')
          .select('*')
          .eq('user_id', profile.id)
          .not('session_end', 'is', null)
          .gte('session_start', today.toISOString())
          .order('session_start', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastSession) {
          setIsCheckedIn(false);
          setCheckInTime(new Date(lastSession.session_start));
          setCheckOutTime(new Date(lastSession.session_end));
          setCurrentSessionId(null);
        } else {
          // لا توجد جلسات اليوم
          setIsCheckedIn(false);
          setCheckInTime(null);
          setCheckOutTime(null);
          setCurrentSessionId(null);
          localStorage.removeItem('attendance_checkin');
          localStorage.removeItem('attendance_checkout');
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل حالة الحضور:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadAttendanceStatus();
    
    return () => clearInterval(timer);
  }, [profile?.id]);

  // فحص دوري لتسجيل الخروج التلقائي (كل دقيقة)
  useEffect(() => {
    if (isCheckedIn && checkInTime) {
      const checkInterval = setInterval(() => {
        checkAndAutoCheckout();
      }, 60000); // فحص كل دقيقة

      return () => clearInterval(checkInterval);
    }
  }, [isCheckedIn, checkInTime, currentSessionId]);

  const handleCheckIn = async () => {
    if (!profile?.id) {
      toast.error('خطأ: لم يتم العثور على معلومات المستخدم');
      return;
    }

    try {
      const now = new Date();
      
      // إنشاء جلسة حضور جديدة في قاعدة البيانات
      const { data: newSession, error } = await supabase
        .from('attendance_sessions')
        .insert({
          user_id: profile.id,
          session_start: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('خطأ في تسجيل الحضور:', error);
        toast.error('فشل في تسجيل الحضور: ' + error.message);
        return;
      }

      // تحديث الحالة المحلية
      setIsCheckedIn(true);
      setCheckInTime(now);
      setCheckOutTime(null);
      setCurrentSessionId(newSession.id);
      
      // تحديث localStorage
      localStorage.setItem('attendance_checkin', now.toISOString());
      localStorage.removeItem('attendance_checkout');
      
      toast.success('تم تسجيل حضورك بنجاح! يلا نشتغل 💪', {
        description: `الوقت: ${format(now, 'HH:mm:ss')}`,
      });
    } catch (error: any) {
      console.error('خطأ في تسجيل الحضور:', error);
      toast.error('حدث خطأ أثناء تسجيل الحضور');
    }
  };

  const handleCheckOut = async () => {
    if (!profile?.id || !currentSessionId) {
      toast.error('خطأ: لا توجد جلسة نشطة');
      return;
    }

    try {
      const now = new Date();
      
      // تحديث جلسة الحضور بوقت الانصراف
      const { error } = await supabase
        .from('attendance_sessions')
        .update({
          session_end: now.toISOString(),
        })
        .eq('id', currentSessionId);

      if (error) {
        console.error('خطأ في تسجيل الانصراف:', error);
        toast.error('فشل في تسجيل الانصراف: ' + error.message);
        return;
      }

      // تحديث الحالة المحلية
      setIsCheckedIn(false);
      setCheckOutTime(now);
      setCurrentSessionId(null);
      
      // تحديث localStorage
      localStorage.setItem('attendance_checkout', now.toISOString());
      
      toast.success('تم تسجيل انصرافك! الله يعطيك العافية 🌟', {
        description: `الوقت: ${format(now, 'HH:mm:ss')}`,
      });
    } catch (error: any) {
      console.error('خطأ في تسجيل الانصراف:', error);
      toast.error('حدث خطأ أثناء تسجيل الانصراف');
    }
  };

  const getWorkDuration = () => {
    if (!checkInTime) return '00:00:00';
    const end = checkOutTime || currentTime;
    const diff = end.getTime() - checkInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl border border-primary/30">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text" dir="rtl">
                مركز الحضور والبريكات 🎯
              </h1>
              <p className="text-muted-foreground mt-1" dir="rtl">
                سجل حضورك وانصرافك واستراحاتك وشوف التقارير اليومية
              </p>
            </div>
          </div>
        </div>

        {/* Current Time & Status */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Current Time Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary-glow/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-primary flex items-center gap-2" dir="rtl">
                <Calendar className="h-4 w-4" />
                الوقت الحالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" dir="ltr">
                {format(currentTime, 'HH:mm:ss')}
              </div>
              <p className="text-xs text-muted-foreground mt-1" dir="rtl">
                {format(currentTime, 'EEEE، d MMMM yyyy')}
              </p>
            </CardContent>
          </Card>

          {/* Check-in Status Card */}
          <Card className={`bg-gradient-to-br ${isCheckedIn ? 'from-green-500/10 to-green-600/5 border-green-500/20' : 'from-muted/10 to-muted/5 border-muted/20'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium flex items-center gap-2 ${isCheckedIn ? 'text-green-500' : 'text-muted-foreground'}`} dir="rtl">
                <CheckCircle2 className="h-4 w-4" />
                حالة الحضور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={isCheckedIn ? 'default' : 'secondary'} className="text-base px-3 py-1">
                  {isCheckedIn ? '✅ موجود' : '❌ غير مسجل'}
                </Badge>
              </div>
              {checkInTime && (
                <p className="text-xs text-muted-foreground mt-2" dir="rtl">
                  وقت الحضور: {format(checkInTime, 'HH:mm:ss')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Work Duration Card */}
          <Card className="bg-gradient-to-br from-accent/10 to-accent-orange/5 border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-accent flex items-center gap-2" dir="rtl">
                <Timer className="h-4 w-4" />
                مدة العمل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" dir="ltr">
                {getWorkDuration()}
              </div>
              <p className="text-xs text-muted-foreground mt-1" dir="rtl">
                {checkOutTime ? 'انتهى الدوام' : isCheckedIn ? 'جاري العمل...' : 'لم يبدأ بعد'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Check-in/Check-out Buttons */}
        <Card className="mb-8 bg-gradient-to-br from-card to-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" dir="rtl">
              <Zap className="h-5 w-5 text-primary" />
              تسجيل الحضور والانصراف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Check-in Button */}
              <Button
                size="lg"
                onClick={handleCheckIn}
                disabled={isCheckedIn}
                className="h-24 text-lg font-bold shadow-glow group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <LogIn className="h-6 w-6" />
                  <div className="text-right" dir="rtl">
                    <div>سجل حضورك</div>
                    <div className="text-xs font-normal opacity-80">ابدأ يومك بنشاط! 🚀</div>
                  </div>
                </span>
                <div className="absolute inset-0 shimmer" />
              </Button>

              {/* Check-out Button */}
              <Button
                size="lg"
                variant="outline"
                onClick={handleCheckOut}
                disabled={!isCheckedIn || !!checkOutTime}
                className="h-24 text-lg font-bold glassmorphic border-accent/30 hover:border-accent group"
              >
                <span className="flex items-center gap-3">
                  <LogOut className="h-6 w-6" />
                  <div className="text-right" dir="rtl">
                    <div>سجل انصرافك</div>
                    <div className="text-xs font-normal opacity-80">الله يعطيك العافية! 🌟</div>
                  </div>
                </span>
              </Button>
            </div>

            {/* Status Messages */}
            {!isCheckedIn && !checkOutTime && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border" dir="rtl">
                <p className="text-sm text-muted-foreground text-center">
                  👋 يا هلا! سجل حضورك عشان تبدأ يومك
                </p>
              </div>
            )}

            {isCheckedIn && !checkOutTime && (
              <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20" dir="rtl">
                <p className="text-sm text-green-600 dark:text-green-400 text-center">
                  ✅ أنت مسجل حضور! يلا نشتغل بحماس 💪
                </p>
              </div>
            )}

            {checkOutTime && !isCheckedIn && (
              <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20" dir="rtl">
                <p className="text-sm text-accent text-center">
                  👋 تم تسجيل انصرافك! الله يعطيك العافية على شغلك اليوم 🌟
                </p>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  💡 تقدر تسجل حضورك مرة ثانية إذا رجعت للعمل
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Break Management & Reports Section */}
        {isCheckedIn && !checkOutTime && (
          <div className="space-y-6 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Coffee className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold gradient-text" dir="rtl">
                إدارة الاستراحات والتقارير ☕📊
              </h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BreakControlPanel />
              <MyBreaksToday />
            </div>
          </div>
        )}

        {/* Live Employee Status - Visible to all users */}
        <div className="mt-8">
          <LiveEmployeeStatus />
        </div>

        {/* Message when not checked in */}
        {!isCheckedIn && (
          <Card className="bg-gradient-to-br from-muted/20 to-muted/10 border-muted/30 mt-8">
            <CardContent className="py-12 text-center">
              <Coffee className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg" dir="rtl">
                سجل حضورك أولاً عشان تقدر تاخذ بريك وتشوف التقارير! 😊
              </p>
              <p className="text-muted-foreground/60 text-sm mt-2" dir="rtl">
                البريكات والتقارير متاحة فقط للموظفين المسجلين حضور
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
