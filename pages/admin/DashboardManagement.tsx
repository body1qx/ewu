import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  getAllDashboards,
  deleteDashboard,
  updateDashboard,
} from '@/db/api';
import type { Dashboard } from '@/types/types';
import DashboardFormDialog from '@/components/dashboard/DashboardFormDialog';
import { useNavigate } from 'react-router-dom';
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

export default function DashboardManagement() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<Dashboard | null>(null);

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const data = await getAllDashboards();
      setDashboards(data);
    } catch (error) {
      console.error('Error loading dashboards:', error);
      toast.error('ما قدرنا نحمل اللوحات يا خوي 😅');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDashboard(null);
    setDialogOpen(true);
  };

  const handleEdit = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard);
    setDialogOpen(true);
  };

  const handleDelete = (dashboard: Dashboard) => {
    setDashboardToDelete(dashboard);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!dashboardToDelete) return;

    try {
      await deleteDashboard(dashboardToDelete.id);
      toast.success('تمام! انحذفت اللوحة 🗑️');
      loadDashboards();
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast.error('ما قدرنا نحذف اللوحة يا خوي 😔');
    } finally {
      setDeleteDialogOpen(false);
      setDashboardToDelete(null);
    }
  };

  const toggleActive = async (dashboard: Dashboard) => {
    try {
      await updateDashboard(dashboard.id, { is_active: !dashboard.is_active });
      toast.success(`تمام! اللوحة ${dashboard.is_active ? 'تعطلت' : 'تفعلت'} 👍`);
      loadDashboards();
    } catch (error) {
      console.error('Error updating dashboard:', error);
      toast.error('ما قدرنا نحدث اللوحة يا خوي 😔');
    }
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditingDashboard(null);
    loadDashboards();
  };

  const navigateToBuilder = (dashboardId: string) => {
    navigate(`/admin/dashboards/${dashboardId}/builder`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة اللوحات 📊</h1>
          <p className="text-muted-foreground mt-1">
            سوي وتحكم في لوحات المعلومات يا خوي
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          سوي لوحة جديدة ➕
        </Button>
      </div>

      {dashboards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <GripVertical className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">ما فيه لوحات بعد 📊</h3>
            <p className="text-muted-foreground text-center mb-4">
              سوي أول لوحة عشان تبدأ يا خوي
            </p>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              سوي لوحة جديدة ➕
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {dashboard.name}
                      {!dashboard.is_active && (
                        <Badge variant="secondary">معطلة 🔴</Badge>
                      )}
                    </CardTitle>
                    {dashboard.description && (
                      <CardDescription className="mt-2">
                        {dashboard.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{dashboard.layout_type}</Badge>
                  <span>الترتيب: {dashboard.display_order}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToBuilder(dashboard.id)}
                    className="flex-1 gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    ضبط الإعدادات ⚙️
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(dashboard)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(dashboard)}
                  >
                    {dashboard.is_active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(dashboard)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DashboardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dashboard={editingDashboard}
        onSaved={handleSaved}
        userId={profile?.id || ''}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف اللوحة 🗑️</AlertDialogTitle>
            <AlertDialogDescription>
              متأكد تبي تحذف "{dashboardToDelete?.name}" يا خوي؟ ما تقدر ترجعها بعدين وبتنحذف كل الويدجتس اللي فيها!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>احذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
