import { STORAGE_KEY, STORE_VERSION } from "./constants";
import { createSeedStore } from "./seed";
import {
  ME_ID,
  type ChatStore,
  type Conversation,
  type Message,
  type MessageStatus,
} from "./types";

/**
 * localStorage-backed persistence for the chat store.
 *
 * Every read hands back a fresh deep copy and every write goes straight to
 * localStorage, so nothing in the UI can accidentally hold a reference into
 * persisted state and mutate it in place.
 */

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Access can throw in private mode / blocked-cookie browsers.
    return null;
  }
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function isChatStore(value: unknown): value is ChatStore {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ChatStore>;
  return (
    candidate.version === STORE_VERSION &&
    Array.isArray(candidate.conversations) &&
    Array.isArray(candidate.people) &&
    typeof candidate.me === "object" &&
    candidate.me !== null &&
    typeof candidate.messages === "object" &&
    candidate.messages !== null
  );
}

export function writeStore(store: ChatStore): void {
  const target = storage();
  if (!target) return;
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Out of quota or serialisation failure — the UI keeps working in memory.
  }
}

/**
 * Reads the persisted store, seeding localStorage on first run.
 *
 * On the server (or when localStorage is unavailable) it returns the seed
 * defaults without writing anything.
 */
export function readStore(): ChatStore {
  const target = storage();
  if (!target) return createSeedStore();

  try {
    const raw = target.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedStore();
      writeStore(seeded);
      return seeded;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isChatStore(parsed)) {
      const seeded = createSeedStore();
      writeStore(seeded);
      return seeded;
    }

    return clone(parsed);
  } catch {
    return createSeedStore();
  }
}

/** Read-modify-write in one step, so a mutation is always persisted. */
export function mutateStore<T>(mutator: (store: ChatStore) => T): T {
  const store = readStore();
  const result = mutator(store);
  writeStore(store);
  return result;
}

/** Wipes persisted data and restores the seed. */
export function resetStore(): void {
  writeStore(createSeedStore());
}

export function findConversation(store: ChatStore, conversationId: string): Conversation | undefined {
  return store.conversations.find((conversation) => conversation.id === conversationId);
}

export interface AppendMessageInput {
  id: string;
  conversationId: string;
  authorId: string;
  text: string;
  time?: string;
  status?: MessageStatus;
}

/**
 * Appends a message, refreshes the conversation preview and bubbles the
 * conversation to the top of the list. Callers must persist the store.
 */
export function appendMessage(store: ChatStore, input: AppendMessageInput): Message {
  const message: Message = {
    id: input.id,
    conversationId: input.conversationId,
    authorId: input.authorId,
    text: input.text,
    time: input.time ?? "Just now",
    status: input.status ?? "sent",
  };

  const thread = (store.messages[input.conversationId] ??= []);
  thread.push(message);

  const index = store.conversations.findIndex((conversation) => conversation.id === input.conversationId);
  if (index >= 0) {
    const [conversation] = store.conversations.splice(index, 1);
    conversation.lastMessage = {
      authorId: input.authorId,
      text: input.text,
      time: message.time,
    };
    store.conversations.unshift(conversation);
  }

  return message;
}

/** Returns true when something actually changed, so callers can skip refetches. */
export function markConversationRead(store: ChatStore, conversationId: string): boolean {
  const conversation = findConversation(store, conversationId);
  if (!conversation || !conversation.unread) return false;
  conversation.unread = 0;
  return true;
}

/** Members of a conversation other than the current user. */
export function otherMemberIds(conversation: Conversation): string[] {
  return conversation.memberIds.filter((id) => id !== ME_ID);
}
