# Chatbot training & knowledge system — design

Status: approved by Rishi (2026-08-23), ready for implementation planning.
Repos touched: `yakuzi-api` (NestJS + Python sidecar), `yakuzi-web` (`apps/admin`).

## Problem

The admin "AI Chatbot" page (`admin.dev.yukizi.com/chatbot`) lets Rishi test the
bot in a sandbox, but the "Learned Rules" panel below it — meant to persist
what he teaches the bot so it changes the live, customer-facing bot's
behavior — has never worked. Investigation found:

- The admin UI calls `GET/POST/PATCH/DELETE /admin/chatbot/rules` and
  `POST /chatbot/train/extract`. None of these routes exist anywhere in the
  API. There is no `ChatbotRule` database model. This is 100% unbuilt
  frontend scaffolding.
- A *different*, fully-working training path already exists and is wired
  end-to-end: `POST /chatbot/train/conversation` appends a conversation's
  text to the live system prompt, backed by a `ChatbotJob` table that gets
  re-synced into the Python sidecar on every API restart. The current admin
  UI never calls it.
- Training, even on the working path, is naive prompt concatenation: every
  saved conversation's raw transcript gets glued onto one giant system-prompt
  string, unconditionally included in every future chat. No relevance
  filtering, no ordering.
- The bot has exactly two tools (`search_products`, `get_order_status`). It
  cannot see blog content or product reviews.
- No conversation data is logged anywhere (relevant context for the
  analytics work planned as a separate follow-up project — out of scope
  here).

## Goals

1. Fix the actual save flow: reconnect the admin sandbox's "save this
   conversation" action to the training path that already works.
2. Let each saved training be marked **Core** or **Surface**, and manually
   ordered within its tier, so foundational instructions can be
   distinguished from supplementary ones.
3. Give the bot tool access to published blog content and product reviews,
   the same way it already looks up products/orders.
4. One "reset" action: wipe all saved trainings and revert the live prompt
   to default, so Rishi can discard the broken past attempts and start
   clean.
5. Keep the default (untrained) behavior a normal, unrestricted Gemini
   model for anything outside store-specific questions — this is already
   close to true today; only tighten the wording, not a rewrite.

## Non-goals

- Real fine-tuning or embedding-based retrieval. Prompt concatenation stays
  the mechanism; see "Known ceiling" below.
- Conversation analytics dashboard (mood/topic/day-wise breakdowns) — needs
  conversation logging that doesn't exist yet. Separate project.
- Search analytics dashboard — unrelated feature area. Separate project.
- Deleting/backfilling existing `ChatbotJob` rows automatically. Rishi
  triggers the reset himself, once, after this ships (see Rollout).

## Data model

Extend `ChatbotJob` (kept — not renamed, to minimize migration risk) in
`yakuzi-api/prisma/schema.prisma`:

```prisma
enum ChatbotTrainingTier {
  CORE
  SURFACE
}

model ChatbotJob {
  id        String              @id @default(uuid())
  jobId     String              // legacy — kept for old rows, unused by new saves
  status    String              // legacy — kept for old rows, unused by new saves
  history   Json?
  label     String?             // admin-facing short name; auto-derived from
                                 // the first user message if not supplied
  tier      ChatbotTrainingTier @default(SURFACE)
  order     Int                 @default(0)  // manual ordering within a tier
  createdAt DateTime            @default(now())
  updatedAt DateTime            @updatedAt

  @@map("chatbot_jobs")
}
```

`jobId`/`status` were part of an earlier, abandoned Gemini fine-tuning-job
attempt (`/train/dataset`, `/train/status/:jobId`, `monitor_tuning_job` in
`chatbot/main.py` — also dead code, left alone). New rows still populate them
with a generated id and a fixed status for backward compatibility with
anything that reads the table, but nothing in the new flow depends on them.

## API changes (`yakuzi-api`)

New `ChatbotAdminController` (mirrors the existing `BlogAdminController`
pattern: admin-guarded, registered in `ChatbotModule` alongside the existing
public `ChatbotController`):

