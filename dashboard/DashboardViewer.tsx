import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserDashboards, getDashboardWidgets } from '@/db/api';
import type { Dashboard, DashboardWidget } from '@/types/types';
import DashboardPreview from './DashboardPreview';
import { Badge } from '@/components/ui/badge';

interface DashboardViewerProps {
  userId: string;
}

export default function DashboardViewer({ userId }: DashboardViewerProps) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [widgetsByDashboard, setWidgetsByDashboard] = useState<Record<string, DashboardWidget[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboards();
  }, [userId]);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const dashboardsData = await getUserDashboards(userId);
      
      const activeDashboards = dashboardsData.filter(d => d.is_active);
      setDashboards(activeDashboards);

      const widgetsMap: Record<string, DashboardWidget[]> = {};
      for (const dashboard of activeDashboards) {
        const widgets = await getDashboardWidgets(dashboard.id);
        widgetsMap[dashboard.id] = widgets;
      }
      setWidgetsByDashboard(widgetsMap);
    } catch (error) {
      console.error('Error loading dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (dashboards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {dashboards.map((dashboard) => (
        <Card key={dashboard.id} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{dashboard.name}</CardTitle>
                {dashboard.description && (
                  <CardDescription className="mt-2">{dashboard.description}</CardDescription>
                )}
              </div>
              <Badge variant="outline">{dashboard.layout_type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <DashboardPreview
              widgets={widgetsByDashboard[dashboard.id] || []}
              layoutType={dashboard.layout_type}
              isEditing={false}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
