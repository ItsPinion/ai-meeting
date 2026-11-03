import type { ConversationKind } from "./types";

/**
 * Contract for `POST /api/chat/reply`.
 *
 * Lives in `lib/` so the client and the Route Handler agree on one shape. The
 * client sends the persona's identity plus the recent thread, and the server
 * turns that into a Gemini call — the browser never sees the API key.
 */

export interface HistoryTurn {
  authorId: string;
  /** Display name, so the model can attribute turns in a group chat. */
  authorName: string;
  text: string;
}

export interface ReplyRequest {
  conversationId: string;
  kind: ConversationKind;
  /** Only set for group chats. */
  conversationName?: string;
  /** Who is writing this reply. */
  authorId: string;
  authorName: string;
  /** Everyone in the conversation, including the current user. */
  members: Array<{ id: string; name: string }>;
  /** The message being replied to. */
  prompt: string;
  /** Recent turns, oldest first, for multi-turn context. */
  history: HistoryTurn[];
}

export interface ReplyResponse {
  text: string;
}

/** Returned when Gemini cannot be reached, so the client can fall back. */
export interface ReplyErrorResponse {
  error: string;
  reason: "not_configured" | "upstream" | "bad_request";
}

/** How many recent turns to send as context. */
export const HISTORY_LIMIT = 12;
