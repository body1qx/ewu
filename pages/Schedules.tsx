import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Clock, Calendar, Users } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isToday } from 'date-fns';
import { getSchedulesByWeek, getAllProfiles } from '@/db/api';
import { Schedule, Profile } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  working: { label: 'شغال 💼', color: 'bg-accent/20 text-accent border-accent' },
  off: { label: 'راحة 😴', color: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500' },
  work_from_home: { label: 'شغل من البيت 🏠', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500' },
  annual_vacation_regular: { label: 'إجازة سنوية 🏖', color: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500' },
  annual_vacation_normal: { label: 'إجازة عادية 😎', color: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500' },
  annual_vacation_emergency: { label: 'إجازة طارئة 🚨', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500' },
  public_holiday: { label: 'عطلة رسمية 🎉', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500' },
  exam_leave: { label: 'إجازة اختبارات 📚', color: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500' },
  sick_day: { label: 'مريض (الله يشفيه) 🤒', color: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500' },
};

const TASK_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  Call: { label: 'مكالمات', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500', icon: '📞' },
  'Live Chat': { label: 'شات مباشر', color: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500', icon: '💬' },
  WhatsApp: { label: 'واتساب', color: 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500', icon: '📱' },
  Partoo: { label: 'بارتو', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500', icon: '⭐' },
  Social: { label: 'سوشال ميديا', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500', icon: '📱' },
};

export default function Schedules() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 }) // 0 = Sunday
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

  // Load data
  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesData, employeesData] = await Promise.all([
        getSchedulesByWeek(currentWeekStart),
        getAllProfiles(),
      ]);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      // Filter: active users, not guests, and schedulable only
      setEmployees(
        Array.isArray(employeesData) 
          ? employeesData.filter(e => 
              e.status === 'active' && 
              e.role !== 'guest' && 
              e.is_schedulable === true
            ) 
          : []
      );
    } catch (error) {
      console.error('Error loading schedules:', error);
      setSchedules([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToThisWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  // Get week days
  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  };

  // Get my schedule for the week
  const getMyWeekSchedule = () => {
    if (!profile) return [];
    const days = getWeekDays();
    return days.map((date) => {
      const schedule = schedules.find(
        (s) =>
          s.user_id === profile.id &&
          format(new Date(s.shift_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return { date, schedule: schedule || null };
    });
  };

  // Get team schedule (all employees for the week)
  const getTeamSchedule = () => {
    const days = getWeekDays();
    return employees.map((employee) => {
      const employeeSchedules = days.map((date) => {
        const schedule = schedules.find(
          (s) =>
            s.user_id === employee.id &&
            format(new Date(s.shift_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        return { date, schedule: schedule || null };
      });
      return { employee, schedules: employeeSchedules };
    });
  };

  // Check if current week
  const isCurrentWeek = () => {
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    return format(currentWeekStart, 'yyyy-MM-dd') === format(thisWeekStart, 'yyyy-MM-dd');
  };

  // Render status badge
  const renderStatusBadge = (status: string, startTime?: string, endTime?: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.working;
    const requiresTime = status === 'working' || status === 'work_from_home';

    return (
      <Badge className={`${config.color} border text-xs`}>
        {config.label}
        {requiresTime && startTime && endTime && ` · ${startTime} – ${endTime}`}
      </Badge>
    );
  };

  // Render task badges
  const renderTaskBadges = (tasks?: string[]) => {
    if (!tasks || tasks.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {tasks.map((task) => {
          const config = TASK_CONFIG[task];
          if (!config) return null;
          return (
            <Badge
              key={task}
              className={`${config.color} border text-xs px-1.5 py-0.5`}
              title={config.label}
            >
              {config.icon} {config.label}
            </Badge>
          );
        })}
      </div>
    );
  };

  if (!profile) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('schedules.title')}</h1>
        <p className="text-muted-foreground">{t('schedules.subtitle')}</p>
      </div>

      {/* Week Selector */}
      <Card className="mb-6 shadow-elegant">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="font-semibold">
                  {isCurrentWeek() ? t('schedules.thisWeek') : format(currentWeekStart, 'MMM d')} –{' '}
                  {format(weekEnd, 'MMM d, yyyy')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('schedules.shiftInfo')}
                </div>
              </div>

              {!isCurrentWeek() && (
                <Button variant="outline" size="sm" onClick={goToThisWeek}>
                  {t('schedules.thisWeek')}
                </Button>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Team Schedule and My Schedule */}
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('schedules.teamSchedule')}
          </TabsTrigger>
          <TabsTrigger value="my" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('schedules.mySchedule')}
          </TabsTrigger>
        </TabsList>

        {/* Team Schedule Tab */}
        <TabsContent value="team">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full bg-muted" />
              ))}
            </div>
          )}

          {!loading && (
            <div className="space-y-6">
              {/* Team Schedule Table */}
              <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-8 gap-4 mb-4 px-3">
                    <div className="font-semibold text-base">{t('schedules.employee')}</div>
                    {getWeekDays().map((date) => (
                      <div key={format(date, 'yyyy-MM-dd')} className="text-center">
                        <div className={`font-semibold text-base ${isToday(date) ? 'text-accent' : ''}`}>
                          {format(date, 'EEE')}
                        </div>
                        <div className="text-sm text-muted-foreground">{format(date, 'MMM d')}</div>
                      </div>
                    ))}
                  </div>

                  {/* Employee Rows */}
                  {getTeamSchedule().map(({ employee, schedules: employeeSchedules }) => (
                    <Card key={employee.id} className="mb-4 shadow-elegant hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-8 gap-4 items-start">
                          <div className="font-semibold text-base truncate pt-3" title={employee.full_name}>
                            {employee.full_name}
                          </div>
                          {employeeSchedules.map(({ date, schedule }) => (
                            <div
                              key={format(date, 'yyyy-MM-dd')}
                              className={`min-h-[80px] p-3 rounded-lg flex flex-col items-center justify-start gap-2 transition-all ${
                                isToday(date) 
                                  ? 'bg-accent/10 border-2 border-accent/50 shadow-sm' 
                                  : 'bg-muted/30 hover:bg-muted/50'
                              }`}
                            >
                              {schedule ? (
                                <>
                                  {/* Status and Time Display */}
                                  {schedule.status === 'working' || schedule.status === 'work_from_home' ? (
                                    <div className="flex flex-col items-center gap-1 w-full">
                                      <div className="text-sm font-bold text-foreground">
                                        {schedule.start_time?.slice(0,5) || '09:00'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{t('schedules.to')}</div>
                                      <div className="text-sm font-bold text-foreground">
                                        {schedule.end_time?.slice(0,5) || '18:00'}
                                      </div>
                                    </div>
                                  ) : (
                                    <Badge 
                                      className={`${STATUS_CONFIG[schedule.status]?.color || STATUS_CONFIG.off.color} border text-xs px-2 py-1 font-medium`}
                                    >
                                      {STATUS_CONFIG[schedule.status]?.label || t('schedules.off')}
                                    </Badge>
                                  )}
                                  
                                  {/* Task Icons Row */}
                                  {schedule.tasks && schedule.tasks.length > 0 && (
                                    <div className="flex flex-wrap gap-1 justify-center w-full mt-1">
                                      {schedule.tasks.map((task) => {
                                        const config = TASK_CONFIG[task];
                                        if (!config) return null;
                                        return (
                                          <div
                                            key={task}
                                            className={`${config.color} border rounded-md px-1.5 py-0.5 text-sm font-medium transition-transform hover:scale-110`}
                                            title={config.label}
                                          >
                                            {config.icon}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Badge variant="outline" className="opacity-40 text-sm px-3 py-1">
                                    —
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-elegant">
                  <CardContent className="p-4">
                    <div className="text-sm font-semibold mb-3">Status Legend</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <Badge key={key} className={`${config.color} border text-xs`}>
                          {config.label}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-elegant">
                  <CardContent className="p-4">
                    <div className="text-sm font-semibold mb-3">Task Types</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(TASK_CONFIG).map(([key, config]) => (
                        <Badge key={key} className={`${config.color} border text-xs`}>
                          {config.icon} {config.label}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* My Schedule Tab */}
        <TabsContent value="my">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full bg-muted" />
              ))}
            </div>
          )}

          {!loading && (
            <div className="space-y-4">
              {getMyWeekSchedule().map(({ date, schedule }) => {
                const dayName = format(date, 'EEEE');
                const dateStr = format(date, 'MMM d');
                const isTodayDate = isToday(date);

                return (
                  <Card
                    key={format(date, 'yyyy-MM-dd')}
                    className={`shadow-elegant transition-all hover:shadow-lg ${
                      isTodayDate ? 'border-accent border-2' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-semibold text-lg">
                                {isTodayDate && (
                                  <span className="text-accent mr-2">Today ·</span>
                                )}
                                {dayName}, {dateStr}
                              </div>
                            </div>
                          </div>

                          {schedule ? (
                            <div className="space-y-2 ml-8">
                              {(schedule.status === 'working' ||
                                schedule.status === 'work_from_home') && schedule.start_time && schedule.end_time && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Shift: {schedule.start_time} – {schedule.end_time}
                                  </span>
                                </div>
                              )}
                              <div>
                                {renderStatusBadge(
                                  schedule.status,
                                  schedule.start_time,
                                  schedule.end_time
                                )}
                              </div>
                              {schedule.tasks && schedule.tasks.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-muted-foreground">Assigned Tasks:</div>
                                  <div className="flex flex-wrap gap-2">
                                    {schedule.tasks.map((task) => {
                                      const config = TASK_CONFIG[task];
                                      if (!config) return null;
                                      return (
                                        <Badge
                                          key={task}
                                          className={`${config.color} border text-xs`}
                                        >
                                          {config.icon} {config.label}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="ml-8">
                              <Badge variant="outline" className="opacity-50">
                                Not Scheduled
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Legend */}
              <Card className="shadow-elegant mt-8">
                <CardContent className="p-4">
                  <div className="text-sm font-semibold mb-3">Status Legend</div>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <Badge key={key} className={`${config.color} border`}>
                        {config.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
