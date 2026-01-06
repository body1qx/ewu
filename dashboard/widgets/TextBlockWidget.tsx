import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TextBlockWidgetConfig } from '@/types/types';

interface TextBlockWidgetProps {
  title: string;
  config: TextBlockWidgetConfig;
}

export default function TextBlockWidget({ title, config }: TextBlockWidgetProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="prose prose-sm max-w-none"
          style={{
            textAlign: config.alignment,
            fontSize: config.font_size || '1rem',
            color: config.color || 'inherit',
          }}
        >
          <p>{config.content}</p>
        </div>
      </CardContent>
    </Card>
  );
}
