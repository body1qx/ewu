import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getAllProfiles } from '@/db/api';
import { Download, Filter, RefreshCw, AlertTriangle, CheckCircle2, Clock, Coffee, LogIn, LogOut, Timer } from 'lucide-react';
import type { Profile } from '@/types/types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

// تعريف أنواع البيانات للتقرير الشامل
interface AttendanceSession {
  session_number: number;
  check_in_time: string;
  check_out_time: string | null;
  duration_minutes: number;
}

interface BreakSession {
  break_number: number;
  break_type: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  exceeds_limit: boolean; // هل تجاوز النص ساعة؟
  notes?: string;
}

interface EmployeeReport {
  user_id: string;
  full_name: string;
  role: string;
  team: string | null;
  attendance_sessions: AttendanceSession[];
  break_sessions: BreakSession[];
  total_work_minutes: number;
  total_break_minutes: number;
  total_breaks_count: number;
  breaks_exceeding_30min: number;
  longest_break_minutes: number;
}

export default function ComprehensiveAttendanceReport() {
  const [reportData, setReportData] = useState<EmployeeReport[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table'); // وضع العرض: جدول أو بطاقات

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (profiles.length > 0) {
      fetchReport();
    }
  }, [selectedDate, selectedUser, selectedTeam]);

  const fetchProfiles = async () => {
    try {
      const data = await getAllProfiles();
      setProfiles(data.filter(p => p.status === 'active'));
    } catch (error) {
      console.error('خطأ في جلب بيانات الموظفين:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      console.log('🔄 جاري جلب التقرير الشامل...');
      
      // جلب البيانات الحقيقية من قاعدة البيانات
      const { getComprehensiveAttendanceReport } = await import('@/db/api');
      const data = await getComprehensiveAttendanceReport(selectedDate, selectedUser);
      
      console.log(`✅ تم جلب بيانات ${data.length} موظف`);
      
      // تطبيق فلتر الفريق
      let filteredData = data;
      if (selectedTeam && selectedTeam !== 'all') {
        filteredData = data.filter(emp => emp.team === selectedTeam);
      }
      
      setReportData(filteredData);
      toast.success(`تم تحميل التقرير بنجاح - ${filteredData.length} موظف`);
    } catch (error: any) {
      console.error('❌ فشل في جلب التقرير:', error);
      toast.error('فشل في تحميل التقرير: ' + (error.message || 'خطأ غير معروف'));
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // دالة مؤقتة لتوليد بيانات تجريبية
  const generateMockReportData = (): EmployeeReport[] => {
    return profiles.slice(0, 5).map((profile, idx) => ({
      user_id: profile.id,
      full_name: profile.full_name,
      role: profile.role,
      team: profile.team,
      attendance_sessions: [
        {
          session_number: 1,
          check_in_time: `${selectedDate}T08:00:00`,
          check_out_time: `${selectedDate}T12:30:00`,
          duration_minutes: 270,
        },
        {
          session_number: 2,
          check_in_time: `${selectedDate}T13:00:00`,
          check_out_time: `${selectedDate}T17:00:00`,
          duration_minutes: 240,
        },
      ],
      break_sessions: [
        {
          break_number: 1,
          break_type: 'normal',
          start_time: `${selectedDate}T10:00:00`,
          end_time: `${selectedDate}T10:15:00`,
          duration_minutes: 15,
          exceeds_limit: false,
        },
        {
          break_number: 2,
          break_type: 'normal',
          start_time: `${selectedDate}T14:00:00`,
          end_time: `${selectedDate}T14:45:00`,
          duration_minutes: 45,
          exceeds_limit: true, // تجاوز النص ساعة!
          notes: 'استراحة طويلة',
        },
        {
          break_number: 3,
          break_type: 'prayer',
          start_time: `${selectedDate}T15:30:00`,
          end_time: `${selectedDate}T15:45:00`,
          duration_minutes: 15,
          exceeds_limit: false,
        },
      ],
      total_work_minutes: 510,
      total_break_minutes: 75,
      total_breaks_count: 3,
      breaks_exceeding_30min: 1,
      longest_break_minutes: 45,
    }));
  };

  const toggleRowExpansion = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    try {
      // إنشاء ملف Excel شامل
      const wb = XLSX.utils.book_new();

      // ورقة 1: ملخص الموظفين
      const summaryData = reportData.map(emp => ({
        'اسم الموظف': emp.full_name,
        'الدور': emp.role,
        'الفريق': emp.team || 'غير محدد',
        'عدد جلسات الحضور': emp.attendance_sessions.length,
        'إجمالي وقت العمل (دقيقة)': emp.total_work_minutes,
        'عدد البريكات': emp.total_breaks_count,
        'إجمالي وقت البريكات (دقيقة)': emp.total_break_minutes,
        'بريكات تجاوزت 30 دقيقة': emp.breaks_exceeding_30min,
        'أطول بريك (دقيقة)': emp.longest_break_minutes,
      }));
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص الموظفين');

      // ورقة 2: تفاصيل جلسات الحضور
      const attendanceData: any[] = [];
      reportData.forEach(emp => {
        emp.attendance_sessions.forEach(session => {
          attendanceData.push({
            'اسم الموظف': emp.full_name,
            'رقم الجلسة': session.session_number,
            'وقت الدخول': format(new Date(session.check_in_time), 'HH:mm:ss'),
            'وقت الخروج': session.check_out_time ? format(new Date(session.check_out_time), 'HH:mm:ss') : 'لم ينصرف بعد',
            'المدة (دقيقة)': session.duration_minutes,
          });
        });
      });
      const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
      XLSX.utils.book_append_sheet(wb, wsAttendance, 'جلسات الحضور');

      // ورقة 3: تفاصيل البريكات
      const breaksData: any[] = [];
      reportData.forEach(emp => {
        emp.break_sessions.forEach(breakSession => {
          breaksData.push({
            'اسم الموظف': emp.full_name,
            'رقم البريك': breakSession.break_number,
            'نوع البريك': breakSession.break_type,
            'وقت البداية': format(new Date(breakSession.start_time), 'HH:mm:ss'),
            'وقت النهاية': breakSession.end_time ? format(new Date(breakSession.end_time), 'HH:mm:ss') : 'مستمر',
            'المدة (دقيقة)': breakSession.duration_minutes,
            'تجاوز 30 دقيقة؟': breakSession.exceeds_limit ? 'نعم ⚠️' : 'لا ✅',
            'ملاحظات': breakSession.notes || '-',
          });
        });
      });
      const wsBreaks = XLSX.utils.json_to_sheet(breaksData);
      XLSX.utils.book_append_sheet(wb, wsBreaks, 'تفاصيل البريكات');

      // حفظ الملف
      const filename = `تقرير_شامل_${selectedDate}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success('تم تصدير التقرير بنجاح! 📊');
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      toast.error('فشل في تصدير التقرير');
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}س ${mins}د`;
  };

  const getBreakTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      normal: 'عادي',
      prayer: 'صلاة',
      technical: 'تقني',
      meeting: 'اجتماع',
      auto_idle: 'خمول تلقائي',
    };
    return labels[type] || type;
  };

  const uniqueTeams = Array.from(new Set(profiles.map(p => p.team).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text" dir="rtl">
            📊 التقرير الشامل للحضور والبريكات
          </h1>
          <p className="text-muted-foreground mt-2" dir="rtl">
            تقرير مفصل يعرض جميع جلسات الدخول والخروج والبريكات مع التحقق من الحد الأقصى 30 دقيقة
          </p>
        </div>
      </div>

      {/* الفلاتر */}
      <Card className="border-primary/20 shadow-glow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" dir="rtl">
                <Filter className="h-5 w-5 text-primary" />
                الفلاتر
              </CardTitle>
              <CardDescription dir="rtl">اختر التاريخ والموظف والفريق</CardDescription>
            </div>
            <Button 
              onClick={handleExportExcel} 
              variant="default"
              className="shadow-glow"
              disabled={reportData.length === 0}
            >
              <Download className="ml-2 h-4 w-4" />
              تصدير Excel شامل
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" dir="rtl">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user" dir="rtl">الموظف</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="جميع الموظفين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموظفين</SelectItem>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team" dir="rtl">الفريق</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger id="team">
                  <SelectValue placeholder="جميع الفرق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفرق</SelectItem>
                  {uniqueTeams.map(team => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={fetchReport} disabled={loading} className="w-full">
                <RefreshCw className={`ml-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'جاري التحميل...' : 'تطبيق'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول التقرير */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" dir="rtl">
                <Clock className="h-5 w-5 text-primary" />
                بيانات التقرير
              </CardTitle>
              <CardDescription dir="rtl">
                عرض {reportData.length} موظف للتاريخ {format(new Date(selectedDate), 'yyyy-MM-dd')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                جدول
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                بطاقات
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" dir="rtl">لا توجد بيانات للفلاتر المحددة</p>
            </div>
          ) : viewMode === 'table' ? (
            // عرض الجدول
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">الفريق</TableHead>
                    <TableHead className="text-right">موعد البداية</TableHead>
                    <TableHead className="text-right">موعد النهاية</TableHead>
                    <TableHead className="text-right">أول دخول</TableHead>
                    <TableHead className="text-right">آخر خروج</TableHead>
                    <TableHead className="text-right">تأخير دخول</TableHead>
                    <TableHead className="text-right">دقائق التأخير</TableHead>
                    <TableHead className="text-right">خروج مبكر</TableHead>
                    <TableHead className="text-right">وقت الحضور (د)</TableHead>
                    <TableHead className="text-right">بريكات عادية (د)</TableHead>
                    <TableHead className="text-right">بريكات اجتماع (د)</TableHead>
                    <TableHead className="text-right">بريك مطلوب</TableHead>
                    <TableHead className="text-right">بريك طويل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((employee: any) => (
                    <TableRow key={employee.user_id}>
                      <TableCell className="font-medium">{employee.full_name}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{employee.team || 'N/A'}</TableCell>
                      <TableCell>{employee.scheduled_start || 'N/A'}</TableCell>
                      <TableCell>{employee.scheduled_end || 'N/A'}</TableCell>
                      <TableCell>
                        {employee.first_login ? format(new Date(employee.first_login), 'HH:mm:ss') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {employee.last_logout ? format(new Date(employee.last_logout), 'HH:mm:ss') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {employee.is_late_login ? (
                          <Badge variant="destructive">نعم</Badge>
                        ) : (
                          <Badge variant="outline">لا</Badge>
                        )}
                      </TableCell>
                      <TableCell>{employee.late_login_minutes || 0}</TableCell>
                      <TableCell>
                        {employee.is_early_logout ? (
                          <Badge variant="destructive">نعم</Badge>
                        ) : (
                          <Badge variant="outline">لا</Badge>
                        )}
                      </TableCell>
                      <TableCell>{employee.online_time_minutes || 0}</TableCell>
                      <TableCell>{employee.normal_break_minutes || 0}</TableCell>
                      <TableCell>{employee.meeting_break_minutes || 0}</TableCell>
                      <TableCell>
                        {employee.breaks_count > 0 ? (
                          <Badge variant="outline">نعم</Badge>
                        ) : (
                          <Badge variant="secondary">لا</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.breaks_exceeding_30min > 0 ? (
                          <Badge variant="destructive">نعم</Badge>
                        ) : (
                          <Badge variant="outline">لا</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            // عرض البطاقات
            <div className="space-y-4">
              {reportData.map((employee) => (
                <Card 
                  key={employee.user_id} 
                  className={`border-2 transition-all ${
                    employee.breaks_exceeding_30min > 0 
                      ? 'border-red-500/30 bg-red-500/5' 
                      : 'border-primary/20 bg-card'
                  }`}
                >
                  <CardHeader className="cursor-pointer" onClick={() => toggleRowExpansion(employee.user_id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <CardTitle className="text-xl" dir="rtl">{employee.full_name}</CardTitle>
                          <CardDescription dir="rtl">
                            {employee.role} • {employee.team || 'بدون فريق'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {employee.breaks_exceeding_30min > 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {employee.breaks_exceeding_30min} بريك تجاوز 30د
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                          <LogIn className="h-3 w-3" />
                          {employee.attendance_sessions.length} جلسة
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Coffee className="h-3 w-3" />
                          {employee.total_breaks_count} بريك
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Timer className="h-3 w-3" />
                          {formatDuration(employee.total_work_minutes)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedRows.has(employee.user_id) && (
                    <CardContent className="space-y-6">
                      {/* جلسات الحضور */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" dir="rtl">
                          <LogIn className="h-5 w-5 text-primary" />
                          جلسات الدخول والخروج
                        </h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right">الجلسة</TableHead>
                                <TableHead className="text-right">وقت الدخول</TableHead>
                                <TableHead className="text-right">وقت الخروج</TableHead>
                                <TableHead className="text-right">المدة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {employee.attendance_sessions.map((session) => (
                                <TableRow key={session.session_number}>
                                  <TableCell className="font-medium">#{session.session_number}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <LogIn className="h-4 w-4 text-green-500" />
                                      {format(new Date(session.check_in_time), 'HH:mm:ss')}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {session.check_out_time ? (
                                      <div className="flex items-center gap-2">
                                        <LogOut className="h-4 w-4 text-red-500" />
                                        {format(new Date(session.check_out_time), 'HH:mm:ss')}
                                      </div>
                                    ) : (
                                      <Badge variant="secondary">مستمر</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>{formatDuration(session.duration_minutes)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* جلسات البريكات */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" dir="rtl">
                          <Coffee className="h-5 w-5 text-primary" />
                          تفاصيل البريكات
                        </h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right">البريك</TableHead>
                                <TableHead className="text-right">النوع</TableHead>
                                <TableHead className="text-right">البداية</TableHead>
                                <TableHead className="text-right">النهاية</TableHead>
                                <TableHead className="text-right">المدة</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">ملاحظات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {employee.break_sessions.map((breakSession) => (
                                <TableRow 
                                  key={breakSession.break_number}
                                  className={breakSession.exceeds_limit ? 'bg-red-500/10' : ''}
                                >
                                  <TableCell className="font-medium">#{breakSession.break_number}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {getBreakTypeLabel(breakSession.break_type)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{format(new Date(breakSession.start_time), 'HH:mm:ss')}</TableCell>
                                  <TableCell>
                                    {breakSession.end_time ? format(new Date(breakSession.end_time), 'HH:mm:ss') : 'مستمر'}
                                  </TableCell>
                                  <TableCell>
                                    <span className={breakSession.exceeds_limit ? 'font-bold text-red-500' : ''}>
                                      {breakSession.duration_minutes} دقيقة
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {breakSession.exceeds_limit ? (
                                      <Badge variant="destructive" className="gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        تجاوز 30د
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                                        <CheckCircle2 className="h-3 w-3" />
                                        طبيعي
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {breakSession.notes || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* الملخص */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground" dir="rtl">إجمالي وقت العمل</p>
                              <p className="text-2xl font-bold text-primary">{formatDuration(employee.total_work_minutes)}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-accent/5 border-accent/20">
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground" dir="rtl">إجمالي البريكات</p>
                              <p className="text-2xl font-bold text-accent">{formatDuration(employee.total_break_minutes)}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/50 border-muted">
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground" dir="rtl">عدد البريكات</p>
                              <p className="text-2xl font-bold">{employee.total_breaks_count}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className={employee.breaks_exceeding_30min > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground" dir="rtl">بريكات تجاوزت 30د</p>
                              <p className={`text-2xl font-bold ${employee.breaks_exceeding_30min > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {employee.breaks_exceeding_30min}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
