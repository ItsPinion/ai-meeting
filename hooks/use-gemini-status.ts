"use client";

import { useQuery } from "@tanstack/react-query";

import { chatKeys } from "@/lib/chat/keys";

/**
 * Whether the server has a Gemini key, so the UI can say when replies are
 * coming from in-character placeholder lines instead of the model.
 *
 * `staleTime: Infinity` because this only changes when the server restarts.
 */
export function useGeminiStatus() {
  return useQuery({
    queryKey: chatKeys.geminiStatus(),
    queryFn: async () => {
      const response = await fetch("/api/chat/reply");
      if (!response.ok) return false;
      const data = (await response.json()) as { configured?: boolean };
      return Boolean(data.configured);
    },
    staleTime: Infinity,
  });
}
