import { cn } from "@/lib/utils";
import { Avatar, type AvatarSize } from "@/components/chat/avatar";
import type { Person } from "@/lib/chat/types";

interface AvatarStackProps {
  people: Person[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

/** Overlapping avatars, used to show who is in a group chat. */
export function AvatarStack({ people, max = 4, size = "sm", className }: AvatarStackProps) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((person, index) => (
        <Avatar
          key={person.id}
          person={person}
          size={size}
          showPresence={false}
          className={cn("ring-2 ring-white", index > 0 && "-ml-2.5")}
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "-ml-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#eceef5] text-[9px] font-bold text-[#6b6e78] ring-2 ring-white",
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
