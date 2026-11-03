"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchMessages, markRead } from "@/lib/chat/api";
import { chatKeys } from "@/lib/chat/keys";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Messages for one conversation.
 *
 * Opening a conversation marks it read (clearing the unread badge) and refetches
 * the sidebar preview.
 */
export function useMessages(conversationId: string) {
  const hydrated = useHydrated();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => fetchMessages(conversationId),
    enabled: hydrated && Boolean(conversationId),
    staleTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    if (!hydrated || !conversationId) return;
    if (markRead(conversationId)) {
      void queryClient.invalidateQueries({ queryKey: chatKeys.directory() });
    }
  }, [conversationId, hydrated, queryClient]);

  return query;
}
