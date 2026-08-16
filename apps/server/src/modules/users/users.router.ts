/**
 * modules/users/users.router.ts
 * User-scoped routes. All routes require auth via requireAuth middleware.
 * Data access uses the request-scoped req.supabase (anon key + user JWT) so RLS is enforced.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// ── GET /api/me ─────────────────────────────────────────────────────────────
// Returns the current user's profile row. Used for boot-time profile hydration.
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.supabase!
      .from('profiles')
      .select('id, full_name, avatar_url, theme_preference, download_format_preference, created_at')
      .eq('id', req.user!.id)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Profile not found' });

    return res.json({ user: req.user, profile: data });
  } catch (err) {
    throw err;
  }
});

// ── GET /api/profile ─────────────────────────────────────────────────────────
// Same as /me — alias used by the Settings page to keep concerns separated.
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.supabase!
      .from('profiles')
      .select('id, full_name, avatar_url, theme_preference, download_format_preference, created_at')
      .eq('id', req.user!.id)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Profile not found' });

    return res.json({ profile: data });
  } catch (err) {
    throw err;
  }
});

// ── PATCH /api/profile ───────────────────────────────────────────────────────
// Updates the current user's profile. Accepts a subset of updatable fields.
// Avatar upload is handled client-side (direct to Supabase Storage); this endpoint
// only receives the resulting public URL via avatar_url.
router.patch('/profile', requireAuth, async (req: Request, res: Response) => {
  const { full_name, theme_preference, download_format_preference, avatar_url } = req.body as {
    full_name?: string;
    theme_preference?: string;
    download_format_preference?: string;
    avatar_url?: string;
  };

  // Build the update payload — only include fields that were actually provided
  const updates: Record<string, unknown> = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (theme_preference !== undefined) updates.theme_preference = theme_preference;
  if (download_format_preference !== undefined) updates.download_format_preference = download_format_preference;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided' });
  }

  try {
    const { data, error } = await req.supabase!
      .from('profiles')
      .update(updates)
      .eq('id', req.user!.id)
      .select('id, full_name, avatar_url, theme_preference, download_format_preference, created_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Profile not found' });

    return res.json({ profile: data });
  } catch (err) {
    throw err;
  }
});

export default router;
