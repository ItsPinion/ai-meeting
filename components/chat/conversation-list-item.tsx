import { Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/chat/avatar";
import {
  conversationAccent,
  conversationInitials,
  conversationTitle,
  directCounterpart,
  isGroup,
  lastMessagePreview,
} from "@/lib/chat/format";
import type { Conversation, Person } from "@/lib/chat/types";

interface ConversationListItemProps {
  conversation: Conversation;
  people: Person[];
  me: Person;
  active: boolean;
  onSelect: (conversationId: string) => void;
}

/**
 * One row in the conversation sidebar. Presentational only — it receives the
 * already-resolved people directory so it never has to look anything up.
 */
export function ConversationListItem({
  conversation,
  people,
  me,
  active,
  onSelect,
}: ConversationListItemProps) {
  const group = isGroup(conversation);
  const title = conversationTitle(conversation, people);
  const preview = lastMessagePreview(conversation, people, me);
  const time = conversation.lastMessage?.time;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
        active ? "bg-[#eceef5]" : "hover:bg-[#f1f2f5]",
      )}
    >
      {group ? (
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold",
            conversationAccent(conversation, people),
          )}
        >
          {conversationInitials(conversation, people)}
        </div>
      ) : (
        <Avatar person={directCounterpart(conversation, people) ?? me} />
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[14px] font-semibold">{title}</span>
            {group && <Users size={12} className="shrink-0 text-[#a2a4ac]" />}
          </span>
          {time && <span className="shrink-0 text-[11px] text-[#a2a4ac]">{time}</span>}
        </span>

        <span className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-[12px] text-[#8a8d97]">{preview}</span>
          {conversation.unread ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4d5be5] px-1.5 text-[10px] font-bold text-white">
              {conversation.unread}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
