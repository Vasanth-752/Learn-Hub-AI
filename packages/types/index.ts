import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  theme_preference: z.string().default('light'),
  download_format_preference: z.string().default('pdf'),
  created_at: z.string().datetime().optional()
});
export type Profile = z.infer<typeof ProfileSchema>;

export const LearningGoalSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  status: z.string().default('active'),
  target_completion_date: z.string().nullable(),
  created_at: z.string().datetime().optional()
});
export type LearningGoal = z.infer<typeof LearningGoalSchema>;

export const ResourceSchema = z.object({
  youtube: z.array(z.string()).optional(),
  courses: z.array(z.string()).optional(),
  docs: z.array(z.string()).optional(),
  other: z.array(z.string()).optional(),
});
export type Resource = z.infer<typeof ResourceSchema>;

export const RoadmapSchema = z.object({
  id: z.string().uuid(),
  goal_id: z.string().uuid(),
  structure: z.record(z.any()), // JSONB
  version: z.number().default(1),
  generated_from_conversation_id: z.string().uuid().nullable(),
  created_at: z.string().datetime().optional()
});
export type Roadmap = z.infer<typeof RoadmapSchema>;

export const SprintSchema = z.object({
  id: z.string().uuid(),
  roadmap_id: z.string().uuid(),
  title: z.string(),
  order_index: z.number(),
  status: z.string().default('pending'),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable()
});
export type Sprint = z.infer<typeof SprintSchema>;

export const TopicSchema = z.object({
  id: z.string().uuid(),
  sprint_id: z.string().uuid(),
  title: z.string(),
  is_completed: z.boolean().default(false),
  order_index: z.number(),
  resources: ResourceSchema.nullable()
});
export type Topic = z.infer<typeof TopicSchema>;

export const NoteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  goal_id: z.string().uuid().nullable(),
  topic_id: z.string().uuid().nullable(),
  source: z.enum(['manual', 'ai_generated']).default('manual'),
  generated_from_conversation_id: z.string().uuid().nullable(),
  title: z.string(),
  content_markdown: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});
export type Note = z.infer<typeof NoteSchema>;

export const NoteVersionSchema = z.object({
  id: z.string().uuid(),
  note_id: z.string().uuid(),
  content_markdown: z.string(),
  version_number: z.number(),
  created_at: z.string().datetime().optional()
});
export type NoteVersion = z.infer<typeof NoteVersionSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  goal_id: z.string().uuid().nullable(),
  title: z.string(),
  created_at: z.string().datetime().optional()
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'tool']),
  content: z.string(),
  tool_call: z.record(z.any()).nullable(),
  created_at: z.string().datetime().optional()
});
export type Message = z.infer<typeof MessageSchema>;

// Tool arguments schemas
export const GenerateRoadmapArgsSchema = z.object({
  goalTitle: z.string(),
  durationWeeks: z.number().optional()
});
export type GenerateRoadmapArgs = z.infer<typeof GenerateRoadmapArgsSchema>;

export const GenerateNoteArgsSchema = z.object({
  topicId: z.string().uuid(),
  focus: z.string().optional()
});
export type GenerateNoteArgs = z.infer<typeof GenerateNoteArgsSchema>;
