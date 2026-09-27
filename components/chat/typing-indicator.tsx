import { Avatar } from "@/components/chat/avatar";
import type { Person } from "@/lib/chat/types";

interface TypingIndicatorProps {
  /** Everyone currently "typing", in arrival order. */
  people: Person[];
}

/** Animated "…" row shown while replies are on their way. */
export function TypingIndicator({ people }: TypingIndicatorProps) {
  if (people.length === 0) return null;

  const label =
    people.length === 1
      ? `${people[0].name.split(" ")[0]} is typing`
      : `${people.length} people are typing`;

  return (
    <div className="flex items-end gap-2" aria-live="polite">
      <Avatar person={people[0]} size="sm" />
      <div>
        <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-[#f0f1f4] px-4 py-3.5">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9a9da6]"
              style={{ animationDelay: `${dot * 140}ms`, animationDuration: "900ms" }}
            />
          ))}
        </div>
        <span className="ml-1 text-[10px] text-[#b1b3ba]">{label}</span>
      </div>
    </div>
  );
}
