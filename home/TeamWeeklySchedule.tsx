import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSchedulesByWeek, getAllProfiles, updateSchedule } from '@/db/api';
import { Schedule, Profile, ShiftStatus } from '@/types/types';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Users, Filter, Clock, Edit2 } from 'lucide-react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_CONFIG: Record<ShiftStatus, { label: string; color: string; bgColor: string }> = {
  working: { 
    label: 'Working', 
    color: 'text-amber-700 dark:text-amber-300', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/30 border-amber-500' 
  },
  off: { 
    label: 'OFF', 
    color: 'text-gray-700 dark:text-gray-300', 
    bgColor: 'bg-gray-100 dark:bg-gray-800/50 border-gray-500' 
  },
  work_from_home: { 
    label: 'WFH', 
    color: 'text-blue-700 dark:text-blue-300', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500' 
  },
  annual_vacation_regular: { 
    label: 'Vacation', 
    color: 'text-green-700 dark:text-green-300', 
    bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-500' 
  },
  annual_vacation_normal: { 
    label: 'Leave', 
    color: 'text-green-700 dark:text-green-300', 
    bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-500' 
  },
  annual_vacation_emergency: { 
    label: 'Emergency', 
    color: 'text-orange-700 dark:text-orange-300', 
    bgColor: 'bg-orange-100 dark:bg-orange-900/30 border-orange-500' 
  },
  public_holiday: { 
    label: 'Holiday', 
    color: 'text-purple-700 dark:text-purple-300', 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30 border-purple-500' 
  },
  exam_leave: { 
    label: 'Exam', 
    color: 'text-indigo-700 dark:text-indigo-300', 
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500' 
  },
  sick_day: { 
    label: 'Sick', 
    color: 'text-red-700 dark:text-red-300', 
    bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-500' 
  },
};

const POSITION_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'CRM Agent', label: 'CRM Agent' },
  { value: 'CRM Quality', label: 'CRM Quality' },
  { value: 'CRM Team Leader', label: 'Team Leader' },
  { value: 'CRM Supervisor', label: 'CRM Supervisor' },
  { value: 'CRM Manager', label: 'CRM Manager' },
];

interface EditDialogData {
  schedule: Schedule | null;
  employee: Profile;
  date: Date;
}

