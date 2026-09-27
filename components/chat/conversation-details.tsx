import { Bell, CircleHelp, FileText, Image as ImageIcon, MoreHorizontal, Phone, Plus, Video } from "lucide-react";

import { Avatar } from "@/components/chat/avatar";
import { conversationTitle, otherMembers } from "@/lib/chat/format";
import type { Conversation, Person } from "@/lib/chat/types";

interface ConversationDetailsProps {
  conversation: Conversation;
  people: Person[];
  me: Person;
}

/** Right rail: who is in the conversation plus shared media placeholders. */
export function ConversationDetails({ conversation, people, me }: ConversationDetailsProps) {
  const title = conversationTitle(conversation, people);
  const members = otherMembers(conversation, people);
  const group = conversation.kind === "group";
  const counterpart = members[0];

  return (
    <aside className="hidden w-[250px] shrink-0 border-l border-[#eaebef] bg-[#fbfbfc] px-5 py-7 xl:block">
      <div className="flex flex-col items-center text-center">
        {group ? (
          <div className="flex -space-x-3">
            {members.slice(0, 3).map((person) => (
              <Avatar key={person.id} person={person} size="lg" showPresence={false} />
            ))}
          </div>
        ) : (
          counterpart && <Avatar person={counterpart} size="lg" />
        )}

        <h2 className="mt-3 text-[15px] font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-[#999ca5]">
          {group ? `${members.length + 1} members` : counterpart?.online ? "Online" : "Offline"}
        </p>

        <div className="mt-5 flex gap-2">
          <button aria-label="Call" className="rounded-lg bg-white p-2.5 text-[#686c77] shadow-sm ring-1 ring-[#e6e7eb] hover:bg-[#f3f4f6]">
            <Phone size={16} />
          </button>
          <button aria-label="Video call" className="rounded-lg bg-white p-2.5 text-[#686c77] shadow-sm ring-1 ring-[#e6e7eb] hover:bg-[#f3f4f6]">
            <Video size={16} />
          </button>
          <button aria-label="More options" className="rounded-lg bg-white p-2.5 text-[#686c77] shadow-sm ring-1 ring-[#e6e7eb] hover:bg-[#f3f4f6]">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {group && (
        <div className="mt-8 border-t border-[#e6e7eb] pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#a0a2aa]">
            Members
          </p>
          <ul className="mt-3 space-y-2.5">
            {members.map((person) => (
              <li key={person.id} className="flex items-center gap-2.5">
                <Avatar person={person} size="sm" />
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#3a3d46]">
                  {person.id === me.id ? "You" : person.name}
                </span>
                {person.online && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4dbb72]" />}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 border-t border-[#e6e7eb] pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#a0a2aa]">
          Shared media
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="flex aspect-square items-center justify-center rounded-lg bg-[#eef0f3] text-[#999ca5]">
            <ImageIcon size={18} />
          </div>
          <div className="flex aspect-square items-center justify-center rounded-lg bg-[#eef0f3] text-[#999ca5]">
            <FileText size={18} />
          </div>
          <div className="flex aspect-square items-center justify-center rounded-lg bg-[#eef0f3] text-[#999ca5]">
            <Plus size={18} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-[#9699a3]">
        <CircleHelp size={15} /> Help center
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-[#9699a3]">
        <Bell size={15} /> Notifications
      </div>
    </aside>
  );
}
