# LearnHub AI — Phase-by-Phase Development Plan

**Companion to:** `LearnHub-AI-Implementation-Blueprint.md`
**Purpose:** This document breaks each phase from the blueprint's roadmap (§10) into concrete backend, frontend, database, and DevOps tasks, with a clear Definition of Done (DoD) for each phase. Build sequentially — each phase assumes the previous one is complete and deployed to at least the dev environment.

Legend: 🔧 Backend · 🎨 Frontend · 🗄️ Database · 🤖 AI · ⚙️ DevOps · 🔒 Security

---

## Phase 0 — Foundation

**Goal:** A working, empty, deployable skeleton. No features yet — just a solid base everything else builds on.

**⚙️ DevOps**
- Initialize Turborepo monorepo (`apps/web`, `apps/server`, `packages/types`, `packages/ui-tokens`, `packages/config`).
- Set up shared ESLint, Prettier, TypeScript configs in `packages/config`.
- Create Supabase project (dev + prod, or one project with clear environment separation if budget-constrained at this scale).
- Set up GitHub repo with branch protection on `main`.
- Configure GitHub Actions: lint + typecheck + build on every PR.
- Connect Vercel to `apps/web`; connect Render to `apps/server`.
- Set up `.env.example` files for both apps documenting every required variable.

**🗄️ Database**
- Write initial migration: `profiles`, `learning_goals`, `roadmaps`, `sprints`, `topics`, `notes`, `note_versions`, `conversations`, `messages`, `message_embeddings`, `progress_logs`, `ai_usage_logs`.
- Enable `pgvector` extension.
- Write RLS policies for every table (deny-by-default, then explicit "owner can access own rows" policy).
- Set up Supabase CLI migration workflow so schema changes are version-controlled, not made by hand in the dashboard.

**🎨 Frontend**
- Scaffold Vite + React + TypeScript app.
- Install and configure Tailwind with `packages/ui-tokens` (colors, fonts).
- Install shadcn/ui, restyle base primitives (Button, Input, Card, Dialog) with the palette.
- Set up React Router with placeholder routes for all 8 pages.
- Set up TanStack Query client and Supabase client.

**🔧 Backend**
- Scaffold Express + TypeScript app with a layered structure (`routes → controllers → services → db`).
- Set up global error-handling middleware (consistent JSON error shape).
- Set up Supabase server client (service-role key, server-side only).
- Health-check endpoint (`GET /api/health`) for Render + uptime checks.

