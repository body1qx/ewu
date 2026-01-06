import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getRecentShiftHandoverNotes, isShiftNoteNew } from '@/db/api';
import type { ShiftHandoverNote } from '@/types/types';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ShiftHandoverWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<ShiftHandoverNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRecentNotes = async () => {
      // لا تحمل البيانات إذا لم يكن المستخدم مسجل دخول
      if (!user) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const data = await getRecentShiftHandoverNotes(3);
        // تحديث الحالة فقط إذا كان المكون لا يزال موجوداً
        if (isMounted) {
          setNotes(data);
        }
      } catch (error) {
        // تجاهل الأخطاء إذا كان المستخدم غير مصادق (أثناء تسجيل الخروج)
        if (isMounted && user) {
          console.error('Error loading recent shift handover notes:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRecentNotes();

    // تنظيف: منع تحديث الحالة بعد إلغاء تحميل المكون
    return () => {
      isMounted = false;
    };
  }, [user]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getShiftTypeColor = (shiftType: string) => {
    switch (shiftType) {
      case 'morning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'night':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'afternoon':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} ${t('common.minutes_ago')}`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ${t('common.hours_ago')}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('shift_handover.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('shift_handover.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {t('shift_handover.no_notes')}
          </p>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/shift-handover')}
          >
            {t('shift_handover.view_all')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('shift_handover.title')}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/shift-handover')}
          >
            {t('shift_handover.view_all')}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate('/shift-handover')}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{note.title}</h4>
                    {isShiftNoteNew(note.created_at) && (
                      <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                        {t('shift_handover.new_badge')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge className={`${getShiftTypeColor(note.shift_type)} text-xs`}>
                      {t(`shift_handover.shift_types.${note.shift_type}`)}
                    </Badge>
                    <Badge className={`${getPriorityColor(note.priority)} text-xs`}>
                      {t(`shift_handover.priority.${note.priority}`)}
                    </Badge>
                    {note.follow_up_required && (
                      <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {t('shift_handover.form.follow_up_required')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {note.content}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{note.creator?.full_name || 'Unknown'}</span>
                <span>•</span>
                <span>{formatDate(note.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
