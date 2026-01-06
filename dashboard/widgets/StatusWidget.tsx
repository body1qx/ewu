import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StatusWidgetConfig } from '@/types/types';

interface StatusWidgetProps {
  title: string;
  config: StatusWidgetConfig;
}

export default function StatusWidget({ title, config }: StatusWidgetProps) {
  const getStatusIcon = () => {
    switch (config.status) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getStatusVariant = () => {
    switch (config.status) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
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
        <div className="flex items-center gap-4">
          <div>{getStatusIcon()}</div>
          <div className="flex-1">
            <Badge variant={getStatusVariant()} className="mb-2">
              {config.label}
            </Badge>
            {config.description && (
              <p className="text-sm text-muted-foreground">{config.description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
