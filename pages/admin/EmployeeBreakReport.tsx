import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getDetailedBreakReport, getAllProfiles } from '@/db/api';
import { Download, Filter, RefreshCw, AlertTriangle, Clock, Coffee, Users, FileSpreadsheet } from 'lucide-react';
import type { DetailedBreakReportRow, Profile } from '@/types/types';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';

interface EmployeeSummary {
  user_id: string;
  full_name: string;
  role: string;
  team: string | null;
  breaks: DetailedBreakReportRow[];
  total_normal_breaks: number;
  total_meeting_breaks: number;
  time_exceeded: number;
  has_exceeded_limit: boolean;
  break_count: number;
}

export default function EmployeeBreakReport() {
  const { t } = useTranslation();
  const [reportData, setReportData] = useState<DetailedBreakReportRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProfiles();
    fetchReport();
  }, []);

  const fetchProfiles = async () => {
    try {
      const data = await getAllProfiles();
      setProfiles(data.filter(p => p.status === 'active'));
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getDetailedBreakReport(
        selectedDate,
        selectedUser === 'all' ? undefined : selectedUser
      );
      setReportData(data);
    } catch (error: any) {
      console.error('Failed to fetch detailed break report:', error);
      
      let errorMessage = 'Failed to fetch report';
      if (error.message?.includes('Access denied')) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const groupByEmployee = (): EmployeeSummary[] => {
    const grouped = new Map<string, EmployeeSummary>();

    reportData.forEach(row => {
      if (!grouped.has(row.user_id)) {
        grouped.set(row.user_id, {
          user_id: row.user_id,
          full_name: row.full_name,
          role: row.role,
          team: row.team,
          breaks: [],
          total_normal_breaks: row.total_normal_breaks,
          total_meeting_breaks: row.total_meeting_breaks,
          time_exceeded: row.time_exceeded,
          has_exceeded_limit: row.has_exceeded_limit,
          break_count: row.break_count,
        });
      }
      
      if (row.break_id) {
        grouped.get(row.user_id)!.breaks.push(row);
      }
    });

    return Array.from(grouped.values()).sort((a, b) => 
      a.full_name.localeCompare(b.full_name)
    );
  };

  const toggleEmployee = (userId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedEmployees(newExpanded);
  };

  const getBreakTypeBadge = (type: string | null) => {
    if (!type) return null;
    
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      normal: { variant: 'default', icon: Coffee },
      prayer: { variant: 'secondary', icon: Clock },
      technical: { variant: 'destructive', icon: AlertTriangle },
      meeting: { variant: 'outline', icon: Users },
      auto_idle: { variant: 'destructive', icon: AlertTriangle },
    };

    const config = variants[type] || { variant: 'default' as const, icon: Coffee };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const employeeSummaries = groupByEmployee();
    const exportData: any[] = [];

    employeeSummaries.forEach(emp => {
      exportData.push({
        'Employee Name': emp.full_name,
        'Role': emp.role,
        'Team': emp.team || 'N/A',
        'Total Breaks': emp.break_count,
        'Normal Break Time (min)': emp.total_normal_breaks.toFixed(2),
        'Meeting Break Time (min)': emp.total_meeting_breaks.toFixed(2),
        'Time Exceeded (min)': emp.time_exceeded.toFixed(2),
        'Exceeded Limit': emp.has_exceeded_limit ? 'Yes' : 'No',
        '': '',
      });

      emp.breaks.forEach((brk, idx) => {
        exportData.push({
          'Employee Name': idx === 0 ? '  Break Details:' : '',
          'Role': '',
          'Team': '',
          'Total Breaks': '',
          'Normal Break Time (min)': brk.break_type || 'N/A',
          'Meeting Break Time (min)': brk.start_time ? format(parseISO(brk.start_time), 'HH:mm:ss') : 'N/A',
          'Time Exceeded (min)': brk.end_time ? format(parseISO(brk.end_time), 'HH:mm:ss') : 'Ongoing',
          'Exceeded Limit': brk.duration_minutes?.toFixed(2) || 'N/A',
          '': brk.notes || '',
        });
      });

      exportData.push({
        'Employee Name': '',
        'Role': '',
        'Team': '',
        'Total Breaks': '',
        'Normal Break Time (min)': '',
        'Meeting Break Time (min)': '',
        'Time Exceeded (min)': '',
        'Exceeded Limit': '',
        '': '',
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Break Report');
    
    const fileName = `break_report_${selectedDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Report exported successfully');
  };

  const employeeSummaries = groupByEmployee();
  const totalEmployees = employeeSummaries.length;
  const employeesExceeded = employeeSummaries.filter(e => e.has_exceeded_limit).length;
  const totalBreaks = employeeSummaries.reduce((sum, e) => sum + e.break_count, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Break Time Report</h1>
          <p className="text-muted-foreground mt-1">
            Detailed break tracking with type breakdown and time exceeded calculations
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">with break records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Breaks</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBreaks}</div>
            <p className="text-xs text-muted-foreground">across all employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exceeded Limit</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{employeesExceeded}</div>
            <p className="text-xs text-muted-foreground">employees over 60 min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Report Date</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(parseISO(selectedDate), 'MMM dd')}</div>
            <p className="text-xs text-muted-foreground">{format(parseISO(selectedDate), 'yyyy')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter the break report by date and employee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Report Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={fetchReport} disabled={loading} className="flex-1">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Generate Report
              </Button>
              <Button onClick={handleExportExcel} variant="outline" disabled={loading || reportData.length === 0}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Break Details by Employee</CardTitle>
          <CardDescription>
            Click on an employee to view detailed break information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full bg-muted" />
              ))}
            </div>
          ) : employeeSummaries.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No break records found for the selected date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {employeeSummaries.map(employee => (
                <div key={employee.user_id} className="border rounded-lg overflow-hidden">
                  <div
                    className="p-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => toggleEmployee(employee.user_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{employee.full_name}</h3>
                          <Badge variant="outline">{employee.role}</Badge>
                          {employee.team && (
                            <Badge variant="secondary">{employee.team}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Coffee className="h-4 w-4" />
                            {employee.break_count} breaks
                          </span>
                          <span>Normal: {employee.total_normal_breaks.toFixed(0)} min</span>
                          <span>Meeting: {employee.total_meeting_breaks.toFixed(0)} min</span>
                          {employee.has_exceeded_limit && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Exceeded by {employee.time_exceeded.toFixed(0)} min
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        {expandedEmployees.has(employee.user_id) ? '▼' : '▶'}
                      </Button>
                    </div>
                  </div>

                  {expandedEmployees.has(employee.user_id) && (
                    <div className="p-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Break Type</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employee.breaks.map(brk => (
                            <TableRow key={brk.break_id}>
                              <TableCell>{getBreakTypeBadge(brk.break_type)}</TableCell>
                              <TableCell>
                                {brk.start_time ? format(parseISO(brk.start_time), 'HH:mm:ss') : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {brk.end_time ? (
                                  format(parseISO(brk.end_time), 'HH:mm:ss')
                                ) : (
                                  <Badge variant="outline">Ongoing</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {brk.duration_minutes ? (
                                  <span className={brk.duration_minutes > 30 && brk.break_type !== 'meeting' ? 'text-destructive font-semibold' : ''}>
                                    {brk.duration_minutes.toFixed(2)} min
                                  </span>
                                ) : (
                                  'N/A'
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {brk.source || 'manual'}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {brk.notes || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
