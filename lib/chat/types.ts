/**
 * Shared domain types for the messaging workspace.
 *
 * Everything above `lib/chat/api.ts` (hooks + components) only knows about these
 * shapes, so swapping the mock localStorage API for a real backend later means
 * touching this folder alone.
 */

/** Id of the signed-in user. Every conversation lists it in `memberIds`. */
export const ME_ID = "me";

export interface Person {
  id: string;
  name: string;
  initials: string;
  /** Tailwind classes used for the avatar background and label. */
  color: string;
  online?: boolean;
}

export type ConversationKind = "dm" | "group";

export interface Conversation {
  id: string;
  kind: ConversationKind;
  /** Groups carry an explicit name; DMs take the name of the other member. */
  name?: string;
  /** Groups carry a monogram; DMs reuse the other member's avatar. */
  initials?: string;
  /** Tailwind classes for the group monogram. */
  accent?: string;
  /** Always contains {@link ME_ID}. */
  memberIds: string[];
  unread?: number;
  /**
   * Denormalised last message so the sidebar can render a preview without
   * loading every thread.
   */
  lastMessage?: LastMessage;
}

export interface LastMessage {
  authorId: string;
  text: string;
  time: string;
}

export type MessageStatus = "sending" | "sent";

export interface Message {
  id: string;
  conversationId: string;
  /** {@link ME_ID} for messages the current user sent. */
  authorId: string;
  text: string;
  /** Pre-formatted timestamp label, e.g. "9:41 AM" or "Yesterday". */
  time: string;
  status?: MessageStatus;
}

/** Everything the chat shell needs to render, in one round trip. */
export interface ChatDirectory {
  me: Person;
  people: Person[];
  /** Ordered most-recent-first. */
  conversations: Conversation[];
}

/** Persisted shape. Also the seed shape, so seeding is just "write the defaults". */
export interface ChatStore {
  version: number;
  me: Person;
  people: Person[];
  conversations: Conversation[];
  /** Keyed by conversation id. */
  messages: Record<string, Message[]>;
}
