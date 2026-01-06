import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getMyBreaksToday } from '@/db/api';
import { Clock, Coffee, Users, Wrench, Zap } from 'lucide-react';
import type { BreakType, MyBreaksToday as MyBreaksTodayType } from '@/types/types';
import { format } from 'date-fns';

export function MyBreaksToday() {
  const [breaksData, setBreaksData] = useState<MyBreaksTodayType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBreaksData = async () => {
    try {
      const data = await getMyBreaksToday();
      setBreaksData(data);
    } catch (error) {
      console.error('Error fetching breaks data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreaksData();
    const interval = setInterval(fetchBreaksData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getBreakIcon = (type: BreakType) => {
    switch (type) {
      case 'prayer':
        return <span className="text-lg">🕌</span>;
      case 'technical':
        return <Wrench className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      default:
        return <Coffee className="h-4 w-4" />;
    }
  };

  const getBreakTypeLabel = (type: BreakType) => {
    const labels: Record<BreakType, string> = {
      normal: 'Normal',
      prayer: 'Prayer',
      technical: 'Technical',
      meeting: 'Meeting',
      auto_idle: 'Auto Idle',
    };
    return labels[type];
  };

  const getBreakTypeColor = (type: BreakType) => {
    switch (type) {
      case 'prayer':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'technical':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'meeting':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const calculatePercentage = (used: number, total: number) => {
    return Math.min((used / total) * 100, 100);
  };

  const percentage = calculatePercentage(breaksData?.normal_total_minutes || 0, 60);
  const isWarning = percentage >= 83; // 50/60 minutes
  const isDanger = percentage >= 100; // 60/60 minutes

  if (loading) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            My Breaks Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          My Breaks Today
        </CardTitle>
        <CardDescription>Track your break usage and remaining time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Circular Progress */}
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - percentage / 100)}`}
                className={`transition-all duration-500 ${
                  isDanger ? 'text-destructive' :
                  isWarning ? 'text-amber-500' :
                  'text-primary'
                }`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-3xl font-bold ${
                isDanger ? 'text-destructive' :
                isWarning ? 'text-amber-500' :
                'text-primary'
              }`}>
                {breaksData?.normal_total_minutes || 0}
              </div>
              <div className="text-xs text-muted-foreground">/ 60 min</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{breaksData?.remaining_minutes || 60}</p>
            <p className="text-xs text-muted-foreground">Minutes Remaining</p>
          </div>
          <div className="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{breaksData?.breaks?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Breaks Taken</p>
          </div>
        </div>

        {/* Meeting Time (Separate) */}
        {(breaksData?.meeting_total_minutes || 0) > 0 && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Meeting Time</span>
              </div>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {breaksData.meeting_total_minutes} min
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Not counted in daily limit</p>
          </div>
        )}

        {/* Warnings */}
        {isDanger && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-xs text-destructive font-medium">
              ⚠️ You have exceeded your daily break limit. Further breaks may require supervisor approval.
            </p>
          </div>
        )}

        {isWarning && !isDanger && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ You are close to your daily break limit.
            </p>
          </div>
        )}

        {/* Recent Breaks */}
        {breaksData?.breaks && breaksData.breaks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Recent Breaks</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {breaksData.breaks.slice(0, 5).map((breakItem) => (
                <div
                  key={breakItem.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-2">
                    {getBreakIcon(breakItem.break_type)}
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {getBreakTypeLabel(breakItem.break_type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(breakItem.start_time), 'HH:mm')}
                        {breakItem.end_time && ` - ${format(new Date(breakItem.end_time), 'HH:mm')}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {breakItem.end_time ? (
                      <Badge variant="outline" className={getBreakTypeColor(breakItem.break_type)}>
                        {Math.round(breakItem.duration_minutes || 0)} min
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
