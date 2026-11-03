"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { resetStore } from "@/lib/chat/storage";
import { chatKeys } from "@/lib/chat/keys";

/**
 * Restores the seed data in localStorage and refreshes every cached query, which
 * is the only way back to the original demo state once you have sent messages.
 */
export function useResetChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      resetStore();
    },
    onSuccess: () => {
      // Invalidating (rather than removing) makes the active observers refetch,
      // so the visible conversation swaps straight back to the seeded thread.
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}
