-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tables
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  avatar_url text,
  theme_preference text DEFAULT 'light',
  download_format_preference text DEFAULT 'pdf',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE learning_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  status text DEFAULT 'active',
  target_completion_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  goal_id uuid REFERENCES learning_goals(id) NULL,
  title text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES learning_goals(id),
  structure jsonb NOT NULL,
  version int DEFAULT 1,
  generated_from_conversation_id uuid REFERENCES conversations(id) NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid REFERENCES roadmaps(id),
  title text, 
  order_index int, 
  status text DEFAULT 'pending',
  started_at timestamptz, 
  completed_at timestamptz
);

CREATE TABLE topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid REFERENCES sprints(id),
  title text, 
  is_completed boolean DEFAULT false, 
  order_index int,
  resources jsonb
);

CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  goal_id uuid REFERENCES learning_goals(id) NULL,
  topic_id uuid REFERENCES topics(id) NULL,
  source text DEFAULT 'manual',
  generated_from_conversation_id uuid REFERENCES conversations(id) NULL,
  title text,
  content_markdown text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE note_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id),
  content_markdown text, 
  version_number int, 
  created_at timestamptz DEFAULT now()
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  role text,
  content text,
  tool_call jsonb NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE message_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text,
  source_id uuid, 
  user_id uuid REFERENCES profiles(id),
  embedding vector(768), 
  content_chunk text, 
  created_at timestamptz DEFAULT now()
);

CREATE TABLE progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id), 
  goal_id uuid REFERENCES learning_goals(id),
  activity_type text, 
  duration_seconds int, 
  logged_at timestamptz DEFAULT now()
);

CREATE TABLE ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id), 
  feature text, 
  tokens_used int, 
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users_own_data" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_data" ON learning_goals FOR ALL USING (auth.uid() = user_id);
-- roadmaps are accessed via goal_id
CREATE POLICY "users_own_data" ON roadmaps FOR ALL USING (auth.uid() IN (SELECT user_id FROM learning_goals WHERE id = roadmaps.goal_id));
-- sprints are accessed via roadmap_id
CREATE POLICY "users_own_data" ON sprints FOR ALL USING (auth.uid() IN (SELECT user_id FROM learning_goals WHERE id = (SELECT goal_id FROM roadmaps WHERE id = sprints.roadmap_id)));
-- topics are accessed via sprint_id
CREATE POLICY "users_own_data" ON topics FOR ALL USING (auth.uid() IN (SELECT user_id FROM learning_goals WHERE id = (SELECT goal_id FROM roadmaps WHERE id = (SELECT roadmap_id FROM sprints WHERE id = topics.sprint_id))));
CREATE POLICY "users_own_data" ON notes FOR ALL USING (auth.uid() = user_id);
-- note_versions are accessed via note_id
CREATE POLICY "users_own_data" ON note_versions FOR ALL USING (auth.uid() IN (SELECT user_id FROM notes WHERE id = note_versions.note_id));
CREATE POLICY "users_own_data" ON conversations FOR ALL USING (auth.uid() = user_id);
-- messages are accessed via conversation_id
CREATE POLICY "users_own_data" ON messages FOR ALL USING (auth.uid() IN (SELECT user_id FROM conversations WHERE id = messages.conversation_id));
CREATE POLICY "users_own_data" ON message_embeddings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON progress_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_data" ON ai_usage_logs FOR ALL USING (auth.uid() = user_id);

-- Trigger for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
