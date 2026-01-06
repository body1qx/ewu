import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/db/supabase';
import { Coffee, Clock, User, Users, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ActiveEmployee {
  user_id: string;
  full_name: string;
  role: string;
  team: string | null;
  profile_image: string | null;
  check_in_time: string;
  is_on_break: boolean;
  break_type?: string;
  break_start_time?: string;
  break_duration_seconds?: number;
}

export function LiveEmployeeStatus() {
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchActiveEmployees = async () => {
    try {
      console.log('🔄 جاري جلب بيانات الموظفين النشطين...');
      
      // Use RPC function to get all active employees (bypasses RLS)
      const { data, error } = await supabase
        .rpc('get_active_employees');

      console.log('📊 نتيجة الاستعلام:', { data, error });

      if (error) {
        console.error('❌ خطأ في استدعاء get_active_employees:', error);
        throw error;
      }

      console.log(`✅ تم جلب ${data?.length || 0} موظف`);

      // Transform the data
      const employees: ActiveEmployee[] = (data || []).map(emp => ({
        user_id: emp.user_id,
        full_name: emp.full_name || 'غير معروف',
        role: emp.role || 'agent',
        team: emp.team || null,
        profile_image: emp.profile_image || null,
        check_in_time: emp.check_in_time,
        is_on_break: emp.is_on_break || false,
        break_type: emp.break_type || undefined,
        break_start_time: emp.break_start_time || undefined,
        break_duration_seconds: emp.break_start_time 
          ? Math.floor((new Date().getTime() - new Date(emp.break_start_time).getTime()) / 1000)
          : 0,
      }));

      console.log('👥 الموظفين المحولين:', employees);

      setActiveEmployees(employees);
      setLastUpdate(new Date());
      
      if (employees.length === 0) {
        toast.info('لا يوجد موظفين مسجلين دخول حالياً');
      } else {
        toast.success(`تم تحديث بيانات ${employees.length} موظف`);
      }
    } catch (error: any) {
      console.error('❌ خطأ في جلب بيانات الموظفين:', error);
      toast.error('فشل في تحميل بيانات الموظفين: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveEmployees();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveEmployees, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}د ${secs}ث`;
  };

  const getBreakTypeLabel = (type?: string): string => {
    const labels: Record<string, string> = {
      normal: 'عادي',
      prayer: 'صلاة',
      technical: 'تقني',
      meeting: 'اجتماع',
      auto_idle: 'خمول',
    };
    return type ? labels[type] || type : '';
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleManualRefresh = () => {
    setLoading(true);
    fetchActiveEmployees();
  };

  const workingEmployees = activeEmployees.filter(e => !e.is_on_break);
  const onBreakEmployees = activeEmployees.filter(e => e.is_on_break);

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2" dir="rtl">
              <Users className="h-5 w-5 text-primary" />
              الموظفين المسجلين حالياً
            </CardTitle>
            <CardDescription dir="rtl">
              {activeEmployees.length} موظف مسجل دخول • {onBreakEmployees.length} في بريك
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activeEmployees.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground" dir="rtl">لا يوجد موظفين مسجلين دخول حالياً</p>
          </div>
        ) : (
          <>
            {/* الموظفين في بريك */}
            {onBreakEmployees.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Coffee className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-sm" dir="rtl">في بريك ({onBreakEmployees.length})</h3>
                </div>
                <div className="space-y-2">
                  {onBreakEmployees.map((employee) => (
                    <div
                      key={employee.user_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-amber-500/30">
                          <AvatarImage src={employee.profile_image || undefined} />
                          <AvatarFallback className="bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            {getInitials(employee.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm" dir="rtl">{employee.full_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{employee.team || 'بدون فريق'}</span>
                            <span>•</span>
                            <span>{employee.role === 'admin' ? 'مدير' : 'موظف'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
                          <Coffee className="h-3 w-3 ml-1" />
                          {getBreakTypeLabel(employee.break_type)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1" dir="rtl">
                          {employee.break_duration_seconds ? formatDuration(employee.break_duration_seconds) : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* الموظفين يعملون */}
            {workingEmployees.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Clock className="h-4 w-4 text-green-500" />
                  <h3 className="font-semibold text-sm" dir="rtl">يعملون ({workingEmployees.length})</h3>
                </div>
                <div className="space-y-2">
                  {workingEmployees.map((employee) => (
                    <div
                      key={employee.user_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-green-500/30">
                          <AvatarImage src={employee.profile_image || undefined} />
                          <AvatarFallback className="bg-green-500/20 text-green-700 dark:text-green-300">
                            {getInitials(employee.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm" dir="rtl">{employee.full_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{employee.team || 'بدون فريق'}</span>
                            <span>•</span>
                            <span>{employee.role === 'admin' ? 'مدير' : 'موظف'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
                          <Clock className="h-3 w-3 ml-1" />
                          يعمل
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1" dir="rtl">
                          دخول: {format(new Date(employee.check_in_time), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* آخر تحديث */}
            <div className="text-center pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground" dir="rtl">
                آخر تحديث: {format(lastUpdate, 'HH:mm:ss')}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
