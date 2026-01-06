import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function Files() {
  const { t } = useTranslation();
  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold gradient-text mb-8">File Hub</h1>
      <Card>
        <CardHeader>
          <CardTitle>File Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">File hub interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
