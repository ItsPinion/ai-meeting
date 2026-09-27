import { STORE_VERSION } from "./constants";
import { ME_ID, type ChatStore, type Conversation, type Message, type Person } from "./types";

export const seedMe: Person = {
  id: ME_ID,
  name: "Jamie Davis",
  initials: "JD",
  color: "bg-[#293047] text-white",
};

export const seedPeople: Person[] = [
  {
    id: "maya",
    name: "Maya Chen",
    initials: "MC",
    role: "Product designer",
    color: "bg-[#ffd6cb] text-[#9d493b]",
    online: true,
  },
  {
    id: "jordan",
    name: "Jordan Taylor",
    initials: "JT",
    role: "Engineering manager",
    color: "bg-[#d9d4ff] text-[#5a4eaa]",
  },
  {
    id: "sam",
    name: "Sam Williams",
    initials: "SW",
    role: "Frontend engineer",
    color: "bg-[#cfead9] text-[#3e7956]",
    online: true,
  },
  {
    id: "olivia",
    name: "Olivia Martinez",
    initials: "OM",
    role: "Content designer",
    color: "bg-[#f9e3ae] text-[#946b25]",
  },
  {
    id: "noah",
    name: "Noah Patel",
    initials: "NP",
    role: "Data analyst",
    color: "bg-[#c9e5ef] text-[#397587]",
  },
  {
    id: "priya",
    name: "Priya Nair",
    initials: "PN",
    role: "Marketing lead",
    color: "bg-[#f7d3e4] text-[#a04d78]",
  },
  {
    id: "leo",
    name: "Leo Fernandez",
    initials: "LF",
    role: "Motion designer",
    color: "bg-[#d5e8c9] text-[#4c7a3a]",
  },
];

/**
 * Seed conversations, most recent first. DMs and groups live in the same list;
 * the sidebar groups them by `kind`.
 */
export const seedConversations: Conversation[] = [
  {
    id: "maya",
    kind: "dm",
    memberIds: [ME_ID, "maya"],
    lastMessage: {
      authorId: "maya",
      text: "That sounds perfect! I’ll send over a calendar invite.",
      time: "9:41 AM",
    },
  },
  {
    id: "design",
    kind: "group",
    name: "Design team",
    initials: "DT",
    accent: "bg-[#e7d5f5] text-[#764797]",
    memberIds: [ME_ID, "maya", "sam", "olivia"],
    unread: 5,
    lastMessage: {
      authorId: "sam",
      text: "Dropped the new spacing scale in Figma",
      time: "9:12 AM",
    },
  },
  {
    id: "jordan",
    kind: "dm",
    memberIds: [ME_ID, "jordan"],
    unread: 2,
    lastMessage: { authorId: "jordan", text: "Are we still on for tomorrow?", time: "Yesterday" },
  },
  {
    id: "launch",
    kind: "group",
    name: "Launch squad",
    initials: "LS",
    accent: "bg-[#cfe2f7] text-[#3a5b86]",
    memberIds: [ME_ID, "jordan", "noah", "priya", "leo"],
    lastMessage: {
      authorId: "priya",
      text: "Press kit draft is ready for review",
      time: "Yesterday",
    },
  },
  {
    id: "sam",
    kind: "dm",
    memberIds: [ME_ID, "sam"],
    lastMessage: { authorId: "sam", text: "Sent a photo", time: "Mon" },
  },
  {
    id: "olivia",
    kind: "dm",
    memberIds: [ME_ID, "olivia"],
    lastMessage: { authorId: "olivia", text: "Thanks for your help!", time: "Sun" },
  },
  {
    id: "noah",
    kind: "dm",
    memberIds: [ME_ID, "noah"],
    lastMessage: { authorId: ME_ID, text: "Let’s catch up soon", time: "Sat" },
  },
];

type SeedLine = [conversationId: string, authorId: string, text: string, time: string];

const seedThreads: SeedLine[] = [
  // Maya — direct message
  ["maya", "maya", "Hey! Are you free for a quick catch-up this week?", "9:36 AM"],
  ["maya", "maya", "I have a few ideas I’d love to run by you.", "9:37 AM"],
  ["maya", ME_ID, "Absolutely! I’m free Thursday afternoon. What did you have in mind?", "9:39 AM"],
  ["maya", "maya", "That sounds perfect! I’ll send over a calendar invite.", "9:41 AM"],
  // Design team — group chat
  ["design", "maya", "Standup in five — I’m bringing the new icon set.", "8:58 AM"],
  ["design", "sam", "Nice, I’ll join with the spacing updates.", "9:02 AM"],
  ["design", "olivia", "Can we also look at the empty states?", "9:06 AM"],
  ["design", ME_ID, "Yep, added them to the agenda.", "9:09 AM"],
  ["design", "sam", "Dropped the new spacing scale in Figma", "9:12 AM"],
  // Jordan — direct message
  ["jordan", "jordan", "Are we still on for tomorrow?", "Yesterday"],
  ["jordan", "jordan", "No pressure if the week got away from you.", "Yesterday"],
  // Launch squad — group chat
  ["launch", "jordan", "Landing page copy is final.", "Yesterday"],
  ["launch", "noah", "Great, I’ll wire up the analytics events today.", "Yesterday"],
  ["launch", "priya", "Press kit draft is ready for review", "Yesterday"],
  ["launch", "leo", "Sending the launch video cut tonight.", "Yesterday"],
  // Remaining direct messages
  ["sam", "sam", "Sent a photo", "Mon"],
  ["olivia", "olivia", "Thanks for your help!", "Sun"],
  ["noah", ME_ID, "Let’s catch up soon", "Sat"],
];

/**
 * Builds a fresh seed store. Called whenever localStorage is empty or holds an
 * unusable payload, so the defaults are never shared by reference.
 */
export function createSeedStore(): ChatStore {
  const messages: Record<string, Message[]> = {};

  for (const [conversationId, authorId, text, time] of seedThreads) {
    const thread = (messages[conversationId] ??= []);
    thread.push({
      id: `${conversationId}-${thread.length + 1}`,
      conversationId,
      authorId,
      text,
      time,
      status: "sent",
    });
  }

  return {
    version: STORE_VERSION,
    me: { ...seedMe },
    people: seedPeople.map((person) => ({ ...person })),
    conversations: seedConversations.map((conversation) => ({
      ...conversation,
      memberIds: [...conversation.memberIds],
      lastMessage: conversation.lastMessage ? { ...conversation.lastMessage } : undefined,
    })),
    messages,
  };
}
