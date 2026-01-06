import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardWidget, DashboardLayoutType } from '@/types/types';
import MetricWidget from './widgets/MetricWidget';
import ProgressWidget from './widgets/ProgressWidget';
import StatusWidget from './widgets/StatusWidget';
import CounterWidget from './widgets/CounterWidget';
import TextBlockWidget from './widgets/TextBlockWidget';
import LeaderboardWidget from './widgets/LeaderboardWidget';

interface DashboardPreviewProps {
  widgets: DashboardWidget[];
  layoutType: DashboardLayoutType;
  onEditWidget?: (widget: DashboardWidget) => void;
  onDeleteWidget?: (widgetId: string) => void;
  isEditing?: boolean;
}

export default function DashboardPreview({
  widgets,
  layoutType,
  onEditWidget,
  onDeleteWidget,
  isEditing = false,
}: DashboardPreviewProps) {
  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.widget_type) {
      case 'metric':
        return <MetricWidget title={widget.title} config={widget.config as any} />;
      case 'progress':
        return <ProgressWidget title={widget.title} config={widget.config as any} />;
      case 'status':
        return <StatusWidget title={widget.title} config={widget.config as any} />;
      case 'counter':
        return <CounterWidget title={widget.title} config={widget.config as any} />;
      case 'text_block':
        return <TextBlockWidget title={widget.title} config={widget.config as any} />;
      case 'leaderboard':
        return <LeaderboardWidget title={widget.title} config={widget.config as any} />;
      default:
        return (
          <div className="p-4 border rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              نوع الويدجت "{widget.widget_type}" مو موجود 😅
            </p>
          </div>
        );
    }
  };

  if (widgets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] border-2 border-dashed rounded-lg">
        <div className="text-center">
          <p className="text-muted-foreground">ما فيه ويدجتس بعد 🧩</p>
          <p className="text-sm text-muted-foreground mt-1">
            اضغط على نوع الويدجت عشان تضيفه للوحة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${layoutType === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {widgets.map((widget) => (
        <div key={widget.id} className="relative group">
          {renderWidget(widget)}
          {isEditing && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              {onEditWidget && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => onEditWidget(widget)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDeleteWidget && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => onDeleteWidget(widget.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
