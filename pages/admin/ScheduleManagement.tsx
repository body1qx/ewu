import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Zap,
  TrendingUp,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { getEmployeesWithPositions, getSchedulesByWeek, createSchedule, updateSchedule, deleteSchedule, resetAllSchedules } from '@/db/api';
import type { Profile, Schedule, ShiftStatus, TaskType } from '@/types/types';
import { cn } from '@/lib/utils';
import { TaskMultiSelect, TaskTag } from '@/components/schedule/TaskMultiSelect';
import { TaskAnalytics } from '@/components/schedule/TaskAnalytics';
import ScheduleEligibility from '@/components/schedule/ScheduleEligibility';

// إعدادات الحالات
const STATUS_CONFIG: Record<ShiftStatus, { label: string; color: string; requiresTime: boolean }> = {
  working: { label: 'شغال 💼', color: 'bg-gradient-to-br from-accent/30 to-accent/10 border-accent/50', requiresTime: true },
  off: { label: 'راحة 🏖️', color: 'bg-gradient-to-br from-gray-500/20 to-gray-400/10 border-gray-400/50', requiresTime: false },
  work_from_home: { label: 'شغل من البيت 🏠', color: 'bg-gradient-to-br from-blue-500/20 to-blue-400/10 border-blue-400/50', requiresTime: true },
  annual_vacation_regular: { label: 'إجازة 🌴', color: 'bg-gradient-to-br from-green-500/20 to-green-400/10 border-green-400/50', requiresTime: false },
  annual_vacation_normal: { label: 'إجازة سنوية 📅', color: 'bg-gradient-to-br from-green-500/20 to-green-400/10 border-green-400/50', requiresTime: false },
  annual_vacation_emergency: { label: 'إجازة طارئة 🚨', color: 'bg-gradient-to-br from-orange-500/20 to-orange-400/10 border-orange-400/50', requiresTime: false },
  public_holiday: { label: 'عطلة رسمية 🎉', color: 'bg-gradient-to-br from-purple-500/20 to-purple-400/10 border-purple-400/50', requiresTime: false },
  exam_leave: { label: 'إجازة اختبارات 📝', color: 'bg-gradient-to-br from-indigo-500/20 to-indigo-400/10 border-indigo-400/50', requiresTime: false },
  sick_day: { label: 'إجازة مرضية 🤒', color: 'bg-gradient-to-br from-red-500/20 to-red-400/10 border-red-400/50', requiresTime: false },
};

interface ScheduleWithEmployee extends Schedule {
  employee?: Profile;
}

