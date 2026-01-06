import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CorsErrorHelperProps {
  error?: Error | null;
  onRetry?: () => void;
}

export function CorsErrorHelper({ error, onRetry }: CorsErrorHelperProps) {
  const isCorsError = error?.message?.toLowerCase().includes('cors') || 
                      error?.message?.toLowerCase().includes('fetch') ||
                      error?.message?.toLowerCase().includes('network');

  if (!isCorsError) return null;

  const clearCacheAndRetry = () => {
    // Clear all Supabase-related localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Reload the page
    window.location.reload();
  };

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Connection Error</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Unable to connect to the authentication service. This might be due to:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Network connectivity issues</li>
          <li>Browser cache or cookies blocking the connection</li>
          <li>Security settings preventing cross-origin requests</li>
        </ul>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCacheAndRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Clear Cache & Retry
          </Button>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}
        </div>
        <p className="text-xs mt-2 opacity-80">
          If the problem persists, please contact your system administrator or try accessing the application from a different browser.
        </p>
      </AlertDescription>
    </Alert>
  );
}
