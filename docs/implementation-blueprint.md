# LearnHub AI — Production Implementation Blueprint (v2)

**Prepared by:** Product, Architecture, Full-Stack, AI, UI/UX, Database, DevOps & Security team
**Status:** Final blueprint — ready for build phase
**Scale target:** 10–20 concurrent users (v1), architected to not require a rewrite at 10,000 users

> **v2 revision note:** After a soul-alignment review against the original project story, three architectural decisions changed from v1: (1) AI Chat is now the real generation hub for roadmaps and notes, using tool/function calling, not a separate form; (2) Notes support both AI-generated topic-linked notes and freeform manual notes; (3) "download location" is confirmed as filename/format preference only, no folder picker. These are reflected throughout this document. Sections unaffected by the change are unchanged from v1.

---

## 0. Two Judgment Calls Made in v1 (still valid)

### A. MongoDB vs Supabase → **Supabase (Postgres)**
You wanted: flexible data, but also built-in auth/storage/realtime, and SQL query patterns. Those last two are Supabase's entire identity, and "flexible" doesn't require MongoDB — Postgres's `JSONB` column type gives you schema-flexible fields (roadmap trees, chat message payloads) *inside* a relational database. The clincher: RAG needs a vector store, and Supabase ships **pgvector** natively — one database for app data, auth, file storage, and vector search.

**This makes the stack "MERN-adjacent," not literal MERN** — it's Postgres, not Mongo. Confirmed acceptable in prior review.

### B. AI response delivery → **Streaming (SSE), now including generation**
Chat responses stream token-by-token. With Chat now acting as the generation hub (see §4 below), roadmap and note generation also happen *inside* the streaming chat exchange — the model streams its conversational reply, and when it decides to generate a roadmap or note, it issues a **tool call** (a discrete, non-streamed structured action) mid-conversation, then continues streaming its response once the tool result comes back (e.g., "I've built your 6-sprint roadmap — want to see it?"). The structured-JSON-validation safety net from v1 is preserved; it just now sits behind a tool call instead of a standalone endpoint.

---

## 1. Final Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React (Vite) + TypeScript | SPA, no SSR needed |
| Styling | Tailwind CSS + shadcn/ui (restyled to your palette) | |
| State/Data | TanStack Query (server state) + Zustand (client state) | |
| Backend | Node.js + Express + TypeScript | Layered architecture |
| Database | Supabase (Postgres) | Auth, Storage, Realtime, pgvector |
| AI Provider | Gemini (primary, via Antigravity access) + Claude (fallback) | Abstracted behind a provider interface; **both must support tool/function calling**, which both do |
| Embeddings/RAG | Gemini embeddings + Supabase `pgvector` | |
| Auth | Supabase Auth (email/password + Google & GitHub OAuth) | |
| File storage | Supabase Storage | Profile pictures; note PDFs generated on-demand, not stored |
| Frontend hosting | Vercel | |
| Backend hosting | Render | |
| CI/CD | GitHub Actions | |
| Monorepo tool | Turborepo (npm workspaces) | |
| PDF generation | `pdf-lib` or Puppeteer (server-side) | Filename/format preference only — no OS folder picker (see §11) |
| Rich text editor | Tiptap | Markdown-compatible |

---

## 2. Monorepo Structure

```
learnhub-ai/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── pages/            # Landing, Auth, Dashboard, Chat, Roadmap, Notes, Settings
│   │   │   ├── components/{ui/, shared/}
│   │   │   ├── features/{auth/, chat/, roadmap/, notes/, analytics/}
│   │   │   ├── hooks/, lib/, stores/, styles/, types/
│   │   └── vite.config.ts
│   └── server/
│       ├── src/
│       │   ├── modules/{auth/, users/, roadmap/, chat/, notes/, analytics/, recommendations/}
│       │   ├── middleware/        # auth guard, rate limiter, error handler
│       │   ├── ai/
│       │   │   ├── providers/     # gemini.ts, claude.ts (common interface incl. tool-calling)
│       │   │   ├── prompts/       # versioned prompt templates
│       │   │   ├── tools/         # generate_roadmap.ts, generate_note.ts — tool definitions + handlers
│       │   │   └── rag/           # embedding + retrieval logic
│       │   ├── db/, config/, server.ts
├── packages/{types/, ui-tokens/, config/}
├── supabase/{migrations/, seed.sql}
├── .github/workflows/
├── turbo.json
└── package.json
```

---

## 3. Database Schema (Supabase / Postgres)

All tables use `uuid` primary keys, timestamps, and Row Level Security (RLS).