**Definition of Done:**
- Empty React app deployed on Vercel, empty Express API deployed on Render, both talking to each other and to Supabase.
- CI passes on a trivial PR.
- Schema exists in Supabase with RLS enabled on every table (verified by attempting a cross-user query and confirming it's blocked).

---

## Phase 1 — Authentication

**Goal:** A user can register, log in (including via Google/GitHub), reset their password, and stay securely logged in across page reloads.

**🔧 Backend**
- Configure Supabase Auth providers: Email, Google OAuth, GitHub OAuth (register OAuth apps with each provider, add redirect URLs).
- `POST /api/auth/register` (or client-direct via Supabase SDK — decide based on whether you need custom post-registration logic, e.g., auto-creating a `profiles` row via a Postgres trigger).
- Postgres trigger: on `auth.users` insert → auto-create matching `profiles` row.
- Middleware: `requireAuth` — validates JWT on every protected route, attaches `user` to `req`.

**🎨 Frontend**
- `/auth` page: Login / Register tabs, Forgot Password flow, Reset Password flow (token-based, from email link).
- Google + GitHub OAuth buttons (Supabase SDK handles the redirect flow).
- Form validation (email format, password strength) using `zod` + `react-hook-form`.
- Auth state management: Zustand store or React context wrapping the Supabase session; auto-refresh handled by Supabase client.
- Protected route wrapper — redirects unauthenticated users to `/auth`.
- Error states: invalid credentials, unverified email, OAuth failure, rate-limited.

**🔒 Security**
- Rate limit `/auth/*` endpoints (`express-rate-limit`) against brute force.
- Confirm email verification is required before first login (Supabase setting).
- Confirm RLS policies correctly key off `auth.uid()` now that real users exist.

**Definition of Done:**
- A real user can register with email, verify email, log in, log out, reset a forgotten password, and log in via Google and GitHub — all against the deployed environment, not just localhost.
- Refreshing the page keeps the user logged in.
- An unauthenticated request to a protected API route returns 401.

---

## Phase 2 — Core Application Shell

**Goal:** The logged-in "frame" of the app exists — navigation, theme, settings, profile — even though the core features (roadmap, chat, notes) are still empty.

**🎨 Frontend**
- App shell: sidebar/topbar navigation (Dashboard, AI Chat, Roadmap, Notes, Settings), consistent across all authenticated pages.
- Landing page: hero, features section, "Get Started" → `/auth`. Fully static, no auth required.
- Settings page: theme toggle (light/dark, persisted to `profiles.theme_preference` and/or `localStorage`), account settings (email, change password), sign out.
- Profile section within Settings: display name, avatar upload, basic learning stats placeholder (wired to real data in Phase 4).
- Dashboard page: layout scaffolded with placeholder cards (Current Goal, Current Sprint, Recent Progress, Quick Actions) — real data wired in Phase 3/4.

**🔧 Backend**
- `GET/PATCH /api/profile` — fetch and update profile info.
- `POST /api/profile/avatar` — upload to Supabase Storage, return public/signed URL.

**🗄️ Database**
- Confirm Supabase Storage bucket for avatars with correct access policy (public-read or signed-URL, your call — signed URLs recommended for consistency with the "no unnecessary public data" principle).

**Definition of Done:**
- Logged-in user can navigate every page (even if empty), toggle theme and see it persist across sessions, update their profile and avatar, and sign out cleanly.
- Landing page is polished and matches the palette/font system.

---

## Phase 3 — Roadmap Engine (Core Feature #1)

**Goal:** A user can enter a learning goal and receive an AI-generated, structured, multi-sprint roadmap they can view and edit.

**🤖 AI**
- Build the provider abstraction (`ai/providers/gemini.ts`, `ai/providers/claude.ts` implementing a shared interface).
- Design and version the roadmap-generation prompt (`ai/prompts/roadmap.ts`), instructing strict JSON output matching a `zod` schema: `{ sprints: [{ title, topics: [{ title, estimatedHours }] }] }`.
- Implement JSON validation + one automatic retry-with-stricter-prompt on failure.
- Wire in the AI usage quota check (against `ai_usage_logs`) before allowing a generation call.

**🔧 Backend**
- `POST /api/goals` — create a new `learning_goals` row.
- `GET /api/goals` — list user's goals (supports multiple concurrent goals).
- `POST /api/goals/:id/roadmap` — trigger AI generation, persist to `roadmaps`/`sprints`/`topics`.
- `POST /api/goals/:id/roadmap/regenerate` — regenerate, incrementing `roadmaps.version`.
- `PATCH /api/topics/:id` — manual edit of a topic (title, mark complete — completion wired properly in Phase 4).
- `GET /api/goals/:id/roadmap` — fetch full roadmap tree for rendering.

**🎨 Frontend**
- "New Goal" flow: input field + submit → loading state (AI generation takes several seconds — show a clear progress indicator, not a frozen button) → redirect to the generated roadmap.
- Roadmap + Progress page (structure only in this phase): goal switcher, sprint timeline, expandable topic lists, "Regenerate" and manual "Edit" actions.
- Dashboard cards now wired to real active-goal/current-sprint data.

**Definition of Done:**
- User submits "Learn React in 6 weeks," receives a well-structured multi-sprint roadmap within a reasonable wait time with a visible loading state, can view it on the Roadmap page, manually edit a topic title, and regenerate the whole roadmap.
- Roadmap generation respects the daily AI quota and shows a clear message when exceeded.

---

## Phase 4 — Progress Tracking & Analytics

**Goal:** Completing topics updates visible progress, streaks, and time-spent stats across Dashboard and Roadmap pages.

**🔧 Backend**
- `PATCH /api/topics/:id/complete` — mark complete/incomplete, writes a `progress_logs` entry.
- `POST /api/progress/session` — log a time-spent session (client sends duration on page unmount/interval).
- `GET /api/analytics/summary?goalId=` — aggregated stats: % complete, time spent, streak count, estimated completion date.
- Streak calculation logic (consecutive days with ≥1 `progress_logs` entry) in a shared `analyticsService`.

**🎨 Frontend**
- Topic checkboxes wired to completion endpoint, instantly updating progress bars (optimistic UI via TanStack Query).
- Roadmap + Progress page: progress bars per sprint and overall, analytics widgets (time spent, streak badge, estimated completion).
- Dashboard: "Learning statistics" and "Overall progress summary" cards wired to `/api/analytics/summary`.

**Definition of Done:**
- Marking topics complete moves the progress bar in real time on both Dashboard and Roadmap pages.
- Streak count correctly increments/resets based on daily activity.
- Estimated completion date recalculates based on remaining topics and pace.

---

## Phase 5 — Notes

**Goal:** Full notes CRUD with rich text, search, version history, and PDF export.

**🔧 Backend**
- `POST/GET/PATCH/DELETE /api/notes` — standard CRUD, scoped to `user_id` via RLS.
- On every `PATCH`, insert the previous content into `note_versions` before overwriting — implements version history without extra client complexity.
- `GET /api/notes/:id/versions` — list version history; `GET /api/notes/:id/versions/:versionId` — fetch a specific past version.
- `GET /api/notes/search?q=` — Postgres full-text search (`tsvector`/`tsquery`) on `content_markdown`.
- `GET /api/notes/:id/pdf` — server-side render (markdown → styled HTML → PDF via Puppeteer or `pdf-lib`) and stream the file back.

**🎨 Frontend**
- Notes page: list/grid view with search bar, Tiptap editor (markdown-compatible) for create/edit, delete confirmation dialog.
- Version history UI: simple list of past versions with timestamps, "View" and "Restore" actions.
- "Download PDF" button per note.

**Definition of Done:**
- User can create, edit (rich text), search, delete, and download a note as a well-formatted PDF.
- Editing a note twice shows two entries in version history, and restoring an old version works correctly.

---

## Phase 6 — AI Chat with RAG (Core Feature #2)

**Goal:** Context-aware AI chat that streams responses and can reference the user's own notes and roadmap content.

**🤖 AI**
- Embedding pipeline: on note save and on message send, generate embeddings and upsert into `message_embeddings` (chunking long notes into passages before embedding).
- Retrieval logic: on each chat message, embed the query, run a `pgvector` cosine-similarity search scoped to `user_id` (and `goal_id` if a goal is active), pull top-k chunks.
- Prompt assembly: system prompt + retrieved context chunks + sliding-window recent message history + new user message.
- Streaming: implement SSE endpoint, stream tokens from the provider straight through to the client.
- Lightweight moderation pre-check before the main model call (per your requirement).
- Auto-generate a short conversation title after the first exchange (cheap follow-up call or derived from the first message).

**🔧 Backend**
- `POST /api/conversations` — create new conversation (optionally scoped to a goal).
- `GET /api/conversations` — list, grouped by goal, for the sidebar.
- `GET /api/conversations/:id/messages` — fetch history.
- `POST /api/conversations/:id/messages` (SSE) — send message, stream AI response, persist both messages + trigger embedding.
- AI usage quota check before each chat call.

**🎨 Frontend**
- AI Chat page: conversation sidebar (grouped by goal, "New Conversation" action), main pane with streaming message rendering (markdown-aware), auto-scroll, typing indicator.
- Recent conversations surfaced on Dashboard, linking back into this page.

**Definition of Done:**
- User can ask a question referencing something in their own notes or roadmap, and the AI response demonstrably uses that context (not just generic knowledge).
- Responses visibly stream token-by-token.
- Conversation history persists and reloads correctly across sessions.
- Off-topic/abusive input is caught by the moderation pre-check before reaching the main model.

---

## Phase 7 — Resource Recommendations

**Goal:** Every topic surfaces AI-suggested YouTube videos, courses, official docs, and supplementary resources.

**🤖 AI**
- Extend the roadmap-generation prompt (or add a follow-up per-topic call, evaluate cost vs. single-pass generation) to produce a `resources` object per topic: `{ youtube: [], courses: [], docs: [], other: [] }`, each with a title, URL, and one-line reason it's relevant.
- Add a "Report broken/incorrect link" affordance that logs to a simple table for your later review — no auto-validation in v1, per the documented tradeoff in the blueprint.

**🔧 Backend**
- `topics.resources` populated at roadmap-generation time (Phase 3 endpoint extended).
- `POST /api/topics/:id/report-resource` — logs a reported bad link.

**🎨 Frontend**
- Topic detail view on the Roadmap page: resource cards grouped by type (YouTube/Courses/Docs/Other), each opening in a new tab, with the report-link affordance.

**Definition of Done:**
- Every generated topic has at least one resource per category (or a graceful "no resources found" state).
- Reporting a broken link works and is visible to you (even just as a raw table query) for manual review.

---

## Phase 8 — Hardening

**Goal:** The application is safe, resilient, and observable before real users touch it.

**🔒 Security**
- Full RLS audit: attempt cross-user access on every table from a test account, confirm all blocked.
- Confirm all AI-generated content is validated before storage (no unvalidated JSON reaching the DB).
- Confirm rate limiting is active on auth endpoints and AI endpoints.
- Dependency audit (`npm audit`, Dependabot enabled on the repo).
- Confirm secrets are not present in any client bundle (check the built `apps/web` output for leaked keys).

**⚙️ DevOps**
- Set up Sentry (or equivalent) on both frontend and backend.
- Add structured logging on the backend (request id, user id, route, duration) for debugging without exposing sensitive data in logs.
- Load-test the AI endpoints lightly (even at 10–20 users, confirm quota logic and streaming hold up under a few concurrent requests).

**🎨 Frontend / 🔧 Backend**
- Polish pass: loading states, empty states, error boundaries on every page (not just happy-path).
- Accessibility pass on core flows (keyboard navigation, focus states, color contrast against the palette — Palladian/Oatmeal combinations especially need a contrast check for text).

**Definition of Done:**
- No cross-user data leakage under manual testing.
- Every page has a graceful loading/empty/error state — nothing renders blank or crashes on missing data.
- Errors in production are visible to you via Sentry, not just silently failing.

---

## Phase 9 — Deploy & Handoff

**Goal:** Production is live, verified, and documented.

**⚙️ DevOps**
- Final production environment variable audit (Supabase prod keys, AI provider prod keys, correct CORS origin).
- <!-- TODO [Phase 9 — GitHub OAuth Production]: GitHub OAuth app was registered in Phase 1 with a localhost/dev redirect URL. Before launch, update the GitHub OAuth app's "Homepage URL" and "Authorization callback URL" to the production domain (e.g. https://learnhubai.com/auth/callback) in the GitHub Developer Settings, then smoke-test a GitHub login on the live production URL. Deliberately deferred from Phase 1 — not a bug. -->
- Smoke test the full user journey end-to-end in production: register → verify → create goal → generate roadmap → complete a topic → create a note → chat with AI → export PDF → sign out.
- DNS/custom domain setup if applicable.

**📄 Documentation**
- `README.md` covering local setup, environment variables, and deployment process.
- Short internal doc on how to adjust the AI quota numbers once you have real Gemini usage data (per the blueprint's Open Items).

**Definition of Done:**
- LearnHub AI is live at a production URL, the full user journey works without manual intervention, and you (or anyone else) could set up the project locally from the README alone.

---

## How to Use This Plan

- Treat each phase as a milestone/mini-sprint — don't start the next phase's frontend work until the current phase's backend + DB pieces are done, since most frontend work in this plan depends on a working API to bind to.
- The "Definition of Done" per phase is your acceptance checklist — if something on that list doesn't work, the phase isn't complete yet, regardless of how much code has been written.
- Phase 6 (AI Chat + RAG) is the most technically demanding phase — it depends on real data existing from Phases 3 and 5 (roadmap content and notes) to have anything meaningful to retrieve, which is why it's sequenced after them rather than earlier despite being a "core feature."
