import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { getEmployeeWarnings } from '@/db/api';
import type { WarningWithIssuer, WarningType } from '@/types/types';

const WARNING_TYPES = [
  { value: 'notice', label: 'تنبيه خفيف 👀', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500' },
  { value: 'warning', label: 'تحذير عادي ⚠️', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500' },
  { value: 'strong_warning', label: 'تحذير قوي 🚨', color: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500' },
  { value: 'final_warning', label: 'تحذير نهائي 🔥', color: 'bg-red-600/30 text-red-800 dark:text-red-200 border-red-600' },
  { value: 'suspension_recommendation', label: 'توصية بالإيقاف 💔', color: 'bg-purple-600/30 text-purple-800 dark:text-purple-200 border-purple-600' },
];

export default function WarningsWidget() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeWarnings, setActiveWarnings] = useState<WarningWithIssuer[]>([]);

  useEffect(() => {
    if (!profile) return;
    loadWarnings();
  }, [profile]);

  const loadWarnings = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const warnings = await getEmployeeWarnings(profile.id);
      const active = warnings.filter((w) => w.status === 'active');
      setActiveWarnings(active);
    } catch (error) {
      console.error('خطأ في تحميل التحذيرات:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWarningTypeConfig = (type: WarningType) => {
    return WARNING_TYPES.find((t) => t.value === type) || WARNING_TYPES[0];
  };

  if (loading) {
    return (
      <Card className="shadow-elegant animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (activeWarnings.length === 0) {
    return (
      <Card className="shadow-elegant border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            حالة التحذيرات 📋
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <p className="font-medium text-green-600 dark:text-green-400">والله ما عندك شي! 🎉</p>
            <p className="text-sm text-muted-foreground">ما فيه تحذيرات نشطة</p>
          </div>
          
          <Button
            onClick={() => navigate('/warnings')}
            variant="outline"
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            شوف كل التحذيرات
          </Button>
        </CardContent>
      </Card>
    );
  }

  const topWarning = activeWarnings[0];
  const typeConfig = getWarningTypeConfig(topWarning.type);

  return (
    <Card className="shadow-elegant border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <AlertTriangle className="w-5 h-5" />
          تحذيرات نشطة ({activeWarnings.length}) ⚠️
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg border-2 bg-muted/30" style={{ borderColor: typeConfig.color.split(' ')[0].replace('bg-', '') }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge className={typeConfig.color}>
              {typeConfig.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {topWarning.points} نقطة
            </Badge>
          </div>
          <h4 className="font-semibold mb-1">{topWarning.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {topWarning.reason}
          </p>
          <div className="text-xs text-muted-foreground mt-2">
            {format(new Date(topWarning.incident_date), 'MMM d, yyyy')}
          </div>
        </div>

        <Button
          onClick={() => navigate('/warnings')}
          variant="outline"
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          شوف كل التحذيرات
        </Button>
      </CardContent>
    </Card>
  );
}