export default function TeamWeeklySchedule() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [roleFilter, setRoleFilter] = useState('all');
  const [nameFilter, setNameFilter] = useState('');
  const [editDialog, setEditDialog] = useState<EditDialogData | null>(null);
  const [editStatus, setEditStatus] = useState<ShiftStatus>('working');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('18:00');

  const isAdmin = profile?.role === 'admin';

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
      
      // Filter: active users with positions and schedulable only
      const filteredEmployees = Array.isArray(profilesData)
        ? profilesData.filter((p) => {
            return p.status === 'active' && 
                   p.position && 
                   p.position.trim() !== '' &&
                   p.is_schedulable === true;
          })
        : [];
      
      console.log('[TeamWeeklySchedule] 📊 Total profiles:', profilesData?.length);
      console.log('[TeamWeeklySchedule] 📊 Schedulable employees:', filteredEmployees.length);
      setEmployees(filteredEmployees);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setSchedules([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  };

  const getFilteredEmployees = () => {
    return employees.filter((emp) => {
      const matchesRole = roleFilter === 'all' || emp.position === roleFilter;
      const matchesName = nameFilter === '' || 
        emp.full_name?.toLowerCase().includes(nameFilter.toLowerCase()) ||
        emp.email?.toLowerCase().includes(nameFilter.toLowerCase());
      return matchesRole && matchesName;
    });
  };

  const getScheduleForEmployeeAndDate = (employeeId: string, date: Date): Schedule | null => {
    return schedules.find(
      (s) =>
        s.user_id === employeeId &&
        format(new Date(s.shift_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ) || null;
  };

  const handleCellClick = (employee: Profile, date: Date, schedule: Schedule | null) => {
    if (!isAdmin) return;
    
    setEditDialog({ schedule, employee, date });
    if (schedule) {
      setEditStatus(schedule.status);
      setEditStartTime(schedule.start_time || '09:00');
      setEditEndTime(schedule.end_time || '18:00');
    } else {
      setEditStatus('working');
      setEditStartTime('09:00');
      setEditEndTime('18:00');
    }
  };

  const handleSaveEdit = async () => {
    if (!editDialog || !profile) return;

    try {
      if (editDialog.schedule) {
        await updateSchedule(editDialog.schedule.id, {
          status: editStatus,
          start_time: editStatus === 'working' || editStatus === 'work_from_home' ? editStartTime : '00:00',
          end_time: editStatus === 'working' || editStatus === 'work_from_home' ? editEndTime : '00:00',
        });
        toast({
          title: 'Schedule Updated',
          description: 'The shift has been updated successfully.',
        });
      }
      setEditDialog(null);
      loadData();
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderScheduleCell = (employee: Profile, date: Date) => {
    const schedule = getScheduleForEmployeeAndDate(employee.id, date);
    const config = schedule ? STATUS_CONFIG[schedule.status] : null;
    const isCurrentUser = employee.id === profile?.id;
    const isTodayDate = isToday(date);

    return (
      <td
        key={format(date, 'yyyy-MM-dd')}
        className={`p-3 text-center border-l border-border transition-all ${
          isTodayDate ? 'bg-accent/5' : ''
        } ${isAdmin ? 'cursor-pointer hover:bg-muted/50' : ''}`}
        onClick={() => handleCellClick(employee, date, schedule)}
      >
        {schedule ? (
          <div className="space-y-1">
            <Badge className={`${config?.bgColor} ${config?.color} border text-xs`}>
              {config?.label}
            </Badge>
            {(schedule.status === 'working' || schedule.status === 'work_from_home') && 
             schedule.start_time && schedule.end_time && (
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                {schedule.start_time} - {schedule.end_time}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
    );
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Calendar className="h-10 w-10 text-accent" />
              Team Weekly Schedule
            </h2>
            <p className="text-muted-foreground">View your team's shifts for the week</p>
          </div>
        </div>
        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full bg-muted" />
          </CardContent>
        </Card>
      </section>
    );
  }

  const filteredEmployees = getFilteredEmployees();

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Calendar className="h-10 w-10 text-accent" />
              Team Weekly Schedule
            </h2>
            <p className="text-muted-foreground">View your team's shifts for the week</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
            >
              This Week
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="shadow-elegant">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex flex-col xl:flex-row xl:items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full xl:w-48">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{filteredEmployees.length} employees</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-4 font-semibold border-r border-border min-w-[200px]">
                      Employee
                    </th>
                    <th className="text-left p-4 font-semibold border-r border-border min-w-[120px]">
                      Role
                    </th>
                    {getWeekDays().map((date) => (
                      <th
                        key={format(date, 'yyyy-MM-dd')}
                        className={`text-center p-4 font-semibold border-l border-border min-w-[140px] ${
                          isToday(date) ? 'bg-accent/10' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{DAYS_OF_WEEK[date.getDay()]}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {format(date, 'MMM d')}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const isCurrentUser = employee.id === profile?.id;
                    return (
                      <tr
                        key={employee.id}
                        className={`border-t border-border transition-colors ${
                          isCurrentUser
                            ? 'bg-accent/5 hover:bg-accent/10'
                            : 'hover:bg-muted/30'
                        }`}
                      >
                        <td className="p-4 border-r border-border">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
                              {employee.full_name?.charAt(0) || employee.email?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-medium">
                                {employee.full_name || employee.email?.split('@')[0]}
                                {isCurrentUser && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    You
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{employee.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 border-r border-border">
                          <Badge variant="secondary" className="text-xs">
                            {employee.position}
                          </Badge>
                        </td>
                        {getWeekDays().map((date) => renderScheduleCell(employee, date))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredEmployees.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No employees found matching your filters.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            <span>Click on any cell to edit the schedule</span>
          </div>
        )}
      </section>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
          </DialogHeader>
          {editDialog && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Employee</Label>
                <p className="text-sm text-muted-foreground">
                  {editDialog.employee.full_name || editDialog.employee.email}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <p className="text-sm text-muted-foreground">
                  {format(editDialog.date, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={editStatus} onValueChange={(value) => setEditStatus(value as ShiftStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(editStatus === 'working' || editStatus === 'work_from_home') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
