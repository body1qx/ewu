import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, ListChecks } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TaskStatistics, EmployeeTaskLoad, TaskType } from '@/types/types';
import { getTaskStatistics, getEmployeeTaskLoad } from '@/db/api';
import { TaskTag, TASK_COLORS } from './TaskMultiSelect';
import { cn } from '@/lib/utils';

interface TaskAnalyticsProps {
  startDate: string;
  endDate: string;
}

export function TaskAnalytics({ startDate, endDate }: TaskAnalyticsProps) {
  const [statistics, setStatistics] = useState<TaskStatistics[]>([]);
  const [employeeLoad, setEmployeeLoad] = useState<EmployeeTaskLoad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [startDate, endDate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [stats, load] = await Promise.all([
        getTaskStatistics(startDate, endDate),
        getEmployeeTaskLoad(startDate, endDate)
      ]);
      setStatistics(stats);
      setEmployeeLoad(load);
    } catch (error) {
      console.error('Error loading task analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAssignments = statistics.reduce((sum, stat) => sum + stat.total_assignments, 0);
  const totalEmployees = employeeLoad.length;
  const avgTasksPerEmployee = totalEmployees > 0
    ? (employeeLoad.reduce((sum, emp) => sum + emp.total_tasks, 0) / totalEmployees).toFixed(1)
    : '0';
  const topMultitasker = employeeLoad[0];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Assignments */}
        <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-400/30 p-6 hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/30 border border-blue-400/40">
              <ListChecks className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-400">{totalAssignments}</p>
              <p className="text-sm text-blue-400/70 mt-1">Total Tasks</p>
            </div>
          </div>
          <p className="text-xs text-white/70">Assigned in selected period</p>
        </Card>

        {/* Active Employees */}
        <Card className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-400/30 p-6 hover:scale-105 transition-all duration-300 shadow-lg shadow-green-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-500/30 border border-green-400/40">
              <Users className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-400">{totalEmployees}</p>
              <p className="text-sm text-green-400/70 mt-1">Active Agents</p>
            </div>
          </div>
          <p className="text-xs text-white/70">With task assignments</p>
        </Card>

        {/* Average Tasks */}
        <Card className="backdrop-blur-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border-2 border-amber-400/30 p-6 hover:scale-105 transition-all duration-300 shadow-lg shadow-amber-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-500/30 border border-amber-400/40">
              <BarChart3 className="h-6 w-6 text-amber-400" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-amber-400">{avgTasksPerEmployee}</p>
              <p className="text-sm text-amber-400/70 mt-1">Avg per Agent</p>
            </div>
          </div>
          <p className="text-xs text-white/70">Average task load</p>
        </Card>

        {/* Top Multitasker */}
        <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-400/30 p-6 hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500/30 border border-purple-400/40">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-400">{topMultitasker?.total_tasks || 0}</p>
              <p className="text-sm text-purple-400/70 mt-1">Top Load</p>
            </div>
          </div>
          <p className="text-xs text-white/70 truncate">
            {topMultitasker?.full_name || 'No data'}
          </p>
        </Card>
      </div>

      {/* Task Distribution */}
      <Card className="backdrop-blur-xl bg-white/5 border-2 border-white/10 p-6">
        <h3 className="text-xl font-bold text-amber-400 mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Task Distribution
        </h3>
        <div className="space-y-4">
          {statistics.map(stat => {
            const percentage = totalAssignments > 0
              ? (stat.total_assignments / totalAssignments) * 100
              : 0;
            const colors = TASK_COLORS[stat.task_name as TaskType];

            return (
              <div key={stat.task_name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TaskTag task={stat.task_name as TaskType} size="sm" showTooltip={false} />
                    <span className="text-sm text-white/70">
                      {stat.unique_employees} agent{stat.unique_employees !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">
                      {stat.total_assignments} assignments
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      colors.bg.replace('/20', '/40')
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top Multitaskers */}
      <Card className="backdrop-blur-xl bg-white/5 border-2 border-white/10 p-6">
        <h3 className="text-xl font-bold text-amber-400 mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Multitaskers
        </h3>
        <div className="space-y-3">
          {employeeLoad.slice(0, 5).map((emp, index) => (
            <div
              key={emp.user_id}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                  index === 0 && "bg-amber-500/30 text-amber-400 border-2 border-amber-400/40",
                  index === 1 && "bg-gray-400/30 text-gray-300 border-2 border-gray-400/40",
                  index === 2 && "bg-orange-500/30 text-orange-400 border-2 border-orange-400/40",
                  index > 2 && "bg-white/10 text-white/70"
                )}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-white">{emp.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {emp.total_shifts} shifts • {emp.avg_tasks_per_shift} avg tasks/shift
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-400">{emp.total_tasks}</p>
                <p className="text-xs text-muted-foreground">total tasks</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
