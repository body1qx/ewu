import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getFeaturedCommonIssues } from '@/db/api';
import type { CommonIssue, IssueCategory, CompensationType } from '@/types/types';

const CATEGORY_LABELS: Record<IssueCategory, { en: string; ar: string }> = {
  delivery: { en: 'Delivery', ar: 'التوصيل' },
  product: { en: 'Product', ar: 'المنتج' },
  app: { en: 'App', ar: 'التطبيق' },
  payment: { en: 'Payment', ar: 'الدفع' },
  service: { en: 'Service', ar: 'الخدمة' },
  other: { en: 'Other', ar: 'أخرى' },
};

const COMPENSATION_LABELS: Record<CompensationType, { en: string; ar: string }> = {
  none: { en: 'No Comp', ar: 'بدون تعويض' },
  apology_only: { en: 'Apology', ar: 'اعتذار' },
  discount: { en: 'Discount', ar: 'خصم' },
  free_item: { en: 'Free Item', ar: 'صنف مجاني' },
  refund: { en: 'Refund', ar: 'استرجاع' },
  other: { en: 'Other', ar: 'أخرى' },
};

const getCategoryColor = (category: IssueCategory): string => {
  switch (category) {
    case 'delivery':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'product':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'app':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'payment':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'service':
      return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
    default:
      return 'bg-muted/50 text-muted-foreground border-muted';
  }
};

const getCompensationColor = (type: CompensationType): string => {
  switch (type) {
    case 'none':
      return 'bg-muted/50 text-muted-foreground';
    case 'apology_only':
    case 'discount':
      return 'bg-yellow-500/10 text-yellow-600';
    case 'free_item':
      return 'bg-green-500/10 text-green-600';
    case 'refund':
      return 'bg-red-500/10 text-red-600';
    default:
      return 'bg-muted/50 text-muted-foreground';
  }
};

export default function HotIssues() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<CommonIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedIssues();
  }, []);

  const loadFeaturedIssues = async () => {
    try {
      setLoading(true);
      const data = await getFeaturedCommonIssues(5);
      setIssues(data);
    } catch (error) {
      console.error('Error loading featured issues:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-6 border-0 shadow-soft-lg animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted/20 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/20 rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (issues.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card p-6 border-0 shadow-soft-lg animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            Complaints & Refund
          </h2>
          <p className="text-sm text-muted-foreground mt-1" dir="rtl">
            الشكاوى والاسترجاع
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/common-issues')}
          className="text-primary hover:text-primary/80"
        >
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {issues.map((issue, index) => (
          <Card
            key={issue.id}
            onClick={() => navigate('/common-issues')}
            className="group relative overflow-hidden cursor-pointer border-0 bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-fade-in-scale"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                    {issue.issue_title_en}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2" dir="rtl">
                    {issue.issue_title_ar}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category */}
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getCategoryColor(issue.issue_category)}`}>
                      {CATEGORY_LABELS[issue.issue_category].en}
                    </span>

                    {/* Compensation */}
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getCompensationColor(issue.compensation_type)}`}>
                      {COMPENSATION_LABELS[issue.compensation_type].en}
                    </span>

                    {/* Escalation Warning */}
                    {issue.escalation_required && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        Escalation
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow Icon */}
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </div>

            {/* Bottom Gradient Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </Card>
        ))}
      </div>

      {/* View All Button */}
      <Button
        variant="outline"
        className="w-full mt-4"
        onClick={() => navigate('/common-issues')}
      >
        View All Complaints
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </Card>
  );
}
