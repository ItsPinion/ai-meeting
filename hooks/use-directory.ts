"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchDirectory } from "@/lib/chat/api";
import { chatKeys } from "@/lib/chat/keys";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * People, the current user and the conversation list.
 *
 * Shared by the sidebar and the workspace, so TanStack Query dedupes it into a
 * single request. `staleTime: Infinity` means switching conversations never
 * refetches; mutations invalidate explicitly instead.
 */
export function useDirectory() {
  const hydrated = useHydrated();

  return useQuery({
    queryKey: chatKeys.directory(),
    queryFn: fetchDirectory,
    enabled: hydrated,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
