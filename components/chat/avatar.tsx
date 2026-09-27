import { cn } from "@/lib/utils";
import type { Person } from "@/lib/chat/types";

const sizes = {
  sm: "h-7 w-7 text-[9px]",
  md: "h-10 w-10 text-xs",
  lg: "h-16 w-16 text-lg",
} as const;

const presenceSizes = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
} as const;

export type AvatarSize = keyof typeof sizes;

interface AvatarProps {
  person: Person;
  size?: AvatarSize;
  /** Renders the green presence dot. Defaults to true. */
  showPresence?: boolean;
  className?: string;
}

/**
 * Person avatar. Purely presentational — no hooks, so it stays a Server
 * Component even when rendered inside the client chat tree.
 */
export function Avatar({ person, size = "md", showPresence = true, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full font-semibold",
        person.color,
        sizes[size],
        className,
      )}
    >
      <span>{person.initials}</span>
      {showPresence && person.online && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#4dbb72]",
            presenceSizes[size],
          )}
        />
      )}
    </div>
  );
}
