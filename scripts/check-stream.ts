/**
 * Verifies the streaming contract of the mock send API: `onSent` fires first,
 * every responder gets a typing indicator, and each indicator clears right
 * before that person's reply lands. Run with `bun scripts/check-stream.ts`.
 */

export {};

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

// @ts-expect-error minimal browser shim
globalThis.window = { localStorage: new MemoryStorage() };

const { resetStore, readStore } = await import("../lib/chat/storage");
const { sendMessage } = await import("../lib/chat/api");

resetStore();

/** The API needs the participants and the thread to answer in character. */
function contextFor(conversationId: string) {
  const store = readStore();
  const conversation = store.conversations.find((c) => c.id === conversationId);
  if (!conversation) throw new Error(`no conversation ${conversationId}`);
  return {
    conversation,
    people: store.people,
    me: store.me,
    history: store.messages[conversationId] ?? [],
  };
}

const events: string[] = [];
const start = Date.now();

const result = await sendMessage(
  {
    conversationId: "launch",
    text: "who is on for the launch review?",
    id: "stream-1",
    context: contextFor("launch"),
  },
  {
    onSent: (message) => events.push(`sent:${message.id}:${message.status}`),
    onTypingStart: (authorId) => events.push(`typing+${authorId}`),
    onTypingEnd: (authorId) => events.push(`typing-${authorId}`),
    onReply: (message) => events.push(`reply:${message.authorId}@${Date.now() - start}ms`),
  },
);

console.log("event order:");
events.forEach((event, index) => console.log(`  ${index + 1}. ${event}`));
console.log("\nresult.replies:", result.replies.map((reply) => reply.authorId));

let ok = true;
const fail = (message: string, detail?: unknown) => {
  ok = false;
  console.log("FAIL:", message, detail ?? "");
};

if (events[0] !== "sent:stream-1:sent") fail("onSent must fire first with the client id");
if (!events.some((event) => event.startsWith("typing+"))) fail("typing indicators should start");

const replyEvents = events.filter((event) => event.startsWith("reply:"));
if (replyEvents.length !== result.replies.length) fail("one onReply per reply");

for (const reply of replyEvents) {
  const author = reply.split(":")[1].split("@")[0];
  const replyIndex = events.indexOf(reply);
  const clearIndex = events.indexOf(`typing-${author}`);

  if (clearIndex !== replyIndex - 1) {
    fail(`typing for '${author}' must clear immediately before their reply lands`, events);
  }
  if (!events.slice(0, clearIndex).includes(`typing+${author}`)) {
    fail(`typing for '${author}' must start before it clears`);
  }
}

const stamps = replyEvents.map((event) => Number(event.split("@")[1].replace("ms", "")));
if (stamps.length > 1 && stamps[stamps.length - 1] - stamps[0] < 100) {
  fail("replies should be staggered over time", stamps);
}

console.log(ok ? "\nSTREAM CHECK PASSED" : "\nSTREAM CHECK FAILED");
process.exit(ok ? 0 : 1);
