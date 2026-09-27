/**
 * Placeholder replies.
 *
 * These stand in for whatever the real backend will return. When the API
 * exists, delete this file and have `lib/chat/api.ts` request replies instead.
 */

/** Generic replies used in direct messages. */
export const dmReplies: readonly string[] = [
  "Got it — thanks for the update!",
  "That works for me, let’s do it.",
  "Sounds good. I’ll take a look tonight.",
  "Ha, fair enough.",
  "Can you send me the details when you get a sec?",
  "I’m in. Just tell me where and when.",
  "Let me check my calendar and get back to you.",
  "Perfect timing, I was just about to ask.",
  "Noted, I’ll add it to the list.",
  "Really appreciate you jumping on this.",
  "Makes sense to me.",
  "I’ll loop in the others and follow up.",
  "Quick question before we lock it in — what’s the deadline?",
  "Yep, that matches what I was thinking.",
  "Sorry for the slow reply, busy morning!",
];

/** Replies that read naturally when several people answer at once. */
export const groupReplies: readonly string[] = [
  "Agreed — let’s go with that.",
  "I can pick this up after standup.",
  "Adding my notes to the doc now.",
  "One thing to double check: does this work on mobile?",
  "Nice, this unblocks me.",
  "I’ll take the first pass and share it here.",
  "+1 from me.",
  "Let’s split it — I’ll handle the copy, you take the layout.",
  "Pushed a small fix, should be live in a minute.",
  "Can we revisit this in tomorrow’s sync?",
  "That’s a much cleaner approach.",
  "I’ve got capacity this week if nobody else has started.",
  "Copying the thread into the project channel so nobody misses it.",
  "Left a couple of comments in the file.",
  "Looks good to me, ship it.",
  "Wait, is this the same as last week’s version?",
  "Great progress everyone.",
  "I’ll write it up once we agree on the direction.",
];
