/**
 * modules/users/users.router.ts
 * User-scoped routes. Currently: GET /api/me (test/verification route).
 * Will grow to include GET/PATCH /api/profile, POST /api/profile/avatar in Phase 2.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// GET /api/me — returns current user's profile row via RLS-enforced req.supabase
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.supabase!
      .from('profiles')
      .select('id, full_name, avatar_url, theme_preference, download_format_preference, created_at')
      .eq('id', req.user!.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({ user: req.user, profile: data });
  } catch (err) {
    throw err; // propagate to global error handler
  }
});

export default router;
