import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// ── POST /api/notes ─────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { title, content_markdown, goal_id, topic_id } = req.body;
  
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    const { data, error } = await req.supabase!
      .from('notes')
      .insert({
        user_id: req.user!.id,
        title,
        content_markdown: content_markdown || '',
        source: 'manual',
        goal_id: goal_id || null,
        topic_id: topic_id || null
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ note: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/notes ──────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { goalId, topicId } = req.query;

  try {
    let query = req.supabase!
      .from('notes')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('updated_at', { ascending: false });

    if (goalId) query = query.eq('goal_id', goalId as string);
    if (topicId) query = query.eq('topic_id', topicId as string);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ notes: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/notes/:id ──────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await req.supabase!
      .from('notes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();

    if (error) return res.status(404).json({ error: 'Note not found' });
    res.json({ note: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/notes/:id ────────────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const { title, content_markdown } = req.body;
  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (content_markdown !== undefined) updates.content_markdown = content_markdown;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  updates.updated_at = new Date().toISOString();

  try {
    // In Phase 5, we'll insert into note_versions before overwriting here.
    const { data, error } = await req.supabase!
      .from('notes')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) return res.status(404).json({ error: 'Note not found or unauthorized' });
    res.json({ note: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/notes/:id ───────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { error } = await req.supabase!
      .from('notes')
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
