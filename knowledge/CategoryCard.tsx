import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface CategoryCardProps {
  id: string;
  icon: LucideIcon;
  titleEn: string;
  titleAr: string;
  description?: string;
  articleCount: number;
  gradient: string;
  delay?: number;
}

export default function CategoryCard({
  id,
  icon: Icon,
  titleEn,
  titleAr,
  description,
  articleCount,
  gradient,
  delay = 0,
}: CategoryCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/knowledge-base/category/${id}`)}
      className="group relative overflow-hidden cursor-pointer ios-card-hover glass-card shadow-soft-lg rounded-ios-lg border-0 animate-fade-in-scale"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${gradient}`} />
      
      <div className="relative p-6 xl:p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-orange/20 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-8 w-8 text-accent" />
          </div>
          
          <div className="px-3 py-1 rounded-full bg-muted/50 backdrop-blur-sm">
            <span className="text-xs font-medium text-muted-foreground">
              {articleCount} {t('knowledgeBase.articles')}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <h3 className="text-xl xl:text-2xl font-bold text-foreground group-hover:text-accent transition-colors duration-300" dir="rtl">
            {titleAr}
          </h3>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        <div className="mt-6 flex items-center text-accent group-hover:translate-x-2 transition-transform duration-300">
          <span className="text-sm font-medium">{t('knowledgeBase.explore')}</span>
          <svg
            className="ml-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent-orange to-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </Card>
  );
}
