import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetricWidgetConfig } from '@/types/types';

interface MetricWidgetProps {
  title: string;
  config: MetricWidgetConfig;
}

export default function MetricWidget({ title, config }: MetricWidgetProps) {
  const getTrendIcon = () => {
    switch (config.trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold" style={{ color: config.color }}>
              {config.value.toLocaleString()}
              <span className="text-lg ml-1">{config.unit}</span>
            </div>
            {config.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{config.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
