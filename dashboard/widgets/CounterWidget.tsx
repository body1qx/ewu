import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CounterWidgetConfig } from '@/types/types';

interface CounterWidgetProps {
  title: string;
  config: CounterWidgetConfig;
}

export default function CounterWidget({ title, config }: CounterWidgetProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div
              className={`text-5xl font-bold ${config.animate ? 'animate-pulse' : ''}`}
              style={{ color: config.color }}
            >
              {config.value.toLocaleString()}
            </div>
            <p className="text-lg text-muted-foreground mt-2">{config.label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
