/**
 * Ad-hoc harness for the localStorage chat layer. Run with:
 *   bun scripts/check-chat-logic.ts
 * Not part of the app build.
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

const storage = new MemoryStorage();
// @ts-expect-error minimal browser shim
globalThis.window = { localStorage: storage };

const { readStore, resetStore } = await import("../lib/chat/storage");
const { STORAGE_KEY } = await import("../lib/chat/constants");
const { fetchDirectory, fetchMessages, sendMessage } = await import("../lib/chat/api");

let failures = 0;
function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}`, detail ?? "");
  }
}

// --- seeding -------------------------------------------------------------
console.log("\nseeding");
resetStore();
check("localStorage is written on first read", storage.getItem(STORAGE_KEY) !== null);
check("raw payload is a JSON store", typeof JSON.parse(storage.getItem(STORAGE_KEY)!).conversations === "object");
const seeded = readStore();
check("seed has 7 conversations", seeded.conversations.length === 7, seeded.conversations.length);
check(
  "seed has 2 group chats",
  seeded.conversations.filter((c) => c.kind === "group").length === 2,
);
check(
  "seed has 5 direct messages",
  seeded.conversations.filter((c) => c.kind === "dm").length === 5,
);
check("seed thread for maya has 4 messages", (seeded.messages.maya ?? []).length === 4);
check("design thread has 5 messages", (seeded.messages.design ?? []).length === 5);

// --- directory / messages ------------------------------------------------
console.log("\nreads");
const directory = await fetchDirectory();
check("directory exposes people", directory.people.length === 7);
check("directory exposes me", directory.me.id === "me");
const mayaMessages = await fetchMessages("maya");
check("fetchMessages returns the thread", mayaMessages.length === 4);
check("fetchMessages returns a copy (not the stored array)", mayaMessages !== readStore().messages.maya);
check("unknown conversation returns []", (await fetchMessages("nope")).length === 0);

// --- direct message reply ------------------------------------------------
console.log("\ndirect message");
const dmStart = (await fetchMessages("maya")).length;
const dm = await sendMessage({ conversationId: "maya", text: "  Thursday works  ", id: "dm-1" });
check("outgoing message is trimmed and stored", dm.message.text === "Thursday works", dm.message.text);
check("outgoing message is mine", dm.message.authorId === "me");
check("exactly one reply in a DM", dm.replies.length === 1, dm.replies.length);
check("the DM reply comes from the other person", dm.replies[0].authorId === "maya", dm.replies[0].authorId);
check("the reply text is non-empty", dm.replies[0].text.trim().length > 0);
check("thread grew by 2", (await fetchMessages("maya")).length === dmStart + 2);
check("conversation bubbled to the top", readStore().conversations[0].id === "maya");
check("preview updated", readStore().conversations[0].lastMessage?.text === dm.replies[0].text);

// --- group replies --------------------------------------------------------
console.log("\ngroup chat");
const counts: number[] = [];
for (let run = 0; run < 40; run += 1) {
  const result = await sendMessage({
    conversationId: "design",
    text: `ping ${run}`,
    id: `grp-${run}`,
  });
  counts.push(result.replies.length);
  {
    const authors = new Set(result.replies.map((r) => r.authorId));
    if (authors.size !== result.replies.length) {
      failures += 1;
      console.log(`  FAIL run ${run}: duplicate responders`, [...authors]);
    }
    if (result.replies.some((r) => r.authorId === "me")) {
      failures += 1;
      console.log(`  FAIL run ${run}: replied to itself`);
    }
    if (result.replies.some((r) => r.text.trim().length === 0)) {
      failures += 1;
      console.log(`  FAIL run ${run}: empty reply text`);
    }
    const texts = new Set(result.replies.map((r) => r.text));
    if (texts.size !== result.replies.length) {
      failures += 1;
      console.log(`  FAIL run ${run}: duplicate reply text`);
    }
  }
}
const min = Math.min(...counts);
const max = Math.max(...counts);
check("group replies are between 1 and 3", min >= 1 && max <= 3, { min, max });
check("group reply count varies", min !== max, { min, max });
check("more than one responder happens", max > 1, { max });
console.log(`  info reply-count distribution: ${JSON.stringify(counts.reduce<Record<number, number>>((acc, n) => ({ ...acc, [n]: (acc[n] ?? 0) + 1 }), {}))}`);

// --- persistence ----------------------------------------------------------
console.log("\npersistence");
const before = (await fetchMessages("design")).length;
const reloaded = readStore();
check("messages survive a fresh read", (reloaded.messages.design ?? []).length === before);
check("unread badge untouched by replies", reloaded.conversations.find((c) => c.id === "jordan")?.unread === 2);
check(
  "replies never bump the unread count",
  reloaded.conversations.find((c) => c.id === "design")?.unread === 5,
  reloaded.conversations.find((c) => c.id === "design")?.unread,
);

// --- reset ----------------------------------------------------------------
console.log("\nreset");
resetStore();
check("reset restores the seed", readStore().conversations.length === 7);
check("reset clears sent messages", (readStore().messages.design ?? []).length === 5);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