```sql
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  avatar_url text,
  theme_preference text DEFAULT 'light',
  download_format_preference text DEFAULT 'pdf',   -- filename/format only, no path
  created_at timestamptz DEFAULT now()
)

learning_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  status text DEFAULT 'active',
  target_completion_date date,
  created_at timestamptz DEFAULT now()
)

roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES learning_goals(id),
  structure jsonb NOT NULL,
  version int DEFAULT 1,
  generated_from_conversation_id uuid REFERENCES conversations(id) NULL,  -- traceability to the chat that created it
  created_at timestamptz DEFAULT now()
)

sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid REFERENCES roadmaps(id),
  title text, order_index int, status text DEFAULT 'pending',
  started_at timestamptz, completed_at timestamptz
)

topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid REFERENCES sprints(id),
  title text, is_completed boolean DEFAULT false, order_index int,
  resources jsonb                    -- {youtube:[], courses:[], docs:[], other:[]}
)

notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  goal_id uuid REFERENCES learning_goals(id) NULL,
  topic_id uuid REFERENCES topics(id) NULL,          -- NEW: links an AI-generated note to its topic
  source text DEFAULT 'manual',                      -- NEW: 'manual' | 'ai_generated'
  generated_from_conversation_id uuid REFERENCES conversations(id) NULL,  -- NEW: traceability
  title text,
  content_markdown text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

note_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id),
  content_markdown text, version_number int, created_at timestamptz DEFAULT now()
)

conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  goal_id uuid REFERENCES learning_goals(id) NULL,
  title text,
  created_at timestamptz DEFAULT now()
)

messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  role text,                         -- user | assistant | tool
  content text,
  tool_call jsonb NULL,               -- NEW: records which tool was invoked and with what args, for audit/debug
  created_at timestamptz DEFAULT now()
)

message_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text,                  -- 'note' | 'message' | 'topic'
  source_id uuid, user_id uuid REFERENCES profiles(id),
  embedding vector(768), content_chunk text, created_at timestamptz DEFAULT now()
)

progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id), goal_id uuid REFERENCES learning_goals(id),
  activity_type text, duration_seconds int, logged_at timestamptz DEFAULT now()
)

ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id), feature text, tokens_used int, created_at timestamptz DEFAULT now()
)
```

**RLS policy pattern** (applied to every user-owned table):
```sql
CREATE POLICY "users_own_data" ON notes FOR ALL USING (auth.uid() = user_id);
```

---

## 4. AI / RAG Architecture — Chat as the Generation Hub

This is the section most changed from v1. The AI Chat page is now the primary way roadmaps and notes get created — matching the original vision of "a conversation with AI to generate notes, roadmap and doubt clarification."

**Provider abstraction:** `apps/server/src/ai/providers/` exposes a common interface supporting both plain streaming *and* tool/function calling. Gemini is primary; Claude is fallback.

**Tool definitions** (`apps/server/src/ai/tools/`):
- `generate_roadmap({ goalTitle, durationWeeks? })` → builds the structured sprint/topic JSON (same `zod`-validated schema as v1), persists to `roadmaps`/`sprints`/`topics`, links `generated_from_conversation_id`, returns a summary to the model to relay conversationally.
- `generate_note({ topicId, focus? })` → generates markdown note content for a specific topic, persists to `notes` with `source='ai_generated'` and `topic_id` set, returns a summary/preview to the model.
- `regenerate_roadmap({ goalId })` → same as above but increments `roadmaps.version`.

**How a conversation flows:**
1. User sends a message, e.g., "I want to learn React in 6 weeks" or "make me notes on this topic."
2. Server retrieves RAG context (see below) and sends the message + tool definitions to the model.
3. Model either replies conversationally, or emits a tool call. If a tool call: server executes it (validates output, writes to DB), sends the tool result back to the model, model continues streaming a natural-language confirmation ("Done — here's your roadmap, want me to walk through sprint 1?").
4. Client receives the streamed text as normal, plus a structured event when a tool completed (used to, e.g., show a "Roadmap created ✅ [View it]" inline card in the chat).

**RAG retrieval (unchanged from v1, still runs on every message):**
1. Embed the user's message.
2. Query `message_embeddings` via pgvector cosine similarity, scoped to `user_id` (and `goal_id` if active), pulling top-k relevant chunks from the user's own notes, prior messages, and roadmap topics.
3. Inject retrieved chunks as context alongside a sliding window of recent messages.
4. After the exchange, embed and store new content (messages, and any newly generated note/roadmap text) for future retrieval.

**Freeform notes still exist independently** — a user can create/edit a note manually on the Notes page without going through chat at all. The `source` field (`manual` vs `ai_generated`) and optional `topic_id` are what let both flows share one table without stepping on each other.

**Entry points into chat generation:** Dashboard's "New Goal" and "Continue Learning" quick actions now open (or continue) a chat conversation pre-seeded with context, rather than opening a separate form — consistent with chat being the real hub.

**Recommendations (YouTube/courses/docs):** unchanged from v1 — AI-suggested, generated as part of the `generate_roadmap` tool call and cached in `topics.resources`. Same caveat as before: links can be outdated/hallucinated; a "Report broken link" affordance exists, live validation deferred to a future phase.

