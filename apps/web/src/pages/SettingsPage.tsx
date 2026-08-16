import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User, Upload, Sun, Moon, Monitor, FileText, FileDown,
  CheckCircle, AlertCircle, ArrowLeft, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { applyTheme } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { cn } from '../lib/utils';

// ─── Schema ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z.string().min(1, 'Display name is required').max(80, 'Max 80 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// ─── Types ───────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  theme_preference: string;
  download_format_preference: string;
  created_at: string;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function fetchProfile(jwt: string): Promise<Profile> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  const { profile } = await res.json();
  return profile;
}

async function patchProfile(jwt: string, updates: Partial<Profile>): Promise<Profile> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || 'Failed to update profile');
  }
  const { profile } = await res.json();
  return profile;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { session } = useAuthStore();
  const jwt = session?.access_token ?? '';
  const queryClient = useQueryClient();

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Profile query ─────────────────────────────────────────────────────────
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['profile', jwt],
    queryFn: () => fetchProfile(jwt),
    enabled: !!jwt,
    staleTime: 1000 * 60 * 5,
  });

  // ── Profile form ──────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '' },
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) reset({ full_name: profile.full_name ?? '' });
  }, [profile, reset]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const profileMutation = useMutation({
    mutationFn: (updates: Partial<Profile>) => patchProfile(jwt, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile', jwt], updated);
      showToast('success', 'Profile updated successfully');
      // Apply theme immediately if it changed
      applyTheme(updated.theme_preference);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED.includes(file.type)) {
      showToast('error', 'Only JPEG, PNG, WebP, or GIF images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image must be smaller than 5 MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;

      // Upload directly to Supabase Storage using the frontend client
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      // Persist to profiles table via PATCH /api/profile
      await profileMutation.mutateAsync({ avatar_url: publicUrl });
    } catch (err: any) {
      showToast('error', err.message || 'Avatar upload failed');
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onProfileSubmit(data: ProfileFormData) {
    await profileMutation.mutateAsync({ full_name: data.full_name });
  }

  async function handleThemeChange(theme: string) {
    applyTheme(theme); // instant visual feedback
    await profileMutation.mutateAsync({ theme_preference: theme });
  }

  async function handleFormatChange(format: string) {
    await profileMutation.mutateAsync({ download_format_preference: format });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF', icon: FileDown },
    { value: 'markdown', label: 'Markdown', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-oatmeal/20 bg-surface-container-lowest/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="btn-ghost p-2 rounded-lg"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-headline-md font-serif text-on-surface">Settings</h1>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-up',
            toast.type === 'success'
              ? 'bg-surface-container-highest text-on-surface border border-oatmeal/20'
              : 'bg-error-container text-on-error-container border border-error/20'
          )}
        >
          {toast.type === 'success'
            ? <CheckCircle className="size-4 text-secondary" />
            : <AlertCircle className="size-4 text-error" />}
          {toast.message}
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-fade-in">

        {/* ── Profile ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="size-5 text-primary" />
              <h2 className="text-headline-md">Profile</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Your avatar"
                    className="size-20 rounded-full object-cover border-2 border-oatmeal/30"
                  />
                ) : (
                  <div className="size-20 rounded-full bg-primary-container/20 flex items-center justify-center border-2 border-oatmeal/30">
                    <User className="size-9 text-primary/60" />
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-full bg-surface/70 flex items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-label-md font-medium">Profile Photo</p>
                <p className="text-label-sm text-on-surface-variant">JPG, PNG, WebP or GIF — max 5 MB</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  loading={avatarUploading}
                  className="gap-2"
                >
                  <Upload className="size-4" />
                  {avatarUploading ? 'Uploading…' : 'Upload Photo'}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            {/* Display name */}
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              <Input
                {...register('full_name')}
                label="Display Name"
                placeholder="Your name"
                error={errors.full_name?.message}
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" loading={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>

            {/* Email (read-only) */}
            <div>
              <label className="label">Email Address</label>
              <p className="input bg-surface-container/50 text-on-surface-variant cursor-default">
                {session?.user?.email}
              </p>
              <p className="text-label-sm text-on-surface-variant mt-1">
                Email is managed through your auth provider and cannot be changed here.
              </p>
            </div>

          </CardContent>
        </Card>

        {/* ── Theme ───────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sun className="size-5 text-primary" />
              <h2 className="text-headline-md">Appearance</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-on-surface-variant text-sm mb-4">
              Choose how LearnHub AI looks. System follows your OS preference.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(({ value, label, icon: Icon }) => {
                const isActive = (profile?.theme_preference ?? 'system') === value;
                return (
                  <button
                    key={value}
                    id={`theme-${value}`}
                    onClick={() => handleThemeChange(value)}
                    disabled={profileMutation.isPending}
                    className={cn(
                      'flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all duration-150',
                      isActive
                        ? 'border-primary bg-primary-container/10 text-primary'
                        : 'border-oatmeal/30 text-on-surface-variant hover:border-oatmeal hover:text-on-surface'
                    )}
                    aria-pressed={isActive}
                  >
                    <Icon className="size-6" />
                    <span className="text-label-md font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Download Format ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileDown className="size-5 text-primary" />
              <h2 className="text-headline-md">Export Format</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-on-surface-variant text-sm mb-4">
              Default format when exporting notes.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map(({ value, label, icon: Icon }) => {
                const isActive = (profile?.download_format_preference ?? 'pdf') === value;
                return (
                  <button
                    key={value}
                    id={`format-${value}`}
                    onClick={() => handleFormatChange(value)}
                    disabled={profileMutation.isPending}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-150',
                      isActive
                        ? 'border-primary bg-primary-container/10 text-primary'
                        : 'border-oatmeal/30 text-on-surface-variant hover:border-oatmeal hover:text-on-surface'
                    )}
                    aria-pressed={isActive}
                  >
                    <Icon className="size-5" />
                    <span className="text-label-md font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Account ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-error" />
              <h2 className="text-headline-md">Account</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-low border border-oatmeal/20">
              <div>
                <p className="text-label-md font-medium">Sign Out</p>
                <p className="text-label-sm text-on-surface-variant mt-0.5">Sign out of your current session.</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  useAuthStore.getState().signOut();
                  window.location.href = '/';
                }}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
