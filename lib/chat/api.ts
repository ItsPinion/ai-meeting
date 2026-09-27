import { ME_ID, type ChatDirectory, type Conversation, type Message } from "./types";
import {
  appendMessage,
  findConversation,
  markConversationRead,
  mutateStore,
  otherMemberIds,
  readStore,
  writeStore,
} from "./storage";
import { delay, pickMany, randomInt } from "./random";
import { dmReplies, groupReplies } from "./replies";

/**
 * Mock chat API backed by localStorage.
 *
 * Every function is async and deliberately slow, so the UI has real loading
 * states to render. Replace this module with `fetch` calls to a real backend
 * and nothing above `hooks/` needs to change.
 */

/** Simulated latency for reads. */
const FETCH_LATENCY = { min: 140, max: 340 } as const;
/** Time between "sent" and the first reply arriving. */
const FIRST_REPLY_LATENCY = { min: 700, max: 1500 } as const;
/** Gap between consecutive replies in a group chat. */
const NEXT_REPLY_LATENCY = { min: 550, max: 1400 } as const;
/** Keeps a large group from burying your message under replies. */
const MAX_GROUP_REPLIERS = 3;

export function createMessageId(): string {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Label used for messages sent right now. */
export function nowLabel(): string {
  return "Just now";
}

export async function fetchDirectory(): Promise<ChatDirectory> {
  await delay(randomInt(FETCH_LATENCY.min, FETCH_LATENCY.max));
  const store = readStore();
  return {
    me: store.me,
    people: store.people,
    conversations: store.conversations,
  };
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  await delay(randomInt(FETCH_LATENCY.min, FETCH_LATENCY.max));
  return readStore().messages[conversationId] ?? [];
}

/** Clears the unread badge for a conversation. Returns true when it changed. */
export function markRead(conversationId: string): boolean {
  return mutateStore((store) => markConversationRead(store, conversationId));
}

export interface ReplyPlan {
  authorId: string;
  text: string;
  /** Milliseconds after the outgoing message before this reply lands. */
  delayMs: number;
}

/**
 * Decides who answers and when.
 *
 * Direct messages always get exactly one reply from the other person. Group
 * chats get a random number of distinct responders, each with their own random
 * reply and their own arrival time.
 */
export function planReplies(conversation: Conversation): ReplyPlan[] {
  const responders = otherMemberIds(conversation);
  if (responders.length === 0) return [];

  const count =
    conversation.kind === "group"
      ? randomInt(1, Math.min(responders.length, MAX_GROUP_REPLIERS))
      : 1;

  const authors = pickMany(responders, count);
  const texts = pickMany(conversation.kind === "group" ? groupReplies : dmReplies, count);

  let elapsed = 0;
  return authors.map((authorId, index) => {
    elapsed +=
      index === 0
        ? randomInt(FIRST_REPLY_LATENCY.min, FIRST_REPLY_LATENCY.max)
        : randomInt(NEXT_REPLY_LATENCY.min, NEXT_REPLY_LATENCY.max);

    return { authorId, text: texts[index], delayMs: elapsed };
  });
}

export interface SendMessageHandlers {
  /** Fired once the outgoing message is persisted. */
  onSent?: (message: Message) => void;
  /** Fired when somebody starts typing, and again when they stop. */
  onTypingStart?: (authorId: string) => void;
  onTypingEnd?: (authorId: string) => void;
  /** Fired as each reply lands. */
  onReply?: (message: Message) => void;
}

export interface SendMessageInput {
  conversationId: string;
  text: string;
  /**
   * Client generated id (an idempotency key) so the optimistic bubble can be
   * reconciled with the stored message instead of being duplicated.
   */
  id: string;
}

export interface SendMessageResult {
  message: Message;
  replies: Message[];
}

/**
 * Persists the outgoing message, then streams the replies in.
 *
 * The returned promise only resolves once every reply has landed, which is what
 * lets the UI keep the composer disabled until the conversation goes quiet.
 */
export async function sendMessage(
  input: SendMessageInput,
  handlers: SendMessageHandlers = {},
): Promise<SendMessageResult> {
  const text = input.text.trim();
  if (!text) throw new Error("Cannot send an empty message");

  const store = readStore();
  const conversation = findConversation(store, input.conversationId);
  if (!conversation) throw new Error(`Unknown conversation: ${input.conversationId}`);

  const message = appendMessage(store, {
    id: input.id,
    conversationId: input.conversationId,
    authorId: ME_ID,
    text,
    time: nowLabel(),
    status: "sent",
  });
  writeStore(store);
  handlers.onSent?.(message);

  await delay(randomInt(180, 420));

  const plan = planReplies(conversation);
  for (const entry of plan) handlers.onTypingStart?.(entry.authorId);

  const replies: Message[] = [];
  let waited = 0;

  // Replies are appended one at a time (in arrival order) so concurrent writes
  // can never clobber each other in localStorage.
  for (const entry of plan) {
    await delay(entry.delayMs - waited);
    waited = entry.delayMs;

    const reply = mutateStore((current) =>
      appendMessage(current, {
        id: createMessageId(),
        conversationId: input.conversationId,
        authorId: entry.authorId,
        text: entry.text,
        time: nowLabel(),
      }),
    );

    handlers.onTypingEnd?.(entry.authorId);
    handlers.onReply?.(reply);
    replies.push(reply);
  }

  return { message, replies };
}
