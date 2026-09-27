"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Edit3, MoreHorizontal, RotateCcw, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDirectory } from "@/hooks/use-directory";
import { useResetChat } from "@/hooks/use-reset-chat";
import { ConversationListItem } from "@/components/chat/conversation-list-item";
import type { Conversation } from "@/lib/chat/types";

interface ConversationSidebarProps {
  selectedId: string;
  onSelect: (conversationId: string) => void;
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "dm", label: "Direct" },
  { id: "group", label: "Groups" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

/** Left rail: workspace header, search, filters and the conversation list. */
export function ConversationSidebar({ selectedId, onSelect }: ConversationSidebarProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const { data, isPending, isError } = useDirectory();
  const reset = useResetChat();

  const conversations = useMemo(() => {
    const all = data?.conversations ?? [];
    const needle = query.trim().toLowerCase();

    return all.filter((conversation) => {
      if (filter !== "all" && conversation.kind !== filter) return false;
      if (!needle) return true;
      return (
        (conversation.name ?? "").toLowerCase().includes(needle) ||
        conversation.lastMessage?.text.toLowerCase().includes(needle) ||
        conversation.memberIds.some((id) => id.toLowerCase().includes(needle))
      );
    });
  }, [data?.conversations, query, filter]);

  const me = data?.me;
  const people = data?.people ?? [];

  return (
    <aside className="hidden w-[340px] shrink-0 border-r border-[#eaebef] bg-[#fbfbfc] md:flex md:flex-col">
      <div className="flex items-center justify-between px-6 pb-5 pt-7">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9b9da6]">
            Workspace
          </p>
          <button className="mt-1 flex items-center gap-1 text-[20px] font-semibold tracking-[-0.03em]">
            Messages <ChevronDown size={16} className="text-[#8f9199]" />
          </button>
        </div>
        <button
          aria-label="Compose new message"
          className="rounded-lg border border-[#e2e3e8] bg-white p-2.5 text-[#555965] shadow-sm transition hover:bg-[#f2f3f6]"
        >
          <Edit3 size={17} />
        </button>
      </div>

      <div className="px-5 pb-4">
        <label className="flex items-center gap-2 rounded-lg bg-[#f0f1f4] px-3 py-2.5 text-sm text-[#9699a2]">
          <Search size={16} />
          <input
            aria-label="Search conversations"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            className="w-full bg-transparent outline-none placeholder:text-[#9699a2]"
          />
        </label>
      </div>

      <div className="flex items-center gap-1 px-5 pb-3">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
              filter === item.id
                ? "bg-[#e6e8f8] text-[#4a55c7]"
                : "text-[#8a8d97] hover:bg-[#f1f2f5]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-6 pb-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.13em] text-[#a0a2aa]">
          Recent
        </span>
        <button className="text-xs font-medium text-[#777b85] hover:text-[#262932]">See all</button>
      </div>

      <nav aria-label="Conversations" className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {isPending &&
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl px-3 py-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#eceef2]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 animate-pulse rounded bg-[#eceef2]" />
                <div className="h-2.5 w-3/4 animate-pulse rounded bg-[#f1f2f5]" />
              </div>
            </div>
          ))}

        {isError && (
          <p className="px-3 py-4 text-[12px] text-[#a04438]">Could not load conversations.</p>
        )}

        {me &&
          !isPending &&
          conversations.map((conversation: Conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              people={people}
              me={me}
              active={conversation.id === selectedId}
              onSelect={onSelect}
            />
          ))}

        {!isPending && !isError && conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-[12px] text-[#9a9da6]">
            No conversations match your search.
          </p>
        )}
      </nav>

      <div className="flex items-center gap-3 border-t border-[#eaebef] px-6 py-5">
        {me && (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#293047] text-xs font-bold text-white">
              {me.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{me.name}</p>
              <p className="text-xs text-[#999ca5]">Personal account</p>
            </div>
            <button
              onClick={() => reset.mutate()}
              disabled={reset.isPending}
              aria-label="Reset demo data"
              title="Reset demo data"
              className="rounded-lg p-1.5 text-[#9b9da5] transition hover:bg-[#f1f2f5] disabled:opacity-50"
            >
              <RotateCcw size={15} />
            </button>
            <MoreHorizontal size={18} className="text-[#9b9da5]" />
          </>
        )}
      </div>
    </aside>
  );
}
