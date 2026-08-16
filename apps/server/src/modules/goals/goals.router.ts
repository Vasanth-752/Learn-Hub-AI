import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// ── POST /api/goals ─────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { title, target_completion_date } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    const { data, error } = await req.supabase!
      .from('learning_goals')
      .insert({
        user_id: req.user!.id,
        title,
        target_completion_date: target_completion_date || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ goal: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/goals ──────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { status } = req.query;

  try {
    let query = req.supabase!
      .from('learning_goals')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status as string);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ goals: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/goals/:id ──────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.supabase!
      .from('learning_goals')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();

    if (error) return res.status(404).json({ error: 'Goal not found' });
    res.json({ goal: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/goals/:id ────────────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const { title, status, target_completion_date } = req.body;
  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (status !== undefined) updates.status = status;
  if (target_completion_date !== undefined) updates.target_completion_date = target_completion_date;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    const { data, error } = await req.supabase!
      .from('learning_goals')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) return res.status(404).json({ error: 'Goal not found or unauthorized' });
    res.json({ goal: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/goals/:id ───────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { error } = await req.supabase!
      .from('learning_goals')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
