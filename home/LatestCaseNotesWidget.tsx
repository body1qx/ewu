import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { FileText, ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRecentCaseNotesForHome } from '@/db/api';
import type { CaseNote } from '@/types/types';
import { useAuth } from '@/components/auth/AuthProvider';

export default function LatestCaseNotesWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRecentCases = async () => {
      // لا تحمل البيانات إذا لم يكن المستخدم مسجل دخول
      if (!user) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const data = await getRecentCaseNotesForHome();
        // تحديث الحالة فقط إذا كان المكون لا يزال موجوداً
        if (isMounted) {
          setCases(data);
        }
      } catch (error) {
        // تجاهل الأخطاء إذا كان المستخدم غير مصادق (أثناء تسجيل الخروج)
        if (isMounted && user) {
          console.error('Failed to load recent cases:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRecentCases();

    // تنظيف: منع تحديث الحالة بعد إلغاء تحميل المكون
    return () => {
      isMounted = false;
    };
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'pending_tl':
        return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'escalated':
        return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      case 'closed':
        return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return t('case_notes.status_open');
      case 'pending_tl':
        return t('case_notes.status_pending_tl');
      case 'escalated':
        return t('case_notes.status_escalated');
      case 'closed':
        return t('case_notes.status_closed');
      default:
        return status;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleCaseClick = (caseId: string) => {
    navigate(`/case-notes?case_id=${caseId}`);
  };

  const handleViewAll = () => {
    navigate('/case-notes');
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-border/50 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {t('case_notes.latest_cases')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('case_notes.latest_cases_subtitle')}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      </Card>
    );
  }

  if (cases.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-border/50 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {t('case_notes.latest_cases')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('case_notes.latest_cases_subtitle')}
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {t('case_notes.no_recent_cases')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {t('case_notes.latest_cases')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('case_notes.latest_cases_subtitle')}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAll}
          className="hover:bg-primary/10 hover:text-primary transition-colors"
        >
          {t('case_notes.view_all_cases')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="space-y-3">
        {cases.map((caseNote, index) => (
          <div
            key={caseNote.id}
            onClick={() => handleCaseClick(caseNote.id)}
            className="group relative p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card/80 cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
            style={{
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
            }}
          >
            {caseNote.is_new && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg animate-pulse">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {t('common.new')}
                </Badge>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10 border-2 border-primary/20">
                <AvatarImage src={caseNote.creator_avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {caseNote.creator_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {caseNote.customer_phone}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(caseNote.status)}`}
                  >
                    {getStatusLabel(caseNote.status)}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-1">
                  {caseNote.issue_category}
                </p>

                <p className="text-sm text-foreground/80 mb-2 line-clamp-2">
                  {truncateText(caseNote.description, 60)}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {caseNote.creator_name || t('case_notes.unknown_agent')}
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(caseNote.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  );
}
