import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KnowledgeWidgetProps {
  totalArticles: number;
  lastUpdated: string;
  hasNewContent: boolean;
}

export default function KnowledgeWidget({
  totalArticles,
  lastUpdated,
  hasNewContent,
}: KnowledgeWidgetProps) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate('/knowledge-base')}
      className="group cursor-pointer glass-card rounded-ios-lg border-0 shadow-soft-lg ios-card-hover overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent-orange/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-accent-orange/20 group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            Knowledge Hub
          </CardTitle>
          {hasNewContent && (
            <Badge className="bg-accent text-accent-foreground animate-pulse-glow-soft">
              NEW
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Total Articles</span>
          </div>
          <span className="text-lg font-bold text-accent">{totalArticles}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Last Updated</span>
          </div>
          <span className="text-sm text-muted-foreground">{lastUpdated}</span>
        </div>

        <div className="pt-2 flex items-center text-accent group-hover:translate-x-2 transition-transform duration-300">
          <span className="text-sm font-medium">Browse Knowledge Base</span>
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
      </CardContent>
    </Card>
  );
}
