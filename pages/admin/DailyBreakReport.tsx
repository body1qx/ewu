import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getDailyBreakReport, getAllProfiles, getLiveBreaks } from '@/db/api';
import { Download, Filter, RefreshCw, AlertTriangle, CheckCircle2, Clock, FileSpreadsheet } from 'lucide-react';
import type { DailyBreakReportRow, Profile } from '@/types/types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export default function DailyBreakReport() {
  const [reportData, setReportData] = useState<DailyBreakReportRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

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
      const data = await getDailyBreakReport(
        selectedDate,
        selectedUser === 'all' ? undefined : selectedUser,
        selectedTeam === 'all' ? undefined : selectedTeam
      );
      setReportData(data);
    } catch (error: any) {
      console.error('Failed to fetch daily break report:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to fetch report';
      if (error.message?.includes('Access denied')) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Report function not found. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Name',
      'Role',
      'Team',
      'Scheduled Start',
      'Scheduled End',
      'First Login',
      'Last Logout',
      'Late Login',
      'Late Minutes',
      'Early Logout',
      'Early Minutes',
      'Online Time (min)',
      'Normal Breaks (min)',
      'Meeting Breaks (min)',
      'Break Count',
      'Exceeded Limit',
      'Long Break',
    ];

    const rows = reportData.map(row => [
      row.full_name,
      row.role,
      row.team || 'N/A',
      row.scheduled_start || 'N/A',
      row.scheduled_end || 'N/A',
      row.first_login ? format(new Date(row.first_login), 'HH:mm:ss') : 'N/A',
      row.last_logout ? format(new Date(row.last_logout), 'HH:mm:ss') : 'N/A',
      row.is_late_login ? 'Yes' : 'No',
      row.late_login_minutes,
      row.is_early_logout ? 'Yes' : 'No',
      row.early_logout_minutes,
      Math.round(row.total_online_minutes),
      Math.round(row.normal_break_minutes),
      Math.round(row.meeting_break_minutes),
      row.break_count,
      row.exceeded_daily_limit ? 'Yes' : 'No',
      row.has_long_break ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `break_report_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report exported successfully');
  };

  const handleInstantExcelReport = async () => {
    try {
      toast.loading('Generating instant report...');
      
      // Fetch live breaks data
      const liveBreaks = await getLiveBreaks();
      
      if (liveBreaks.length === 0) {
        toast.dismiss();
        toast.info('No active breaks at the moment');
        return;
      }

      // Prepare data for Excel
      const excelData = liveBreaks.map(breakItem => ({
        'Employee Name': breakItem.full_name,
        'Employee ID': breakItem.user_id,
        'Role': breakItem.role,
        'Team': breakItem.team || 'N/A',
        'Position': breakItem.position || 'N/A',
        'Break Type': breakItem.break_type,
        'Start Time': format(new Date(breakItem.start_time), 'yyyy-MM-dd HH:mm:ss'),
        'Duration (minutes)': Math.floor(breakItem.duration_seconds / 60),
        'Duration (seconds)': breakItem.duration_seconds % 60,
        'Allowed Limit (min)': breakItem.allowed_limit_minutes,
        'Status': breakItem.is_overtime ? 'OVERTIME' : 'On Break',
        'Notes': breakItem.notes || 'N/A',
        'Created By': breakItem.created_by || 'Self',
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 25 }, // Employee Name
        { wch: 15 }, // Employee ID
        { wch: 12 }, // Role
        { wch: 15 }, // Team
        { wch: 20 }, // Position
        { wch: 15 }, // Break Type
        { wch: 20 }, // Start Time
        { wch: 18 }, // Duration (minutes)
        { wch: 18 }, // Duration (seconds)
        { wch: 18 }, // Allowed Limit
        { wch: 12 }, // Status
        { wch: 30 }, // Notes
        { wch: 15 }, // Created By
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Live Breaks');

      // Generate filename with timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const filename = `instant_break_report_${timestamp}.xlsx`;

      // Write and download file
      XLSX.writeFile(wb, filename);

      toast.dismiss();
      toast.success(`Instant report generated: ${liveBreaks.length} active breaks`);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to generate instant report');
      console.error('Instant report error:', error);
    }
  };

  const getStatusBadge = (row: DailyBreakReportRow) => {
    if (row.exceeded_daily_limit || row.has_long_break) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Violation</Badge>;
    }
    if (row.is_late_login || row.is_early_logout) {
      return <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"><AlertTriangle className="h-3 w-3" />Warning</Badge>;
    }
    return <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20"><CheckCircle2 className="h-3 w-3" />OK</Badge>;
  };

  const uniqueTeams = Array.from(new Set(profiles.map(p => p.team).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily Break & Attendance Report</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive break tracking and attendance monitoring
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filters
              </CardTitle>
              <CardDescription>Filter the report by date, user, or team</CardDescription>
            </div>
            <Button 
              onClick={handleInstantExcelReport} 
              variant="default"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Instant Excel Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger id="team">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
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
              <div className="flex gap-2">
                <Button onClick={fetchReport} disabled={loading} className="flex-1">
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Loading...' : 'Apply'}
                </Button>
                <Button onClick={handleExportCSV} variant="outline" disabled={reportData.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Report Data
          </CardTitle>
          <CardDescription>
            Showing {reportData.length} employee{reportData.length !== 1 ? 's' : ''} for {format(new Date(selectedDate), 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No data available for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>First Login</TableHead>
                    <TableHead>Last Logout</TableHead>
                    <TableHead>Late</TableHead>
                    <TableHead>Early</TableHead>
                    <TableHead>Online</TableHead>
                    <TableHead>Normal Breaks</TableHead>
                    <TableHead>Meetings</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell>{getStatusBadge(row)}</TableCell>
                      <TableCell className="font-medium">{row.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.role}</Badge>
                      </TableCell>
                      <TableCell>{row.team || 'N/A'}</TableCell>
                      <TableCell className="text-xs">
                        {row.scheduled_start && row.scheduled_end ? (
                          <div>
                            <div>{row.scheduled_start}</div>
                            <div className="text-muted-foreground">{row.scheduled_end}</div>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.first_login ? format(new Date(row.first_login), 'HH:mm:ss') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.last_logout ? format(new Date(row.last_logout), 'HH:mm:ss') : 'Active'}
                      </TableCell>
                      <TableCell>
                        {row.is_late_login ? (
                          <Badge variant="destructive" className="text-xs">
                            +{row.late_login_minutes}m
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.is_early_logout ? (
                          <Badge variant="destructive" className="text-xs">
                            -{row.early_logout_minutes}m
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {Math.round(row.total_online_minutes)}m
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            row.normal_break_minutes > 60
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : row.normal_break_minutes > 50
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }
                        >
                          {Math.round(row.normal_break_minutes)}m
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {Math.round(row.meeting_break_minutes)}m
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        {row.break_count}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {row.exceeded_daily_limit && (
                            <Badge variant="destructive" className="text-xs">Limit</Badge>
                          )}
                          {row.has_long_break && (
                            <Badge variant="destructive" className="text-xs">Long</Badge>
                          )}
                          {!row.exceeded_daily_limit && !row.has_long_break && (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
