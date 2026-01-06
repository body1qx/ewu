import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  getDashboardById,
  getDashboardWidgets,
  getWidgetTypes,
  createWidget,
  deleteWidget,
  updateWidget,
} from '@/db/api';
import type { Dashboard, DashboardWidget, WidgetTypeDefinition } from '@/types/types';
import WidgetConfigDialog from '@/components/dashboard/WidgetConfigDialog';
import DashboardPreview from '@/components/dashboard/DashboardPreview';
import { Badge } from '@/components/ui/badge';

export default function DashboardBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [widgetTypes, setWidgetTypes] = useState<WidgetTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [selectedWidgetType, setSelectedWidgetType] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [dashboardData, widgetsData, typesData] = await Promise.all([
        getDashboardById(id),
        getDashboardWidgets(id),
        getWidgetTypes(),
      ]);

      setDashboard(dashboardData);
      setWidgets(widgetsData);
      setWidgetTypes(typesData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('ما قدرنا نحمل اللوحة يا خوي 😅');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWidget = (widgetType: string) => {
    setSelectedWidgetType(widgetType);
    setEditingWidget(null);
    setConfigDialogOpen(true);
  };

  const handleEditWidget = (widget: DashboardWidget) => {
    setEditingWidget(widget);
    setSelectedWidgetType(widget.widget_type);
    setConfigDialogOpen(true);
  };

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      await deleteWidget(widgetId);
      toast.success('تمام! انحذف الويدجت 🗑️');
      loadData();
    } catch (error) {
      console.error('Error deleting widget:', error);
      toast.error('ما قدرنا نحذف الويدجت يا خوي 😔');
    }
  };

  const handleWidgetSaved = () => {
    setConfigDialogOpen(false);
    setEditingWidget(null);
    setSelectedWidgetType(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">ما لقينا اللوحة 😅</h3>
            <Button onClick={() => navigate('/admin/dashboards')}>
              رجوع للوحات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboards')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{dashboard.name}</h1>
            <p className="text-muted-foreground mt-1">
              ضبط الويدجتس والتخطيط للوحة يا خوي
            </p>
          </div>
        </div>
        <Badge variant={dashboard.is_active ? 'default' : 'secondary'}>
          {dashboard.is_active ? 'نشطة ✅' : 'معطلة 🔴'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أنواع الويدجتس 🧩</CardTitle>
              <CardDescription>اضغط عشان تضيف ويدجت</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {widgetTypes.map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAddWidget(type.name)}
                >
                  <Plus className="w-4 h-4" />
                  {type.display_name}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>معلومات اللوحة 📋</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">التخطيط:</span>{' '}
                <Badge variant="outline">{dashboard.layout_type}</Badge>
              </div>
              <div>
                <span className="font-medium">الويدجتس:</span> {widgets.length}
              </div>
              <div>
                <span className="font-medium">الترتيب:</span> {dashboard.display_order}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>معاينة اللوحة 👀</CardTitle>
              <CardDescription>
                كذا بتظهر اللوحة للمستخدمين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardPreview
                widgets={widgets}
                layoutType={dashboard.layout_type}
                onEditWidget={handleEditWidget}
                onDeleteWidget={handleDeleteWidget}
                isEditing={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <WidgetConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        widget={editingWidget}
        widgetType={selectedWidgetType}
        dashboardId={id || ''}
        onSaved={handleWidgetSaved}
      />
    </div>
  );
}
