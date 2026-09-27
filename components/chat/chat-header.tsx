import { Info, MoreHorizontal, Phone, Video } from "lucide-react";

import { Avatar } from "@/components/chat/avatar";
import { AvatarStack } from "@/components/chat/avatar-stack";
import { conversationSubtitle, conversationTitle, otherMembers } from "@/lib/chat/format";
import type { Conversation, Person } from "@/lib/chat/types";

interface ChatHeaderProps {
  conversation: Conversation;
  people: Person[];
  me: Person;
}

/** Conversation title bar: who you are talking to and the call actions. */
export function ChatHeader({ conversation, people, me }: ChatHeaderProps) {
  const title = conversationTitle(conversation, people);
  const subtitle = conversationSubtitle(conversation, people, me);
  const group = conversation.kind === "group";
  const members = otherMembers(conversation, people);
  const counterpart = members[0];

  return (
    <header className="flex items-center justify-between border-b border-[#eaebef] px-5 py-4 md:px-8 md:py-5">
      <div className="flex min-w-0 items-center gap-3">
        {group ? (
          <AvatarStack people={members} max={2} size="md" />
        ) : (
          counterpart && <Avatar person={counterpart} />
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[16px] font-semibold">{title}</h1>
            {!group && counterpart?.online && (
              <span className="shrink-0 rounded-full bg-[#e4f5eb] px-2 py-0.5 text-[10px] font-semibold text-[#3c8a5a]">
                Active now
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-[#9a9da6]">{subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 text-[#787b85]">
        <button aria-label="Start voice call" className="rounded-lg p-2.5 hover:bg-[#f3f4f6]">
          <Phone size={18} />
        </button>
        <button aria-label="Start video call" className="rounded-lg p-2.5 hover:bg-[#f3f4f6]">
          <Video size={19} />
        </button>
        <button
          aria-label="Conversation information"
          className="rounded-lg p-2.5 hover:bg-[#f3f4f6]"
        >
          <Info size={19} />
        </button>
        <button
          aria-label="More options"
          className="hidden rounded-lg p-2.5 hover:bg-[#f3f4f6] sm:block"
        >
          <MoreHorizontal size={19} />
        </button>
      </div>
    </header>
  );
}
