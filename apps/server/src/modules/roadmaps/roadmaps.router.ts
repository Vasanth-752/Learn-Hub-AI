import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// ── POST /api/goals/:id/roadmap ──────────────────────────────────────────────
router.post('/goals/:id/roadmap', requireAuth, async (req: Request, res: Response) => {
  const goalId = req.params.id;
  const { structure } = req.body; // e.g., { sprints: [{ title, topics: [{ title }] }] }

  if (!structure || !structure.sprints) {
    return res.status(400).json({ error: 'Valid roadmap structure is required' });
  }

  try {
    // 1. Verify goal belongs to user
    const { data: goal, error: goalError } = await req.supabase!
      .from('learning_goals')
      .select('id')
      .eq('id', goalId)
      .eq('user_id', req.user!.id)
      .single();

    if (goalError || !goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // 2. Insert roadmap
    const { data: roadmap, error: roadmapError } = await req.supabase!
      .from('roadmaps')
      .insert({
        goal_id: goalId,
        structure,
        version: 1
      })
      .select()
      .single();

    if (roadmapError) throw roadmapError;

    // 3. Insert sprints & topics manually
    // Since Supabase RPC/transactions are limited from the client SDK, we'll do sequential inserts
    // or a single RPC if we had one. Sequential is fine for this prototype.
    for (let i = 0; i < structure.sprints.length; i++) {
      const sprintData = structure.sprints[i];
      const { data: sprint, error: sprintError } = await req.supabase!
        .from('sprints')
        .insert({
          roadmap_id: roadmap.id,
          title: sprintData.title,
          order_index: i,
          status: 'pending'
        })
        .select()
        .single();
      
      if (sprintError) throw sprintError;

      if (sprintData.topics && sprintData.topics.length > 0) {
        const topicsToInsert = sprintData.topics.map((t: any, j: number) => ({
          sprint_id: sprint.id,
          title: t.title,
          order_index: j,
          is_completed: false
        }));

        const { error: topicsError } = await req.supabase!
          .from('topics')
          .insert(topicsToInsert);
        
        if (topicsError) throw topicsError;
      }
    }

    res.status(201).json({ roadmap });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/goals/:id/roadmap ───────────────────────────────────────────────
router.get('/goals/:id/roadmap', requireAuth, async (req: Request, res: Response) => {
  const goalId = req.params.id;

  try {
    // 1. Verify goal belongs to user
    const { data: goal, error: goalError } = await req.supabase!
      .from('learning_goals')
      .select('id')
      .eq('id', goalId)
      .eq('user_id', req.user!.id)
      .single();

    if (goalError || !goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // 2. Fetch the latest roadmap for this goal
    const { data: roadmaps, error: roadmapError } = await req.supabase!
      .from('roadmaps')
      .select(`
        id, version, structure, created_at,
        sprints (
          id, title, order_index, status,
          topics (
            id, title, is_completed, order_index, resources
          )
        )
      `)
      .eq('goal_id', goalId)
      .order('version', { ascending: false })
      .limit(1);

    if (roadmapError) throw roadmapError;
    if (!roadmaps || roadmaps.length === 0) {
      return res.status(404).json({ error: 'No roadmap found for this goal' });
    }

    const roadmap = roadmaps[0];
    
    // Supabase nested selects don't guarantee array order, so sort them
    if (roadmap.sprints) {
      roadmap.sprints.sort((a: any, b: any) => a.order_index - b.order_index);
      roadmap.sprints.forEach((sprint: any) => {
        if (sprint.topics) {
          sprint.topics.sort((a: any, b: any) => a.order_index - b.order_index);
        }
      });
    }

    res.json({ roadmap });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/topics/:id ────────────────────────────────────────────────────
router.patch('/topics/:id', requireAuth, async (req: Request, res: Response) => {
  const { title, is_completed, order_index } = req.body;
  const updates: any = {};
  
  if (title !== undefined) updates.title = title;
  if (is_completed !== undefined) updates.is_completed = is_completed;
  if (order_index !== undefined) updates.order_index = order_index;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    // With RLS "users_own_data" ON topics FOR ALL USING (auth.uid() IN ...),
    // if the topic doesn't belong to the user, update() will affect 0 rows or error.
    const { data, error } = await req.supabase!
      .from('topics')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(404).json({ error: 'Topic not found or unauthorized' });
    
    // In Phase 4, we'll write to progress_logs when is_completed changes. For now, just return.
    res.json({ topic: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
