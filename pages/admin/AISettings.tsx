import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function AISettings() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    }
  }, [profile, navigate]);

  return (
    <div className="min-h-screen">
      <section className="relative gradient-hero-bg py-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent-orange/20 rounded-full blur-3xl animate-float-delayed" />
        </div>

        <div className="container relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold text-primary-foreground mb-2">AI Tools Settings</h1>
              <p className="text-xl text-primary-foreground/90">
                Configure AI-powered features
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              className="bg-card/50 backdrop-blur"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Generate professional complaint templates in English and Arabic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <Label htmlFor="assistant-enabled">Enable AI Assistant</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow agents to use AI for generating professional complaint templates
                  </p>
                </div>
                <Switch id="assistant-enabled" defaultChecked disabled />
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-dashed">
                <p className="text-sm text-muted-foreground">
                  <strong>Status:</strong> Currently enabled and operational. This feature helps
                  agents craft professional complaint templates in both English and Arabic.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>AI Assistant Features</CardTitle>
              <CardDescription>How AI tools enhance your customer service</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Bilingual support (English & Arabic)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Professional tone and formatting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Generates Subject and Description fields</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Easy copy-paste functionality</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
