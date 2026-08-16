import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requireAuth } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test protected route - returns current user's profile via RLS
app.get('/api/me', requireAuth, async (req, res) => {
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

    res.json({ user: req.user, profile: data });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
