import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isToday } from 'date-fns';
import { getSchedulesByWeek, getAllProfiles } from '@/db/api';
import { Schedule, Profile } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  working: { label: 'Working', color: 'bg-accent/20 text-accent border-accent' },
  off: { label: 'Off', color: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500' },
  work_from_home: { label: 'Work From Home', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500' },
  annual_vacation_regular: { label: 'Annual Vacation', color: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500' },
  annual_vacation_normal: { label: 'Annual Leave', color: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500' },
  annual_vacation_emergency: { label: 'Emergency Leave', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500' },
  public_holiday: { label: 'Public Holiday', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500' },
  exam_leave: { label: 'Exam Leave', color: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500' },
  sick_day: { label: 'Sick Day', color: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500' },
};

const POSITION_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'CRM Agent', label: 'CRM Agent' },
  { value: 'CRM Quality', label: 'CRM Quality' },
  { value: 'CRM Team Leader', label: 'Team Leader' },
  { value: 'CRM Supervisor', label: 'CRM Supervisor' },
  { value: 'CRM Manager', label: 'CRM Manager' },
];

export default function Schedules() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 }) // 0 = Sunday
  );
  const [roleFilter, setRoleFilter] = useState('all');

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

  // Load data
  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesData, profilesData] = await Promise.all([
        getSchedulesByWeek(currentWeekStart),
        getAllProfiles(),
      ]);

      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      
      // Filter: active users, not guests, and schedulable only
      const filteredEmployees = Array.isArray(profilesData)
        ? profilesData.filter((p) => {
            return p.status === 'active' && p.role !== 'guest' && p.is_schedulable === true;
          })
        : [];
      
      console.log('📊 SCHEDULE FILTER RESULTS:');
      console.log('  Total profiles fetched:', profilesData?.length);
      console.log('  Schedulable employees (visible):', filteredEmployees.length);
      console.log('  Non-schedulable (hidden):', (profilesData?.length || 0) - filteredEmployees.length);
      setEmployees(filteredEmployees);
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

  // Get team schedule - show all employees
  const getTeamSchedule = () => {
    // Apply role filter only (no team filtering)
    const filtered = employees.filter(
      (emp) => roleFilter === 'all' || emp.position === roleFilter
    );

    return filtered.map((employee) => {
      const days = getWeekDays();
      const weekSchedule = days.map((date) => {
        const schedule = schedules.find(
          (s) =>
            s.user_id === employee.id &&
            format(new Date(s.shift_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        return schedule || null;
      });
      return { employee, weekSchedule };
    });
  };

  // Check if current week
  const isCurrentWeek = () => {
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    return format(currentWeekStart, 'yyyy-MM-dd') === format(thisWeekStart, 'yyyy-MM-dd');
  };

  // Format time for display
  const formatTime = (time: string) => {
    if (!time || time === '00:00') return '';
    return time;
  };

  // Render status badge
  const renderStatusBadge = (status: string, startTime?: string, endTime?: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.working;
    const requiresTime = status === 'working' || status === 'work_from_home';

    return (
      <Badge className={`${config.color} border`}>
        {config.label}
        {requiresTime && startTime && endTime && ` · ${startTime} – ${endTime}`}
      </Badge>
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
        <h1 className="text-3xl font-bold mb-2">Schedules</h1>
        <p className="text-muted-foreground">View your shifts and your team's schedule</p>
      </div>

      {/* Not Schedulable Message */}
      {profile && !profile.is_schedulable && (
        <Card className="mb-6 border-orange-500/50 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-orange-500/10">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  Not Currently Scheduled
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  You are currently not assigned to any schedules. Please contact your administrator if you believe this is an error.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Toggle */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg border bg-muted p-1">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'my'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Schedule
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'team'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Team Schedule
          </button>
        </div>
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
                  {isCurrentWeek() ? 'This Week' : format(currentWeekStart, 'MMM d')} –{' '}
                  {format(weekEnd, 'MMM d, yyyy')}
                </div>
                <div className="text-xs text-muted-foreground">
                  All shifts are 9 hours. Times shown in local time.
                </div>
              </div>

              {!isCurrentWeek() && (
                <Button variant="outline" size="sm" onClick={goToThisWeek}>
                  This Week
                </Button>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {/* My Schedule Tab */}
      {!loading && activeTab === 'my' && (
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
                            schedule.status === 'work_from_home') && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                Shift: {formatTime(schedule.start_time)} –{' '}
                                {formatTime(schedule.end_time)}
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

      {/* Team Schedule Tab */}
      {!loading && activeTab === 'team' && (
        <div>
          {/* Role Filter */}
          <div className="mb-6">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                {POSITION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Schedule Table */}
          <Card className="shadow-elegant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Employee</th>
                    <th className="text-left p-4 font-semibold">Role</th>
                    {getWeekDays().map((date) => (
                      <th
                        key={format(date, 'yyyy-MM-dd')}
                        className={`text-center p-4 font-semibold ${
                          isToday(date) ? 'bg-accent/10' : ''
                        }`}
                      >
                        <div>{format(date, 'EEE')}</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {format(date, 'MMM d')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getTeamSchedule().map(({ employee, weekSchedule }) => (
                    <tr key={employee.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{employee.full_name || employee.email}</div>
                        {employee.id === profile?.id && (
                          <Badge variant="outline" className="text-xs mt-1">You</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">{employee.position}</div>
                      </td>
                      {weekSchedule.map((schedule, index) => {
                        const date = getWeekDays()[index];
                        return (
                          <td
                            key={index}
                            className={`p-4 text-center ${isToday(date) ? 'bg-accent/5' : ''}`}
                          >
                            {schedule ? (
                              <div className="flex flex-col items-center gap-1">
                                {(schedule.status === 'working' ||
                                  schedule.status === 'work_from_home') && (
                                  <div className="text-xs font-medium">
                                    {formatTime(schedule.start_time)}–
                                    {formatTime(schedule.end_time)}
                                  </div>
                                )}
                                <Badge
                                  className={`text-xs ${
                                    STATUS_CONFIG[schedule.status]?.color ||
                                    STATUS_CONFIG.working.color
                                  } border`}
                                >
                                  {STATUS_CONFIG[schedule.status]?.label || 'Working'}
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs opacity-50">
                                —
                              </Badge>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {getTeamSchedule().length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        No employees found with the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
