import { ME_ID, type Conversation, type Person } from "./types";

/**
 * Pure display helpers. Everything here is derived from a conversation plus the
 * people directory, so no component has to re-implement "what is a DM called".
 */

export function firstName(name: string): string {
  return name.split(" ")[0];
}

/** Members of a conversation other than the current user. */
export function otherMembers(conversation: Conversation, people: Person[]): Person[] {
  return conversation.memberIds
    .filter((id) => id !== ME_ID)
    .map((id) => people.find((person) => person.id === id))
    .filter((person): person is Person => Boolean(person));
}

/** DMs are titled after the other member; groups after themselves. */
export function conversationTitle(conversation: Conversation, people: Person[]): string {
  if (conversation.kind === "group") return conversation.name ?? "Group chat";
  return otherMembers(conversation, people)[0]?.name ?? "Unknown";
}

/** The other person in a DM, if there is one. */
export function directCounterpart(conversation: Conversation, people: Person[]): Person | undefined {
  return otherMembers(conversation, people)[0];
}

export function conversationAccent(conversation: Conversation, people: Person[]): string {
  if (conversation.kind === "group") return conversation.accent ?? "bg-[#e7d5f5] text-[#764797]";
  return directCounterpart(conversation, people)?.color ?? "bg-[#e7d5f5] text-[#764797]";
}

export function conversationInitials(conversation: Conversation, people: Person[]): string {
  if (conversation.initials) return conversation.initials;
  return conversationTitle(conversation, people)
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Sidebar preview. Own messages are prefixed with "You"; in a group the author
 * is named so it is obvious who is talking.
 */
export function lastMessagePreview(
  conversation: Conversation,
  people: Person[],
  me: Person,
): string {
  const last = conversation.lastMessage;
  if (!last) return "No messages yet";

  const author = last.authorId === ME_ID ? me : people.find((person) => person.id === last.authorId);
  const authorName = author ? firstName(author.name) : "Someone";
  const prefix = last.authorId === ME_ID ? "You: " : conversation.kind === "group" ? `${authorName}: ` : "";
  return `${prefix}${last.text}`;
}

/** Header subtitle: presence for a DM, members for a group. */
export function conversationSubtitle(
  conversation: Conversation,
  people: Person[],
  me: Person,
): string {
  if (conversation.kind === "group") {
    const others = otherMembers(conversation, people);
    const names = others.slice(0, 3).map((person) => firstName(person.name));
    if (others.length > names.length) names.push(`+${others.length - names.length}`);
    return `${firstName(me.name)}, ${names.join(", ")}`;
  }

  const counterpart = directCounterpart(conversation, people);
  if (!counterpart) return "Just you";
  return counterpart.online ? "Active now" : "Last seen recently";
}

/** "Message Maya..." / "Message Design team..." */
export function composerPlaceholder(conversation: Conversation, people: Person[]): string {
  const title = conversationTitle(conversation, people);
  return conversation.kind === "group" ? `Message ${title}...` : `Message ${firstName(title)}...`;
}

export function isGroup(conversation: Conversation): boolean {
  return conversation.kind === "group";
}