- `GET /admin/chatbot/trainings` — list all, ordered by `tier` (CORE first)
  then `order` then `createdAt`.
- `POST /admin/chatbot/trainings` — body `{ history, tier?, label? }`.
  Validates at least one user→assistant pair (same rule the sidecar already
  enforces). Creates the row, then triggers a resync (see below).
- `PATCH /admin/chatbot/trainings/:id` — update `tier`, `order`, and/or
  `label`. Triggers a resync.
- `DELETE /admin/chatbot/trainings/:id` — delete one. Triggers a resync.
- `DELETE /admin/chatbot/trainings` — delete all + reset the sidecar prompt
  to default. This is the "start fresh" action.

"Resync" = `ChatbotService` re-reads all `ChatbotJob` rows in tier/order,
and calls the sidecar's `/train/sync` with them in that order (same
endpoint used today, just now fed a deliberately ordered list instead of
whatever `findMany()` happened to return).

## Sidecar changes (`chatbot/main.py`)

- `/train/sync` behavior is unchanged (it already just appends histories in
  the order it receives them) — the ordering guarantee comes from the
  NestJS side doing the sorted query, keeping the sidecar simple.
- Two new tool functions alongside `search_products`/`get_order_status`,
  registered in the same `tools=[...]` list passed to
  `GenerateContentConfig`:
  - `search_blogs(query: str)` — `ILIKE` match against `blog_posts.title`
    and `.excerpt` where `status = 'PUBLISHED'`, returns title + excerpt +
    slug for up to 5 matches.
  - `get_product_reviews(product_name: str)` — joins `reviews` to
    `catalog_products` on a name match, returns rating + comment for up to
    5 reviews plus an average rating, so the bot can answer "is this any
    good?" from real customer feedback instead of guessing.

## Admin UI changes (`apps/admin/app/chatbot/page.tsx`)

Replace the current "Learned Rules" table and the dead
`draftTrigger`/`draftInstruction` extraction flow with a "Saved Trainings"
list:

- Each row: label, tier badge, created date, expand-to-preview the saved
  conversation, delete.
- Drag-and-drop reordering within a tier using `@dnd-kit` (already a
  dependency, already used for Homepage Sections reordering — same
  pattern, no new library).
- "Save this conversation" button in the chat sandbox opens a small
  dialog: optional label, tier choice (default Surface), confirm → calls
  the new endpoint.
- "Reset all training" button, behind a confirm dialog, calls
  `DELETE /admin/chatbot/trainings`.

New/updated files: `apps/admin/api/chatbot.api.ts` (extend with the new
CRUD calls), `apps/admin/hooks/useChatbot.ts` (new hooks, drop the
`useChatbotRules`/`useExtractChatbotRule` calls to dead endpoints).

## Rollout

1. Ship the migration + API + sidecar + UI together (one PR per repo, API
   first since the UI depends on it — same dependency order as the blog
   work).
2. Rishi clicks "Reset all training" once, manually, after both are live —
   this both proves the new flow works end-to-end and satisfies "start
   fresh from this prompt onwards."

## Known ceiling (intentionally not solved here)

Training still works by literally appending saved conversation text to the
system prompt. Fine for the number of examples a human curates by hand.
If saved trainings grow into the hundreds, the prompt will bloat and
degrade — at that point the right fix is swapping to embedding-based
retrieval (pull only the most relevant saved examples per incoming
message) instead of injecting everything every time. Not needed at
current scale.

## Testing plan

- `tsc --noEmit` clean on `yakuzi-api` and `apps/admin`.
- Manually verify the new SQL in `search_blogs`/`get_product_reviews`
  against the real schema (`blog_posts`, `reviews`, `catalog_products`)
  before merging.
- After deploy: live-verify the new `/admin/chatbot/trainings` routes
  return 401 (not 404) unauthenticated, same check used for the blog admin
  routes; then a manual save-conversation → reload → confirm it appears in
  the list, survives an API restart (proves the resync path works).
