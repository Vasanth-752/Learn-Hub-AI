import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, type LoginFormData, type RegisterFormData, type ForgotPasswordFormData, type ResetPasswordFormData } from '../lib/validations';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';

const GOOGLE_SVG = (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const GITHUB_SVG = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

export function AuthPage() {
  const [activeForm, setActiveForm] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'github' | null>(null);
  const { setSession } = useAuthStore();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const forgotForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsOAuthLoading(provider);
    setError(null);

    const redirectUrl = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      setError(error.message);
      setIsOAuthLoading(null);
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError(error.message);
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.email.split('@')[0],
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Registration successful! Please check your email to verify your account.');
      setActiveForm('login');
      registerForm.reset();
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setError(null);
    const redirectUrl = `${window.location.origin}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password reset email sent! Please check your inbox.');
      setActiveForm('login');
      forgotForm.reset();
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password updated successfully! Please log in with your new password.');
      setActiveForm('login');
      resetForm.reset();
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
      <Input
        {...loginForm.register('email')}
        type="email"
        label="Email"
        placeholder="you@example.com"
        error={loginForm.formState.errors.email?.message}
        disabled={loginForm.formState.isSubmitting}
      />
      <Input
        {...loginForm.register('password')}
        type="password"
        label="Password"
        placeholder="••••••••"
        error={loginForm.formState.errors.password?.message}
        disabled={loginForm.formState.isSubmitting}
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded border-oatmeal text-primary focus:ring-primary" />
          <span className="text-sm text-on-surface-variant">Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => setActiveForm('forgot')}
          className="text-sm link"
        >
          Forgot password?
        </button>
      </div>
      <Button type="submit" className="w-full" size="lg" loading={loginForm.formState.isSubmitting}>
        Sign In
      </Button>
    </form>
  );

  const renderRegisterForm = () => (
    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
      <Input
        {...registerForm.register('email')}
        type="email"
        label="Email"
        placeholder="you@example.com"
        error={registerForm.formState.errors.email?.message}
        disabled={registerForm.formState.isSubmitting}
      />
      <Input
        {...registerForm.register('password')}
        type="password"
        label="Password"
        placeholder="••••••••"
        error={registerForm.formState.errors.password?.message}
        disabled={registerForm.formState.isSubmitting}
      />
      <Input
        {...registerForm.register('confirmPassword')}
        type="password"
        label="Confirm Password"
        placeholder="••••••••"
        error={registerForm.formState.errors.confirmPassword?.message}
        disabled={registerForm.formState.isSubmitting}
      />
      <p className="text-sm text-on-surface-variant">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
      <Button type="submit" className="w-full" size="lg" loading={registerForm.formState.isSubmitting}>
        Create Account
      </Button>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="space-y-4">
      <p className="text-sm text-on-surface-variant text-center">
        Enter your email and we'll send you a link to reset your password.
      </p>
      <Input
        {...forgotForm.register('email')}
        type="email"
        label="Email"
        placeholder="you@example.com"
        error={forgotForm.formState.errors.email?.message}
        disabled={forgotForm.formState.isSubmitting}
      />
      <Button type="submit" className="w-full" size="lg" loading={forgotForm.formState.isSubmitting}>
        Send Reset Link
      </Button>
    </form>
  );

  const renderResetPasswordForm = () => (
    <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
      <p className="text-sm text-on-surface-variant text-center">
        Enter your new password below.
      </p>
      <Input
        {...resetForm.register('password')}
        type="password"
        label="New Password"
        placeholder="••••••••"
        error={resetForm.formState.errors.password?.message}
        disabled={resetForm.formState.isSubmitting}
      />
      <Input
        {...resetForm.register('confirmPassword')}
        type="password"
        label="Confirm New Password"
        placeholder="••••••••"
        error={resetForm.formState.errors.confirmPassword?.message}
        disabled={resetForm.formState.isSubmitting}
      />
      <Button type="submit" className="w-full" size="lg" loading={resetForm.formState.isSubmitting}>
        Update Password
      </Button>
    </form>
  );

  const renderOAuthButtons = () => (
    <div className="space-y-3">
      <Button
        variant="secondary"
        className="oauth-button"
        onClick={() => handleOAuthLogin('google')}
        loading={isOAuthLoading === 'google'}
        disabled={isOAuthLoading !== null}
      >
        {GOOGLE_SVG}
        Continue with Google
      </Button>
      <Button
        variant="secondary"
        className="oauth-button"
        onClick={() => handleOAuthLogin('github')}
        loading={isOAuthLoading === 'github'}
        disabled={isOAuthLoading !== null}
      >
        {GITHUB_SVG}
        Continue with GitHub
      </Button>
    </div>
  );

  return (
    <div className="auth-container animate-fade-in">
      <Card className="auth-card">
        <CardHeader className="auth-header">
          <h1 className="text-headline-lg">Welcome to LearnHub AI</h1>
          <p className="text-on-surface-variant mt-2">
            {activeForm === 'login' && 'Sign in to continue your learning journey'}
            {activeForm === 'register' && 'Create an account to get started'}
            {activeForm === 'forgot' && 'Reset your password'}
            {activeForm === 'reset' && 'Set a new password'}
          </p>
        </CardHeader>

        <CardContent className="auth-form">
          {error && (
            <div className="error-message animate-slide-up mb-4" role="alert">
              <AlertCircle className="size-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="success-message animate-slide-up mb-4" role="status">
              <CheckCircle className="size-4" />
              {success}
            </div>
          )}

          {activeForm === 'login' && renderLoginForm()}
          {activeForm === 'register' && renderRegisterForm()}
          {activeForm === 'forgot' && renderForgotPasswordForm()}
          {activeForm === 'reset' && renderResetPasswordForm()}

          {(activeForm === 'login' || activeForm === 'register') && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full divider" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-surface-container-lowest text-on-surface-variant">
                    Or continue with
                  </span>
                </div>
              </div>
              {renderOAuthButtons()}
            </>
          )}

          <CardFooter className="auth-footer">
            {activeForm === 'login' && (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveForm('register');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="link font-medium"
                >
                  Sign up
                </button>
              </>
            )}
            {activeForm === 'register' && (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveForm('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="link font-medium"
                >
                  Sign in
                </button>
              </>
            )}
            {activeForm === 'forgot' && (
              <>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveForm('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="link font-medium"
                >
                  Sign in
                </button>
              </>
            )}
            {activeForm === 'reset' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveForm('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="link font-medium"
                >
                  Back to sign in
                </button>
              </>
            )}
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  );
}