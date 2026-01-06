import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { AlertTriangle, Search, Send, FileText, Calendar, User, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  createWarningWithNotification,
  getEmployeeWarnings,
  getAllProfiles,
  getWarningTemplates,
  deleteWarning,
} from '@/db/api';
import type { Profile, WarningTemplate, WarningWithIssuer, WarningType, WarningSeverity } from '@/types/types';

const WARNING_TYPES = [
  { value: 'notice', label: 'تنبيه خفيف 👀 (لفت نظر)', severity: 'low', points: 1, color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500' },
  { value: 'warning', label: 'تحذير عادي ⚠️ (تحذير)', severity: 'medium', points: 2, color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500' },
  { value: 'strong_warning', label: 'تحذير قوي 🚨 (إنذار قوي)', severity: 'high', points: 3, color: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500' },
  { value: 'final_warning', label: 'تحذير نهائي 🔥 (إنذار نهائي)', severity: 'critical', points: 5, color: 'bg-red-600/30 text-red-800 dark:text-red-200 border-red-600' },
  { value: 'suspension_recommendation', label: 'توصية بالإيقاف 💔 (اقتراح إيقاف)', severity: 'critical', points: 10, color: 'bg-purple-600/30 text-purple-800 dark:text-purple-200 border-purple-600' },
];

export default function WarningsCenter() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [warnings, setWarnings] = useState<WarningWithIssuer[]>([]);
  const [templates, setTemplates] = useState<WarningTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warningToDelete, setWarningToDelete] = useState<WarningWithIssuer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [warningType, setWarningType] = useState<WarningType>('notice');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [incidentDate, setIncidentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [points, setPoints] = useState(1);

  useEffect(() => {
    if (!profile) {
      setLoading(true);
      return;
    }
    if (profile.role !== 'admin' && profile.role !== 'supervisor') {
      toast.error('ممنوع الدخول يا خوي! لازم تكون أدمن أو مشرف 🚫');
      navigate('/');
      return;
    }
    loadData();
  }, [profile, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, warningsData, templatesData] = await Promise.all([
        getAllProfiles(),
        getEmployeeWarnings(),
        getWarningTemplates(),
      ]);

      const activeEmployees = employeesData.filter(
        (e) => e.status === 'active' && e.role !== 'guest'
      );
      setEmployees(activeEmployees);
      setWarnings(warningsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast.error('ما قدرنا نحمل البيانات يا خوي 😅');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: WarningType) => {
    setWarningType(type);
    const typeConfig = WARNING_TYPES.find((t) => t.value === type);
    if (typeConfig) {
      setPoints(typeConfig.points);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setWarningType(template.type);
      setTitle(template.title);
      setReason(template.default_reason);
      setPoints(template.points);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee || !title.trim() || !reason.trim()) {
      toast.error('عبي كل الخانات يا خوي 📝');
      return;
    }

    try {
      setSubmitting(true);
      const typeConfig = WARNING_TYPES.find((t) => t.value === warningType);

      await createWarningWithNotification({
        employee_id: selectedEmployee,
        type: warningType,
        severity: typeConfig?.severity as WarningSeverity || 'low',
        title: title.trim(),
        reason: reason.trim(),
        incident_date: incidentDate,
        points,
      });

      toast.success('تمام! صدر التحذير بنجاح 👍');

      // إعادة تعيين النموذج
      setSelectedEmployee('');
      setWarningType('notice');
      setTitle('');
      setReason('');
      setIncidentDate(format(new Date(), 'yyyy-MM-dd'));
      setPoints(1);

      // إعادة تحميل التحذيرات
      loadData();
    } catch (error: any) {
      console.error('خطأ في إصدار التحذير:', error);
      const errorMessage = error?.message || error?.details || 'ما قدرنا نصدر التحذير 😔';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (warning: WarningWithIssuer, e: React.MouseEvent) => {
    e.stopPropagation(); // منع الانتقال عند النقر على الحذف
    setWarningToDelete(warning);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!warningToDelete) return;

    try {
      setDeleting(true);
      await deleteWarning(warningToDelete.id);
      toast.success('تمام! انحذف التحذير 🗑️');
      
      // إزالة من الحالة المحلية
      setWarnings(warnings.filter(w => w.id !== warningToDelete.id));
      
      // إغلاق النافذة
      setDeleteDialogOpen(false);
      setWarningToDelete(null);
    } catch (error: any) {
      console.error('خطأ في حذف التحذير:', error);
      const errorMessage = error?.message || 'ما قدرنا نحذف التحذير 😔';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWarningTypeConfig = (type: WarningType) => {
    return WARNING_TYPES.find((t) => t.value === type) || WARNING_TYPES[0];
  };

  const isNew = (issuedAt: string) => {
    const issued = new Date(issuedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - issued.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="h-96 bg-muted" />
          <Skeleton className="h-96 bg-muted" />
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
          <AlertTriangle className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">مركز التحذيرات ⚠️</h1>
          <p className="text-muted-foreground">أصدر وتابع تحذيرات الموظفين يا خوي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Employee Selector */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              اختر الموظف 👤
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="دور على الموظفين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedEmployee === emp.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="font-medium">{emp.full_name || emp.email}</div>
                  <div className="text-sm text-muted-foreground">
                    {emp.employee_id} • {emp.position}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Center: Create Warning Form */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              إصدار تحذير 📝
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Template Selector */}
              <div className="space-y-2">
                <Label>استخدم قالب (اختياري) 📋</Label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر قالب..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Warning Type */}
              <div className="space-y-2">
                <Label>نوع التحذير *</Label>
                <Select value={warningType} onValueChange={(value) => handleTypeChange(value as WarningType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WARNING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>العنوان *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="موضوع مختصر..."
                  required
                />
              </div>

              {/* Incident Date */}
              <div className="space-y-2">
                <Label>تاريخ الحادثة *</Label>
                <Input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  required
                />
              </div>

              {/* Points */}
              <div className="space-y-2">
                <Label>النقاط 🎯</Label>
                <Input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>السبب *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="شرح مفصل للحادثة..."
                  rows={6}
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !selectedEmployee}
                className="w-full"
              >
                {submitting ? (
                  <>جاري الإرسال...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    أرسل التحذير 📤
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right: Recent Warnings */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              آخر التحذيرات 📜
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {warnings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ما فيه تحذيرات بعد 🎉
                </div>
              ) : (
                warnings.slice(0, 20).map((warning) => {
                  const typeConfig = getWarningTypeConfig(warning.type);
                  return (
                    <div
                      key={warning.id}
                      className="p-3 rounded-lg border border-border hover:border-primary/50 transition-all group relative"
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={() => navigate(`/warnings/${warning.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge className={typeConfig.color}>
                            {typeConfig.label.split('(')[0].trim()}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {isNew(warning.issued_at) && (
                              <Badge variant="secondary" className="text-xs">جديد 🆕</Badge>
                            )}
                          </div>
                        </div>
                        <div className="font-medium text-sm mb-1">{warning.title}</div>
                        <div className="text-xs text-muted-foreground">
                          إلى: {warning.employee?.full_name || 'غير معروف'}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(warning.issued_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => handleDeleteClick(warning, e)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التحذير 🗑️</AlertDialogTitle>
            <AlertDialogDescription>
              متأكد تبي تحذف هذا التحذير يا خوي؟ ما تقدر ترجعه بعدين!
              {warningToDelete && (
                <div className="mt-4 p-3 rounded-lg bg-muted">
                  <div className="font-medium">{warningToDelete.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    الموظف: {warningToDelete.employee?.full_name || 'غير معروف'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    صدر: {format(new Date(warningToDelete.issued_at), 'MMM d, yyyy')}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'جاري الحذف...' : 'احذف التحذير'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