**Rate limiting & cost control:** unchanged — `ai_usage_logs` backs a daily per-user quota, enforced before any AI call (including tool-invoking ones) is made.

**Moderation:** unchanged — lightweight pre-check before the main model call.

---

## 5. Authentication & Security
*(Unchanged from v1 — see prior version for full detail: Supabase Auth, Google/GitHub OAuth, email verification, JWT sessions, RLS on every table, `zod` input validation including tool-call arguments, rate limiting, secrets management, HTTPS/CORS.)*

One addition: tool-call arguments coming back from the model (e.g., `generate_roadmap`'s `goalTitle`) are validated with the same rigor as direct user input before being used — a model can be prompted into passing malformed or unexpected arguments, so the tool handler never trusts them blindly.

---

## 6. Page-by-Page Notes (updated)

### AI Chat Page — now explicitly the generation hub
Conversation list sidebar (grouped by goal), main chat pane with streaming responses, inline "action cards" when a tool completes (e.g., "Roadmap created — [View Roadmap]", "Note saved — [View Note]"), markdown rendering, ability to start a new conversation scoped to a goal or general doubt-clarification.

### Roadmap + Progress Page
Now primarily a **viewing/tracking surface**, not a creation surface — roadmaps are born in Chat. This page still supports manual edits (drag-reorder, rename a topic) and a "Regenerate via Chat" button that jumps into a pre-seeded conversation rather than firing a silent API call. Progress bars, analytics, timeline, estimated completion — unchanged from v1.

### Notes Page
Now shows **both** AI-generated and manual notes in one list, with a visual badge distinguishing `ai_generated` (and, when present, which topic it's linked to) from `manual`/freeform. Tiptap editor for create/edit either type, search, version history, PDF download — unchanged otherwise. AI-generated notes remain fully user-editable after creation (editing simply adds a new `note_versions` entry, same as any note).

### Dashboard
"New Goal" and "Continue Learning" quick actions now deep-link into the Chat page instead of a standalone form. Everything else (current goal, current sprint, recent progress, stats) unchanged from v1.

*(Landing, Auth, Settings, Profile — unchanged from v1.)*

---

## 7. UI/UX System
*(Unchanged from v1 — palette table, font pairing (Fraunces/Instrument Serif for headings, Inter for body), desktop-first v1 scope, shadcn component reuse. No changes needed here; none of the three revised decisions touch visual design.)*

---

## 8. DevOps & Deployment
*(Unchanged from v1 — Vercel frontend, Render backend, Supabase-managed DB, GitHub Actions CI/CD, Sentry for error tracking, Docker deferred.)*

---

## 9. Analytics Implementation
*(Unchanged from v1 — time spent, topics completed, streak count, backed by `progress_logs`.)*

---

## 10. Phased Build Roadmap (updated)

| Phase | Scope | Depends on |
|---|---|---|
| **0. Foundation** | Monorepo, Supabase schema + RLS, CI skeleton, design tokens | — |
| **1. Auth** | Register/Login/OAuth/Forgot/Reset, sessions | Phase 0 |
| **2. Core shell** | Landing, Dashboard shell, Settings/Profile, theme toggle | Phase 1 |
| **3. Roadmap & Notes data layer** | Schema-backed CRUD + viewing UI for roadmaps/sprints/topics/notes, **no AI generation yet** — manually creatable for dev/testing | Phase 1 |
| **4. Progress tracking** | Topic completion, progress bars, analytics widgets | Phase 3 |
| **5. Notes polish** | Rich-text editor, search, version history, PDF export, AI/manual badge | Phase 3 |
| **6. AI Chat + RAG + Generation Hub** | Streaming chat, RAG retrieval, **tool-calling for `generate_roadmap` and `generate_note`**, conversation history, action cards | Phases 3, 4, 5 |
| **7. Recommendations** | AI-suggested resources woven into `generate_roadmap` output | Phase 6 |
| **8. Hardening** | Rate limiting, quota, moderation, RLS audit, error tracking | All above |
| **9. Deploy** | Production deploy, smoke test, handoff | Phase 8 |

Note the reordering logic: Phase 3 now builds the *data layer and manual viewing/editing UI* for roadmaps and notes **without** AI, so there's something real for Phase 6's chat-driven tools to write into and for a developer to test against before the AI layer exists. Phase 6 absorbed what used to be v1's Phase 3 AI-generation work.

---

## 11. Open Items to Revisit Later

- Exact daily AI-quota numbers — needs real Gemini rate-limit/pricing numbers from Antigravity access.
- Whether AI-suggested resource links need live validation.
- Mobile responsive pass (deferred).
- Admin panel (deferred).
- Docker (deferred, structure kept compatible).
- **Resolved this round:** download preference is filename/format only — no OS folder picker. If real folder-level control becomes a hard requirement later, that's a Chrome-only File System Access API addition, not a default web capability, and would need to be explicitly scoped as a stretch feature.
