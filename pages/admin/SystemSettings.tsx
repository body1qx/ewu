import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getSystemSettings, updateSystemSettings } from '@/db/api';
import type { SystemSettings as SystemSettingsType } from '@/types/types';
import { Loader2, Save, Clock, AlertTriangle, LogOut, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SystemSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SystemSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState(true);
  const [inactivityTimeout, setInactivityTimeout] = useState(30);
  const [warningTime, setWarningTime] = useState(5);
  const [sessionDuration, setSessionDuration] = useState(15);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSystemSettings();
      if (data) {
        setSettings(data);
        setAutoLogoutEnabled(data.auto_logout_enabled);
        setInactivityTimeout(data.inactivity_timeout_minutes);
        setWarningTime(data.warning_time_minutes);
        setSessionDuration(data.session_duration_hours);
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
      toast.error('فشل تحميل إعدادات النظام');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (inactivityTimeout < 1 || inactivityTimeout > 1440) {
      toast.error('مدة عدم النشاط يجب أن تكون بين 1 و 1440 دقيقة');
      return;
    }

    if (warningTime < 1 || warningTime > 60) {
      toast.error('وقت التحذير يجب أن يكون بين 1 و 60 دقيقة');
      return;
    }

    if (warningTime >= inactivityTimeout) {
      toast.error('وقت التحذير يجب أن يكون أقل من مدة عدم النشاط');
      return;
    }

    if (sessionDuration < 1 || sessionDuration > 168) {
      toast.error('مدة الجلسة يجب أن تكون بين 1 و 168 ساعة');
      return;
    }

    try {
      setSaving(true);
      await updateSystemSettings({
        auto_logout_enabled: autoLogoutEnabled,
        inactivity_timeout_minutes: inactivityTimeout,
        warning_time_minutes: warningTime,
        session_duration_hours: sessionDuration,
      });

      toast.success('تم حفظ الإعدادات بنجاح', {
        description: 'سيتم تطبيق الإعدادات الجديدة على جميع المستخدمين',
      });

      // Reload settings to get updated timestamp
      await loadSettings();
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      toast.error('فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setAutoLogoutEnabled(settings.auto_logout_enabled);
      setInactivityTimeout(settings.inactivity_timeout_minutes);
      setWarningTime(settings.warning_time_minutes);
      setSessionDuration(settings.session_duration_hours);
      toast.info('تم إلغاء التغييرات');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إعدادات النظام</h1>
        <p className="text-muted-foreground mt-2">
          إدارة إعدادات النظام العامة وتسجيل الخروج التلقائي
        </p>
      </div>

      {/* Auto Logout Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-primary" />
            <CardTitle>إعدادات تسجيل الخروج التلقائي</CardTitle>
          </div>
          <CardDescription>
            التحكم في نظام تسجيل الخروج التلقائي للمستخدمين بعد فترة من عدم النشاط
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Auto Logout */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-1">
              <Label htmlFor="auto-logout-enabled" className="text-base font-medium">
                تفعيل تسجيل الخروج التلقائي
              </Label>
              <p className="text-sm text-muted-foreground">
                عند التفعيل، سيتم تسجيل خروج المستخدمين تلقائياً بعد فترة من عدم النشاط
              </p>
            </div>
            <Switch
              id="auto-logout-enabled"
              checked={autoLogoutEnabled}
              onCheckedChange={setAutoLogoutEnabled}
            />
          </div>

          {/* Inactivity Timeout */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="inactivity-timeout" className="text-base font-medium">
                مدة عدم النشاط (بالدقائق)
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              المدة الزمنية قبل تسجيل خروج المستخدم تلقائياً بسبب عدم النشاط
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="inactivity-timeout"
                type="number"
                min="1"
                max="1440"
                value={inactivityTimeout}
                onChange={(e) => setInactivityTimeout(Number(e.target.value))}
                disabled={!autoLogoutEnabled}
                className="max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground">
                دقيقة ({Math.floor(inactivityTimeout / 60)} ساعة و {inactivityTimeout % 60} دقيقة)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              القيمة المسموحة: من 1 إلى 1440 دقيقة (24 ساعة)
            </p>
          </div>

          {/* Warning Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="warning-time" className="text-base font-medium">
                وقت التحذير (بالدقائق)
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              المدة الزمنية قبل تسجيل الخروج التي سيتم فيها عرض تحذير للمستخدم
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="warning-time"
                type="number"
                min="1"
                max="60"
                value={warningTime}
                onChange={(e) => setWarningTime(Number(e.target.value))}
                disabled={!autoLogoutEnabled}
                className="max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground">دقيقة</span>
            </div>
            <p className="text-xs text-muted-foreground">
              القيمة المسموحة: من 1 إلى 60 دقيقة (يجب أن تكون أقل من مدة عدم النشاط)
            </p>
          </div>

          {/* Session Duration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="session-duration" className="text-base font-medium">
                مدة الجلسة القصوى (بالساعات)
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              المدة القصوى للجلسة قبل أن يطلب من المستخدم تسجيل الدخول مرة أخرى
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="session-duration"
                type="number"
                min="1"
                max="168"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(Number(e.target.value))}
                className="max-w-[200px]"
              />
              <span className="text-sm text-muted-foreground">
                ساعة ({Math.floor(sessionDuration / 24)} يوم و {sessionDuration % 24} ساعة)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              القيمة المسموحة: من 1 إلى 168 ساعة (7 أيام)
            </p>
          </div>

          {/* Preview/Summary */}
          <div className="p-4 border rounded-lg bg-primary/5 space-y-2">
            <h4 className="font-medium text-sm">ملخص الإعدادات الحالية:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                • تسجيل الخروج التلقائي:{' '}
                <span className={autoLogoutEnabled ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {autoLogoutEnabled ? 'مفعّل' : 'معطّل'}
                </span>
              </li>
              {autoLogoutEnabled && (
                <>
                  <li>• سيتم تسجيل خروج المستخدم بعد {inactivityTimeout} دقيقة من عدم النشاط</li>
                  <li>• سيتم عرض تحذير قبل {warningTime} دقيقة من تسجيل الخروج</li>
                </>
              )}
              <li>• مدة الجلسة القصوى: {sessionDuration} ساعة</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ الإعدادات
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              إلغاء التغييرات
            </Button>
          </div>

          {/* Last Updated Info */}
          {settings?.updated_at && (
            <div className="text-xs text-muted-foreground pt-4 border-t">
              آخر تحديث: {new Date(settings.updated_at).toLocaleString('ar-SA', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <p>سيتم تطبيق الإعدادات الجديدة على جميع المستخدمين فوراً بعد الحفظ</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <p>يتم تتبع نشاط المستخدم من خلال حركة الماوس، الكيبورد، النقرات، والتمرير</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <p>عند تعطيل تسجيل الخروج التلقائي، سيبقى المستخدمون مسجلين دخول حتى مدة الجلسة القصوى</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">•</span>
            <p>يُنصح بتعيين مدة عدم النشاط بين 15-60 دقيقة لتحقيق التوازن بين الأمان وتجربة المستخدم</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
