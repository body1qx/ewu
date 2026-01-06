import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ProgressWidgetConfig } from '@/types/types';

interface ProgressWidgetProps {
  title: string;
  config: ProgressWidgetConfig;
}

export default function ProgressWidget({ title, config }: ProgressWidgetProps) {
  const percentage = Math.min(100, Math.round((config.current / config.target) * 100));

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-bold" style={{ color: config.color }}>
              {config.current.toLocaleString()}
            </span>
            <span className="text-muted-foreground ml-2">
              / {config.target.toLocaleString()} {config.unit}
            </span>
          </div>
          {config.show_percentage && (
            <span className="text-2xl font-semibold" style={{ color: config.color }}>
              {percentage}%
            </span>
          )}
        </div>
        <Progress value={percentage} className="h-3" />
      </CardContent>
    </Card>
  );
}