export default function ScheduleManagement() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [schedules, setSchedules] = useState<ScheduleWithEmployee[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [draggedEmployee, setDraggedEmployee] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithEmployee | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [createShiftData, setCreateShiftData] = useState<{ employee: Profile; date: Date } | null>(null);
  const [resetting, setResetting] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    status: 'working' as ShiftStatus,
    start_time: '09:00',
    end_time: '18:00',
    notes: '',
    tasks: [] as TaskType[],
  });

  // Form state for creating
  const [createForm, setCreateForm] = useState({
    status: 'working' as ShiftStatus,
    start_time: '09:00',
    end_time: '18:00',
    notes: '',
    tasks: [] as TaskType[],
  });

  // Quick assign form
  const [quickAssignForm, setQuickAssignForm] = useState({
    status: 'working' as ShiftStatus,
    start_time: '09:00',
    end_time: '18:00',
    date: format(currentWeekStart, 'yyyy-MM-dd'),
    tasks: [] as TaskType[],
  });

  useEffect(() => {
    if (profile?.role !== 'admin') {
      toast.error('ما عندك صلاحية يا خوي! لازم تكون مدير 🚫');
      navigate('/');
      return;
    }
    loadData();
  }, [profile, navigate, currentWeekStart]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, schedulesData] = await Promise.all([
        getEmployeesWithPositions(),
        getSchedulesByWeek(currentWeekStart),
      ]);
      
      // Filter: active users, not guests, and schedulable only
      const filteredEmployees = employeesData.filter(e => {
        return e.status === 'active' && e.role !== 'guest' && e.is_schedulable === true;
      });
      
      console.log('[Admin] 📊 Total employees:', employeesData.length);
      console.log('[Admin] 📊 Schedulable employees:', filteredEmployees.length);
      setEmployees(filteredEmployees);
      setSchedules(schedulesData);
    } catch (error) {
      toast.error('ما قدرنا نحمل البيانات يا خوي 😅');
    } finally {
      setLoading(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || emp.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Get week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Get schedule for specific employee and day
  const getScheduleForDay = (employeeId: string, date: Date) => {
    return schedules.find(s => 
      s.user_id === employeeId && 
      isSameDay(new Date(s.shift_date), date)
    );
  };

  // Calculate weekly summary
  const weeklySummary = {
    totalShifts: schedules.filter(s => s.status === 'working' || s.status === 'work_from_home').length,
    employeesScheduled: new Set(schedules.map(s => s.user_id)).size,
    unassignedEmployees: employees.length - new Set(schedules.map(s => s.user_id)).size,
    offDays: schedules.filter(s => s.status === 'off').length,
  };

  // Auto-save function with visual feedback
  const autoSave = async (scheduleId: string, updates: Partial<Schedule>) => {
    setSavingStates(prev => ({ ...prev, [scheduleId]: true }));
    
    try {
      await updateSchedule(scheduleId, updates);
      
      // Update local state
      setSchedules(prev => prev.map(s => 
        s.id === scheduleId ? { ...s, ...updates } : s
      ));
      
      // Show subtle success feedback
      toast.success('تمام! انحفظ 💾', { duration: 1000 });
    } catch (error) {
      toast.error('ما قدرنا نحفظ التعديلات يا خوي 😔');
    } finally {
      setTimeout(() => {
        setSavingStates(prev => ({ ...prev, [scheduleId]: false }));
      }, 500);
    }
  };

  // Handle drag start
  const handleDragStart = (employee: Profile) => {
    setDraggedEmployee(employee);
  };

  // Handle drop on calendar cell
  const handleDrop = async (date: Date) => {
    if (!draggedEmployee || !profile) return;

    const existingSchedule = getScheduleForDay(draggedEmployee.id, date);
    if (existingSchedule) {
      toast.error('الموظف عنده شفت في هاليوم يا خوي! 📅');
      setDraggedEmployee(null);
      return;
    }

    try {
      const newSchedule = await createSchedule({
        user_id: draggedEmployee.id,
        shift_date: format(date, 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '18:00',
        status: 'working',
        notes: null,
        tasks: [],
        created_by: profile.id,
      });

      setSchedules(prev => [...prev, { ...newSchedule, employee: draggedEmployee }]);
      toast.success(`تمام! انجدول ${draggedEmployee.full_name} ✅`);
    } catch (error) {
      toast.error('ما قدرنا نسوي الشفت يا خوي 😔');
    }

    setDraggedEmployee(null);
  };

  // Handle edit schedule
  const handleEditSchedule = (schedule: ScheduleWithEmployee) => {
    setSelectedSchedule(schedule);
    setEditForm({
      status: schedule.status,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      notes: schedule.notes || '',
      tasks: schedule.tasks || [],
    });
    setEditDialogOpen(true);
  };

  // Handle click on empty cell to create shift
  const handleCreateShift = (employee: Profile, date: Date) => {
    const existingSchedule = getScheduleForDay(employee.id, date);
    if (existingSchedule) {
      // If shift exists, edit it instead
      handleEditSchedule(existingSchedule);
      return;
    }

    // Open create dialog
    setCreateShiftData({ employee, date });
    setCreateForm({
      status: 'working',
      start_time: '09:00',
      end_time: '18:00',
      notes: '',
      tasks: [],
    });
    setCreateDialogOpen(true);
  };

  // Save new shift
  const handleSaveCreate = async () => {
    if (!createShiftData || !profile) return;

    try {
      const newSchedule = await createSchedule({
        user_id: createShiftData.employee.id,
        shift_date: format(createShiftData.date, 'yyyy-MM-dd'),
        start_time: createForm.start_time,
        end_time: createForm.end_time,
        status: createForm.status,
        notes: createForm.notes || null,
        tasks: createForm.tasks,
        created_by: profile.id,
      });

      setSchedules(prev => [...prev, { ...newSchedule, employee: createShiftData.employee }]);
      toast.success(`تمام! انسوى شفت لـ ${createShiftData.employee.full_name} ✨`);
      setCreateDialogOpen(false);
      setCreateShiftData(null);
    } catch (error) {
      toast.error('ما قدرنا نسوي الشفت يا خوي 😔');
    }
  };

  // Save edited schedule
  const handleSaveEdit = async () => {
    if (!selectedSchedule) return;

    await autoSave(selectedSchedule.id, editForm);
    setEditDialogOpen(false);
    setSelectedSchedule(null);
  };

  // Delete schedule
  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId);
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      toast.success('تمام! انحذف الشفت 🗑️');
      setEditDialogOpen(false);
    } catch (error) {
      toast.error('ما قدرنا نحذف الشفت يا خوي 😔');
    }
  };

  // Quick assign to multiple employees
  const handleQuickAssign = async () => {
    if (selectedEmployees.length === 0 || !profile) {
      toast.error('لازم تختار موظف واحد على الأقل يا خوي! 👥');
      return;
    }

    try {
      const promises = selectedEmployees.map(async (empId) => {
        const existingSchedule = getScheduleForDay(empId, new Date(quickAssignForm.date));
        if (existingSchedule) return null;

        return createSchedule({
          user_id: empId,
          shift_date: quickAssignForm.date,
          start_time: quickAssignForm.start_time,
          end_time: quickAssignForm.end_time,
          status: quickAssignForm.status,
          notes: null,
          tasks: quickAssignForm.tasks,
          created_by: profile.id,
        });
      });

      const results = await Promise.all(promises);
      const newSchedules = results.filter(Boolean) as Schedule[];
      
      setSchedules(prev => [...prev, ...newSchedules]);
      toast.success(`تمام! وزعنا شفتات على ${newSchedules.length} موظف ⚡`);
      setQuickAssignOpen(false);
      setSelectedEmployees([]);
    } catch (error) {
      toast.error('ما قدرنا نوزع الشفتات يا خوي 😔');
    }
  };

  const handleResetAllSchedules = async () => {
    try {
      setResetting(true);
      const result = await resetAllSchedules();
      
      toast.success(result.message);
      setResetDialogOpen(false);
      
      // Reload schedules
      await loadData();
    } catch (error) {
      console.error('Reset schedules error:', error);
      toast.error(error instanceof Error ? error.message : 'ما قدرنا نمسح الجدول يا خوي 😔');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                لوحة تحكم الجدول 📅
              </h1>
              <p className="text-sm text-muted-foreground mt-1">إدارة الموظفين والشفتات يا خوي</p>
            </div>

            {/* التنقل بين الأسابيع */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                className="hover:bg-accent/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center min-w-[200px]">
                <div className="font-semibold text-lg">
                  {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
                </div>
                <div className="text-xs text-muted-foreground">عرض الأسبوع</div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                className="hover:bg-accent/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
                className="hover:bg-accent/10"
              >
                اليوم
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setQuickAssignOpen(true)}
                className="bg-gradient-to-r from-accent to-primary hover:opacity-90"
              >
                <Zap className="mr-2 h-4 w-4" />
                توزيع سريع ⚡
              </Button>

              <Button
                onClick={() => setResetDialogOpen(true)}
                variant="destructive"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                مسح كل الجدول 🔄
              </Button>
            </div>
          </div>

          {/* ملخص الأسبوع */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مجموع الشفتات</p>
                    <p className="text-2xl font-bold">{weeklySummary.totalShifts}</p>
                  </div>
                  <Clock className="h-8 w-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مجدولين ✅</p>
                    <p className="text-2xl font-bold">{weeklySummary.employeesScheduled}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ما انجدولوا ⚠️</p>
                    <p className="text-2xl font-bold">{weeklySummary.unassignedEmployees}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">التغطية 📊</p>
                    <p className="text-2xl font-bold">
                      {employees.length > 0 ? Math.round((weeklySummary.employeesScheduled / employees.length) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي - واجهة التبويبات */}
      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              الجدول 📅
            </TabsTrigger>
            <TabsTrigger value="eligibility" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              الأهلية 👥
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              التحليلات 📊
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-0">
            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-380px)]">
          {/* اللوحة اليسرى - قائمة الموظفين */}
          <div className="col-span-3 flex flex-col gap-4">
            <Card className="flex-1 flex flex-col backdrop-blur-xl bg-card/50 border-border/50 shadow-xl">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  الموظفين ({filteredEmployees.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
                {/* البحث والفلترة */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="دور على موظف..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="فلتر حسب الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأدوار</SelectItem>
                      <SelectItem value="admin">مدير</SelectItem>
                      <SelectItem value="writer">كاتب</SelectItem>
                      <SelectItem value="employee">موظف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* قائمة الموظفين */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      draggable
                      onDragStart={() => handleDragStart(employee)}
                      className={cn(
                        "p-3 rounded-lg border cursor-move transition-all hover:shadow-lg hover:scale-[1.02]",
                        "bg-gradient-to-br from-card to-card/50 border-border/50",
                        "hover:border-accent/50 hover:bg-accent/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-semibold">
                          {employee.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{employee.full_name || 'Unknown'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {employee.role}
                            </Badge>
                            {employee.position && (
                              <Badge variant="secondary" className="text-xs">
                                {employee.position}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* اللوحة اليمنى - شبكة التقويم */}
          <div className="col-span-9 flex flex-col">
            <Card className="flex-1 backdrop-blur-xl bg-card/50 border-border/50 shadow-xl overflow-hidden">
              <CardContent className="p-6 h-full flex-col">
                {/* رأس التقويم */}
                <div className="grid grid-cols-7 gap-4 mb-4">
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className="text-center p-3 rounded-lg bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50"
                    >
                      <div className="font-semibold text-sm">{format(day, 'EEE')}</div>
                      <div className="text-2xl font-bold mt-1">{format(day, 'd')}</div>
                      <div className="text-xs text-muted-foreground">{format(day, 'MMM')}</div>
                    </div>
                  ))}
                </div>

                {/* شبكة التقويم */}
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-3">
                    {filteredEmployees.map((employee) => (
                      <div key={employee.id} className="grid grid-cols-7 gap-4">
                        {weekDays.map((day) => {
                          const schedule = getScheduleForDay(employee.id, day);
                          const isSaving = schedule && savingStates[schedule.id];

                          return (
                            <div
                              key={`${employee.id}-${day.toISOString()}`}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleDrop(day)}
                              onClick={() => handleCreateShift(employee, day)}
                              className={cn(
                                "min-h-[80px] p-3 rounded-lg border-2 transition-all",
                                schedule
                                  ? cn(
                                      "border-solid cursor-pointer hover:shadow-lg hover:scale-[1.02]",
                                      STATUS_CONFIG[schedule.status].color
                                    )
                                  : "border-dashed border-border/30 hover:border-accent/50 hover:bg-accent/5 cursor-pointer"
                              )}
                            >
                              {schedule ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs">
                                      {STATUS_CONFIG[schedule.status].label}
                                    </Badge>
                                    {isSaving && (
                                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    )}
                                  </div>
                                  {STATUS_CONFIG[schedule.status].requiresTime && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>{schedule.start_time} - {schedule.end_time}</span>
                                    </div>
                                  )}
                                  <div className="text-xs font-medium truncate">
                                    {employee.full_name}
                                  </div>
                                  {schedule.tasks && schedule.tasks.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {schedule.tasks.map((task) => (
                                        <TaskTag key={task} task={task} size="xs" />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                                  <Calendar className="h-4 w-4 mb-1" />
                                  <span className="text-xs">اضغط للإضافة</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="eligibility" className="mt-0">
            <ScheduleEligibility />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <TaskAnalytics
              startDate={format(currentWeekStart, 'yyyy-MM-dd')}
              endDate={format(addDays(currentWeekStart, 6), 'yyyy-MM-dd')}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* حوار تعديل الشفت */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تعديل الشفت ✏️</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value as ShiftStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {STATUS_CONFIG[editForm.status].requiresTime && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>وقت البداية ⏰</Label>
                  <Input
                    type="time"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>وقت النهاية ⏱️</Label>
                  <Input
                    type="time"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>المهام المحددة 📋</Label>
              <TaskMultiSelect
                value={editForm.tasks}
                onChange={(tasks) => setEditForm({ ...editForm, tasks })}
                placeholder="اختر المهام للشفت..."
              />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات (اختياري) 📝</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="اكتب ملاحظات..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => selectedSchedule && handleDeleteSchedule(selectedSchedule.id)}
              className="mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              احذف 🗑️
            </Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveEdit}>
              حفظ التعديلات 💾
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار إنشاء شفت */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>سوي شفت جديد ➕</DialogTitle>
            {createShiftData && (
              <p className="text-sm text-muted-foreground mt-2">
                {createShiftData.employee.full_name} - {format(createShiftData.date, 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select
                value={createForm.status}
                onValueChange={(value) => setCreateForm({ ...createForm, status: value as ShiftStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {STATUS_CONFIG[createForm.status].requiresTime && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>وقت البداية ⏰</Label>
                  <Input
                    type="time"
                    value={createForm.start_time}
                    onChange={(e) => setCreateForm({ ...createForm, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>وقت النهاية ⏱️</Label>
                  <Input
                    type="time"
                    value={createForm.end_time}
                    onChange={(e) => setCreateForm({ ...createForm, end_time: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>المهام المحددة 📋</Label>
              <TaskMultiSelect
                value={createForm.tasks}
                onChange={(tasks) => setCreateForm({ ...createForm, tasks })}
                placeholder="اختر المهام للشفت..."
              />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات (اختياري) 📝</Label>
              <Input
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder="اكتب ملاحظات..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveCreate}>
              سوي الشفت ✨
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار التوزيع السريع */}
      <Dialog open={quickAssignOpen} onOpenChange={setQuickAssignOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              وضع التوزيع السريع ⚡
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التاريخ 📅</Label>
                <Input
                  type="date"
                  value={quickAssignForm.date}
                  onChange={(e) => setQuickAssignForm({ ...quickAssignForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={quickAssignForm.status}
                  onValueChange={(value) => setQuickAssignForm({ ...quickAssignForm, status: value as ShiftStatus })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {STATUS_CONFIG[quickAssignForm.status].requiresTime && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>وقت البداية ⏰</Label>
                  <Input
                    type="time"
                    value={quickAssignForm.start_time}
                    onChange={(e) => setQuickAssignForm({ ...quickAssignForm, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>وقت النهاية ⏱️</Label>
                  <Input
                    type="time"
                    value={quickAssignForm.end_time}
                    onChange={(e) => setQuickAssignForm({ ...quickAssignForm, end_time: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>المهام المحددة 📋</Label>
              <TaskMultiSelect
                value={quickAssignForm.tasks}
                onChange={(tasks) => setQuickAssignForm({ ...quickAssignForm, tasks })}
                placeholder="اختر المهام لهالشفتات..."
              />
            </div>

            <div className="space-y-2">
              <Label>اختر الموظفين ({selectedEmployees.length} محددين) 👥</Label>
              <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={employee.id}
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEmployees([...selectedEmployees, employee.id]);
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={employee.id}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {employee.full_name} - {employee.role}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickAssignOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleQuickAssign} disabled={selectedEmployees.length === 0}>
              وزع على {selectedEmployees.length} موظف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار تأكيد مسح كل الجدول */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              تمسح كل الجدول؟ 🔄
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                هالإجراء بيمسح كل الشفتات من النظام نهائياً يا خوي!
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-destructive">⚠️ تحذير: ما تقدر ترجعها!</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>كل جداول الموظفين بتنحذف</li>
                  <li>كل توزيعات الشفتات بتنمسح</li>
                  <li>هذا يأثر على كل الموظفين وكل التواريخ</li>
                  <li>لازم تسوي الجداول من جديد يدوياً</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                متأكد 100% تبي تكمل؟
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetAllSchedules}
              disabled={resetting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {resetting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري المسح...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  أيوه، امسح كل شي 🔄
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
