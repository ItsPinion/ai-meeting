"use client";

import { useCallback, useState } from "react";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { createMessageId, nowLabel, sendMessage } from "@/lib/chat/api";
import { chatKeys } from "@/lib/chat/keys";
import { ME_ID, type Message } from "@/lib/chat/types";

interface SendVariables {
  text: string;
  /** Generated once and shared by the optimistic bubble and the stored message. */
  id: string;
}

/**
 * Sends a message and waits for the replies.
 *
 * The mutation resolves only once every reply has landed, so `isPending` means
 * exactly "this conversation is still settling" — which is what the composer
 * uses to block a second send.
 *
 * Rendering flow:
 * 1. `onMutate` appends an optimistic bubble marked `sending`.
 * 2. The mock API persists that same message and reports back through `onSent`,
 *    which reconciles the bubble with the stored copy.
 * 3. Replies stream in through `onReply` into the same cache entry, so the list
 *    grows while `isPending` stays true.
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const [typingIds, setTypingIds] = useState<string[]>([]);
  const messagesKey = chatKeys.messages(conversationId);

  // `typingIds` needs no reset on conversation change: `ChatPanel` is keyed by
  // conversation id, so this hook remounts for every conversation you open.

  const mutation = useMutation({
    mutationFn: ({ text, id }: SendVariables) =>
      sendMessage(
        { conversationId, text, id },
        {
          onSent: (message) => {
            patchMessage(queryClient, messagesKey, message.id, () => ({
              ...message,
              status: "sent",
            }));
          },
          onTypingStart: (authorId) => {
            setTypingIds((current) =>
              current.includes(authorId) ? current : [...current, authorId],
            );
          },
          onTypingEnd: (authorId) => {
            setTypingIds((current) => current.filter((id) => id !== authorId));
          },
          onReply: (message) => {
            appendMessage(queryClient, messagesKey, message);
          },
        },
      ),

    onMutate: async ({ text, id }: SendVariables) => {
      // Stop any in-flight read so it cannot overwrite the optimistic bubble.
      await queryClient.cancelQueries({ queryKey: messagesKey });

      appendMessage(queryClient, messagesKey, {
        id,
        conversationId,
        authorId: ME_ID,
        text: text.trim(),
        time: nowLabel(),
        status: "sending",
      });

      return { optimisticId: id };
    },

    onError: (_error, _variables, context) => {
      if (!context) return;
      patchMessage(queryClient, messagesKey, context.optimisticId, () => null);
    },

    onSuccess: () => {
      // Preview text, ordering and unread counts all live in the directory.
      void queryClient.invalidateQueries({ queryKey: chatKeys.directory() });

      // localStorage is the source of truth, so re-read the thread. This keeps
      // the cache authoritative and recovers the history in case `onMutate`
      // cancelled a read that was still in flight.
      void queryClient.invalidateQueries({ queryKey: messagesKey });
    },
  });

  const send = useCallback(
    (text: string) => {
      mutation.mutate({ text, id: createMessageId() });
    },
    [mutation],
  );

  return { ...mutation, send, typingIds };
}

function appendMessage(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  message: Message,
) {
  queryClient.setQueryData<Message[]>(queryKey, (current) => [...(current ?? []), message]);
}

/** Applies `update` to one message; returning null removes it. */
function patchMessage(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  messageId: string,
  update: (message: Message) => Message | null,
) {
  queryClient.setQueryData<Message[]>(queryKey, (current) => {
    if (!current) return current;
    return current.flatMap((message) => {
      if (message.id !== messageId) return [message];
      const next = update(message);
      return next ? [next] : [];
    });
  });
}
