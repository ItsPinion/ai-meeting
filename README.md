# Messages

A messaging workspace with **direct messages** and **group chats**, built with
Next.js (App Router) and TanStack Query.

```bash
bun install
bun dev          # http://localhost:3000
```

## What it does

- **DMs and group chats live side by side** in one conversation list. Groups show
  a monogram, a member count and the author's name above each reply; DMs show
  presence and a personalised composer placeholder.
- **All data lives in `localStorage`.** The seed data is written there on first
  load and every send/reply is persisted back, so a refresh keeps your
  conversation. The reset button in the sidebar footer restores the seed.
- **Replies are simulated.** After you send, the other side answers:
  - a DM gets exactly **one** reply, always from the person you are talking to;
  - a group chat gets a **random number of distinct responders** (1–3, capped by
    the group size), each with their own random message and their own arrival
    time, so several people can answer at once.
- **You can only send one message at a time.** The composer, the send button and
  the Enter shortcut stay disabled until the last reply has landed, and a typing
  indicator shows who is answering.

## Architecture

```
app/
  page.tsx                 Server Component — renders the workspace
  providers.tsx            'use client' — TanStack Query provider
components/chat/
  chat-workspace.tsx       'use client' — owns the selected conversation
  conversation-sidebar.tsx 'use client' — search + filters
  message-list.tsx         'use client' — reads the thread, auto-scrolls
  message-composer.tsx     'use client' — draft state, gated sending
  chat-header.tsx          presentational
  conversation-details.tsx presentational
  conversation-list-item.tsx, message-row.tsx, avatar.tsx,
  avatar-stack.tsx, typing-indicator.tsx   presentational
hooks/
  use-directory.ts         people + conversations query
  use-messages.ts          thread query, marks the conversation read
  use-send-message.ts      send mutation + reply streaming
  use-hydrated.ts          SSR-safe "are we in the browser yet" gate
  use-reset-chat.ts        restores the seed
lib/chat/
  types.ts  seed.ts  storage.ts  constants.ts
  api.ts     ← the mock backend (swap this for `fetch`)
  replies.ts ← the placeholder reply pool
  random.ts  format.ts  keys.ts
```

`'use client'` is only added to files that need state, effects, browser APIs or
event handlers. Everything in `lib/chat/` and the purely presentational
components stay on the server.

### Data flow

```
ChatWorkspace ── useDirectory() ────────────┐
   └─ ChatPanel (keyed by conversation)      │
        ├─ useMessages(id)  ── useQuery ────┤
        └─ useSendMessage(id) ─ useMutation ─┤
                                            ▼
                                   lib/chat/api.ts  ──► localStorage
```

Reads are `useQuery` calls with `staleTime: Infinity` (localStorage is the source
of truth, so there is nothing to revalidate in the background). The send
mutation is optimistic:

1. `onMutate` appends a bubble marked `sending` and cancels any in-flight read.
2. The mock API persists that same message and reports back via `onSent`, which
   reconciles the optimistic bubble with the stored copy.
3. Each reply streams in via `onReply` into the same cache entry.
4. The mutation resolves only once **every** reply has landed, so `isPending` is
   exactly "this conversation is still settling" — which is what blocks the next
   send. On success the directory is invalidated so previews, ordering and unread
   counts refresh.

### Swapping in a real API

`lib/chat/api.ts` is the only module that knows about persistence. To go live:

- replace `fetchDirectory`, `fetchMessages` and `sendMessage` with `fetch` calls;
- keep the `SendMessageHandlers` callbacks (`onSent`, `onTypingStart`,
  `onTypingEnd`, `onReply`) so replies still stream in and the composer stays
  gated until the last one arrives;
- delete `lib/chat/replies.ts` and `lib/chat/storage.ts` once the server owns the
  data.

## Checks

```bash
bun run typecheck   # tsc --noEmit
bun run lint        # eslint
bun run test        # storage, seeding, reply planning, streaming contract
bun run test:ui     # mounts the real component tree in jsdom and drives it
```

`test:ui` boots the actual React tree against a `localStorage` shim and asserts
the full loop: seed → load a group → send → replies arrive → composer unblocks →
persistence → reset.
