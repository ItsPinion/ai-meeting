import { Check, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/chat/avatar";
import { firstName } from "@/lib/chat/format";
import { ME_ID, type Message, type Person } from "@/lib/chat/types";

interface MessageRowProps {
  message: Message;
  author: Person;
  /** Groups name the author above the bubble; DMs do not. */
  showAuthor: boolean;
}

/**
 * The bubble classes are joined by hand rather than through `cn()`: `rounded-2xl`
 * and `rounded-bl-md` deliberately overlap, and `tailwind-merge` would drop the
 * shorthand and leave the top corners square.
 */
function bubbleClass(mine: boolean, sending: boolean) {
  return [
    "rounded-2xl px-4 py-3 text-[14px] leading-relaxed",
    mine ? "rounded-br-md bg-[#4f5ce6] text-white" : "rounded-bl-md bg-[#f0f1f4] text-[#3a3d46]",
    sending ? "opacity-70" : "",
  ].join(" ");
}

/** A single chat bubble. Presentational. */
export function MessageRow({ message, author, showAuthor }: MessageRowProps) {
  const mine = message.authorId === ME_ID;
  const sending = message.status === "sending";

  return (
    <div className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
      {!mine && <Avatar person={author} size="sm" />}

      <div className={cn("flex max-w-[78%] flex-col md:max-w-[62%]", mine ? "items-end" : "items-start")}>
        {showAuthor && !mine && (
          <span className="mb-1 ml-1 text-[11px] font-semibold text-[#8a8d97]">
            {firstName(author.name)}
          </span>
        )}

        <div className={bubbleClass(mine, sending)}>{message.text}</div>

        <span className="mt-1.5 flex items-center gap-1 text-[10px] text-[#b1b3ba]">
          {message.time}
          {mine && (
            <>
              <span>·</span>
              {sending ? <Clock size={12} /> : <Check size={12} />}
            </>
          )}
        </span>
      </div>
    </div>
  );
}
