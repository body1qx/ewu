import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertTriangle, Calendar, User, FileText, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  getEmployeeWarnings,
  getEmployeeWarningStats,
  getWarningById,
  acknowledgeWarning,
} from '@/db/api';
import type { WarningWithIssuer, WarningStats, WarningType } from '@/types/types';

const WARNING_TYPES = [
  { value: 'notice', label: 'تنبيه خفيف 👀', severity: 'low', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]' },
  { value: 'warning', label: 'تحذير عادي ⚠️', severity: 'medium', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500', glow: 'shadow-[0_0_25px_rgba(249,115,22,0.4)]' },
  { value: 'strong_warning', label: 'تحذير قوي 🚨', severity: 'high', color: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse' },
  { value: 'final_warning', label: 'تحذير نهائي 🔥', severity: 'critical', color: 'bg-red-600/30 text-red-800 dark:text-red-200 border-red-600', glow: 'shadow-[0_0_35px_rgba(220,38,38,0.6)] animate-pulse' },
  { value: 'suspension_recommendation', label: 'توصية بالإيقاف 💔', severity: 'critical', color: 'bg-purple-600/30 text-purple-800 dark:text-purple-200 border-purple-600', glow: 'shadow-[0_0_40px_rgba(147,51,234,0.6)] animate-pulse' },
];

export default function MyWarnings() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState<WarningWithIssuer[]>([]);
  const [stats, setStats] = useState<WarningStats | null>(null);
  const [selectedWarning, setSelectedWarning] = useState<WarningWithIssuer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [response, setResponse] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  useEffect(() => {
    if (id && warnings.length > 0) {
      const warning = warnings.find((w) => w.id === id);
      if (warning) {
        setSelectedWarning(warning);
        setDrawerOpen(true);
      } else {
        loadWarningById(id);
      }
    }
  }, [id, warnings]);

  const loadData = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const [warningsData, statsData] = await Promise.all([
        getEmployeeWarnings(profile.id),
        getEmployeeWarningStats(profile.id),
      ]);

      setWarnings(warningsData);
      setStats(statsData);
    } catch (error) {
      console.error('خطأ في تحميل التحذيرات:', error);
      toast.error('ما قدرنا نحمل التحذيرات يا خوي 😅');
    } finally {
      setLoading(false);
    }
  };

  const loadWarningById = async (warningId: string) => {
    try {
      const warning = await getWarningById(warningId);
      if (warning) {
        setSelectedWarning(warning);
        setDrawerOpen(true);
      }
    } catch (error) {
      console.error('خطأ في تحميل التحذير:', error);
      toast.error('ما لقينا التحذير يا خوي 🤷');
      navigate('/warnings');
    }
  };

  const handleAcknowledge = async (withResponse: boolean) => {
    if (!selectedWarning) return;

    try {
      setAcknowledging(true);
      await acknowledgeWarning(
        selectedWarning.id,
        withResponse ? response.trim() : undefined
      );

      toast.success('تمام يا خوي، استلمنا ردك 👍');
      setDrawerOpen(false);
      setResponse('');
      loadData();
    } catch (error) {
      console.error('خطأ في الإقرار بالتحذير:', error);
      toast.error('ما قدرنا نسجل الإقرار 😔');
    } finally {
      setAcknowledging(false);
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 bg-muted" />
          <Skeleton className="h-24 bg-muted" />
          <Skeleton className="h-24 bg-muted" />
        </div>
        <Skeleton className="h-96 bg-muted" />
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
          <h1 className="text-3xl font-bold">تحذيراتي 📋</h1>
          <p className="text-muted-foreground">شوف وتابع تحذيراتك يا خوي</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">مجموع النقاط 📊</div>
            <div className="text-3xl font-bold">{stats?.total_points || 0}</div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">التحذيرات النشطة ⚡</div>
            <div className="text-3xl font-bold">{stats?.active_warnings || 0}</div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">آخر تحذير 📅</div>
            <div className="text-lg font-bold">
              {stats?.last_warning_date
                ? format(new Date(stats.last_warning_date), 'MMM d, yyyy')
                : 'ما فيه 🎉'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings List */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>كل التحذيرات 📜</CardTitle>
        </CardHeader>
        <CardContent>
          {warnings.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">والله ما عندك شي! 🎊</h3>
              <p className="text-muted-foreground">ما فيه أي تحذيرات عليك يا بطل 💪</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {warnings.map((warning) => {
                const typeConfig = getWarningTypeConfig(warning.type);
                return (
                  <div
                    key={warning.id}
                    onClick={() => {
                      setSelectedWarning(warning);
                      setDrawerOpen(true);
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${typeConfig.color} ${
                      warning.severity === 'high' || warning.severity === 'critical'
                        ? typeConfig.glow
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge className={typeConfig.color}>
                        {typeConfig.label}
                      </Badge>
                      {isNew(warning.issued_at) && (
                        <Badge variant="secondary" className="text-xs animate-pulse">
                          جديد 🆕
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold mb-2">{warning.title}</h3>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        الحادثة: {format(new Date(warning.incident_date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        من: {warning.issuer?.full_name || 'الإدارة'}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {warning.points} نقطة
                      </Badge>
                      <Badge
                        variant={warning.status === 'acknowledged' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {warning.status === 'acknowledged' ? 'تم الإقرار ✅' : 'نشط ⏳'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedWarning && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  تفاصيل التحذير 📝
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Type Badge */}
                <div>
                  <Badge className={getWarningTypeConfig(selectedWarning.type).color}>
                    {getWarningTypeConfig(selectedWarning.type).label}
                  </Badge>
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold">{selectedWarning.title}</h2>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">صادر من 👤</div>
                    <div className="font-medium">
                      {selectedWarning.issuer?.full_name || 'الإدارة'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedWarning.issuer?.position}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">تاريخ الحادثة 📅</div>
                    <div className="font-medium">
                      {format(new Date(selectedWarning.incident_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">تاريخ الإصدار 🕐</div>
                    <div className="font-medium">
                      {format(new Date(selectedWarning.issued_at), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">النقاط 🎯</div>
                    <div className="font-medium text-lg">{selectedWarning.points}</div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    السبب 📄
                  </h3>
                  <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap">
                    {selectedWarning.reason}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="font-semibold mb-3">الجدول الزمني ⏰</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div>
                        <div className="font-medium">صدر التحذير</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(selectedWarning.issued_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                    {selectedWarning.acknowledged_at && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                        <div>
                          <div className="font-medium">تم الإقرار ✅</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(selectedWarning.acknowledged_at), 'MMM d, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employee Response */}
                {selectedWarning.employee_response && (
                  <div>
                    <h3 className="font-semibold mb-2">ردك على التحذير 💬</h3>
                    <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap">
                      {selectedWarning.employee_response}
                    </div>
                  </div>
                )}

                {/* Acknowledge Section */}
                {selectedWarning.status === 'active' && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold">أقر بالتحذير ✍️</h3>
                    <Textarea
                      placeholder="اختياري: اكتب ردك أو اعتراضك يا خوي..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcknowledge(false)}
                        disabled={acknowledging}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        أقر بالتحذير
                      </Button>
                      {response.trim() && (
                        <Button
                          onClick={() => handleAcknowledge(true)}
                          disabled={acknowledging}
                          variant="outline"
                          className="flex-1"
                        >
                          أقر مع الرد
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
