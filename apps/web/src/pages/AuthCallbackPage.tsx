import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        setSession(data.session);
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage('No session found. Please try signing in again.');
      }
    };

    handleCallback();
  }, [setSession]);

  if (status === 'loading') {
    return (
      <div className="auth-container">
        <Card className="auth-card">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-on-surface-variant">Completing sign in...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="auth-container">
        <Card className="auth-card">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
            <AlertCircle className="size-8 text-error" />
            <h2 className="text-headline-md">Sign In Failed</h2>
            <p className="text-on-surface-variant max-w-xs">
              {errorMessage || 'Something went wrong. Please try again.'}
            </p>
            <Button onClick={() => window.location.href = '/auth'} variant="primary">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
          <div className="size-16 rounded-full bg-secondary-container/20 flex items-center justify-center">
            <CheckCircle className="size-8 text-secondary" />
          </div>
          <h2 className="text-headline-lg">Welcome Back!</h2>
          <p className="text-on-surface-variant">You've been signed in successfully.</p>
          <Button onClick={() => window.location.href = '/dashboard'} variant="primary" size="lg">
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}