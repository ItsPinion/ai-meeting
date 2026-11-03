/**
 * Client-side integration test for the chat UI.
 *
 * Mounts the real component tree into jsdom with a localStorage shim and drives
 * it the way a user would: wait for the seed to load, open a group chat, send a
 * message, and assert that replies stream in and the composer stays blocked
 * until they do.
 *
 * Run with: bun scripts/check-ui.ts
 *
 * NOTE: every import is dynamic on purpose. React captures `document` when the
 * module is first evaluated, so the jsdom globals have to exist first.
 */

export {};

const { JSDOM } = await import("jsdom");

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "http://localhost:3000/",
  pretendToBeVisual: true,
});

const { window } = dom;
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLTextAreaElement",
  "HTMLInputElement",
  "Element",
  "Node",
  "Event",
  "InputEvent",
  "KeyboardEvent",
  "MouseEvent",
  "CustomEvent",
  "MutationObserver",
  "requestAnimationFrame",
  "cancelAnimationFrame",
]) {
  // @ts-expect-error copying browser globals onto the Node global
  if (globalThis[key] === undefined) globalThis[key] = window[key];
}
(globalThis as Record<string, unknown>).getComputedStyle =
  window.getComputedStyle.bind(window);
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { act } = await import("react");

const { resetStore } = await import("../lib/chat/storage");
const { Providers } = await import("../app/providers");
const { ChatWorkspace } = await import("../components/chat/chat-workspace");

let failures = 0;
function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}`, detail ?? "");
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits until `predicate` passes, flushing React work in between. */
async function waitFor(predicate: () => boolean, timeout = 8000, step = 40) {
  const deadline = Date.now() + timeout;
  for (;;) {
    await act(async () => {
      await sleep(step);
    });
    if (predicate()) return true;
    if (Date.now() > deadline) return predicate();
  }
}

const text = () => document.body.textContent ?? "";
const conversationButtons = () => [...document.querySelectorAll('nav[aria-label="Conversations"] button')];
const textarea = () => document.querySelector('textarea[aria-label="Message"]') as HTMLTextAreaElement | null;
const sendButton = () => document.querySelector('button[aria-label="Send message"]') as HTMLButtonElement | null;

async function click(node: Element | null | undefined, label: string) {
  if (!node) throw new Error(`Nothing to click: ${label}`);
  await act(async () => {
    node.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

async function clickConversation(name: string) {
  await click(
    conversationButtons().find((node) => (node.textContent ?? "").includes(name)),
    `conversation "${name}"`,
  );
}

/** Types into the composer the way React expects and presses Enter. */
async function typeAndSend(message: string) {
  const field = textarea();
  if (!field) throw new Error("No composer textarea");

  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(field, message);
    field.dispatchEvent(new window.Event("input", { bubbles: true }));
  });

  await waitFor(() => textarea()?.value === message, 2000);
  await click(sendButton(), "send");
}

const composerBlocked = () => Boolean(textarea()?.disabled) && Boolean(sendButton()?.disabled);
/** Bubbles currently rendered inside the transcript, skeleton included. */
const bubbleCount = () =>
  document.querySelectorAll('[aria-label="Messages"] div[class*="rounded-2xl"]').length;

// --- boot -----------------------------------------------------------------
console.log("\nboot");
resetStore();

const container = document.getElementById("root")!;
const root = createRoot(container);
await act(async () => {
  root.render(React.createElement(Providers, null, React.createElement(ChatWorkspace)));
});

check("renders the workspace shell", text().includes("Messages"));

// --- seeded data ----------------------------------------------------------
console.log("\nseeded data");
check("seed data is written to localStorage", window.localStorage.getItem("ai-meeting:chat") !== null);
check("conversation list loads", await waitFor(() => conversationButtons().length === 7));
check("group chats appear in the list", text().includes("Design team"));
check("second group chat appears in the list", text().includes("Launch squad"));
check("DMs appear in the list", text().includes("Maya Chen"));
check(
  "unread badges render",
  conversationButtons().some((node) => /(^|\D)5(\D|$)/.test(node.textContent ?? "")),
  conversationButtons().map((node) => node.textContent),
);

// --- direct message -------------------------------------------------------
console.log("\ndirect message");
check(
  "maya's thread loads",
  await waitFor(() =>
    (document.querySelector('[aria-label="Messages"]')?.textContent ?? "").includes("calendar invite"),
  ),
);
check("DM header shows presence", text().includes("Active now"));
check(
  "DM composer placeholder is personalised",
  await waitFor(() => textarea()?.placeholder === "Message Maya..."),
);

// --- group chat -----------------------------------------------------------
console.log("\ngroup chat");
await clickConversation("Design team");
check(
  "group header shows the member list",
  await waitFor(() => text().includes("Maya, Sam, Olivia")),
);
// "Standup in five" only exists in the transcript, never in the sidebar preview.
check(
  "group thread loads",
  await waitFor(() => (document.querySelector('[aria-label="Messages"]')?.textContent ?? "").includes("Standup in five")),
);
check("group messages name their author", text().includes("Sam"));
check(
  "group composer placeholder uses the group name",
  await waitFor(() => textarea()?.placeholder === "Message Design team..."),
);
check("member list renders in the details panel", text().includes("Members"));

// --- send + replies (group) ----------------------------------------------
console.log("\nsending into a group chat");
const bubblesBefore = bubbleCount();
await typeAndSend("Can someone take the empty states?");

check("my message appears immediately (optimistic)", text().includes("Can someone take the empty states?"));
check("composer is blocked while replies are pending", composerBlocked(), {
  textarea: textarea()?.disabled,
  send: sendButton()?.disabled,
});
check("waiting hint is shown", text().includes("Waiting for replies…"));
check("the bubble list already grew", bubbleCount() > bubblesBefore, { before: bubblesBefore, after: bubbleCount() });

check(
  "replies stream in and clear the waiting state",
  await waitFor(() => !text().includes("Waiting for replies…"), 15000, 60),
);
check("composer is released afterwards", !composerBlocked());
check("the thread grew", bubbleCount() > bubblesBefore + 1, { before: bubblesBefore, after: bubbleCount() });

const groupText = text();
check(
  "at least one reply came from a group member",
  ["Maya", "Sam", "Olivia"].some((name) => groupText.includes(name)),
);

check(
  "opening the group clears its unread badge",
  await waitFor(
    () =>
      !conversationButtons().some((node) =>
        /(^|\D)5(\D|$)/.test(node.textContent ?? ""),
      ),
  ),
);

// Snapshot now: the DM send below reorders the conversation list.
const groupStoreSnapshot = JSON.parse(window.localStorage.getItem("ai-meeting:chat") ?? "{}");
check(
  "the group conversation moved to the top",
  groupStoreSnapshot.conversations?.[0]?.id === "design",
  groupStoreSnapshot.conversations?.[0]?.id,
);

// --- direct message replies come from that one person ---------------------
console.log("\ndirect message replies");
await clickConversation("Maya Chen");
check(
  "maya's thread is showing again",
  await waitFor(() =>
    (document.querySelector('[aria-label="Messages"]')?.textContent ?? "").includes("calendar invite"),
  ),
);
await typeAndSend("Thursday works for me");
check("composer blocked in a DM too", composerBlocked());
check(
  "the DM reply arrives",
  await waitFor(() => !text().includes("Waiting for replies…"), 15000, 60),
);
check("composer released in a DM", !composerBlocked());

const storedDm = JSON.parse(window.localStorage.getItem("ai-meeting:chat") ?? "{}");
const dmThread = storedDm.messages?.maya ?? [];
const mineIndex = dmThread.findIndex(
  (m: { text: string }) => m.text === "Thursday works for me",
);
const afterMine = dmThread.slice(mineIndex + 1);
check("the DM grew by my message plus exactly one reply", afterMine.length === 1, afterMine.length);
check("exactly one reply came back", afterMine.length === 1, afterMine.map((m: { authorId: string }) => m.authorId));
check("the reply came from Maya, not someone else", afterMine[0]?.authorId === "maya");

// --- the composer is gated while the thread loads ---------------------------
console.log("\ncomposer gating during load");
await clickConversation("Jordan Taylor");
// Deliberately no wait: the thread fetch is still in flight here.
check(
  "the composer is blocked while the thread is read",
  composerBlocked(),
  { textarea: textarea()?.disabled, send: sendButton()?.disabled },
);
check("the loading hint is shown", text().includes("Loading conversation…"));
check(
  "the composer unlocks once the thread arrives",
  await waitFor(() => !composerBlocked()),
);

// --- a second send is possible again --------------------------------------
console.log("\nsecond send");
await typeAndSend("Thanks all!");
check("second message sends once replies settled", await waitFor(() => text().includes("Thanks all!")));
check(
  "second round of replies arrives",
  await waitFor(() => !text().includes("Waiting for replies…"), 15000, 60),
);

// --- localStorage persistence --------------------------------------------
console.log("\npersistence");
const stored = JSON.parse(window.localStorage.getItem("ai-meeting:chat") ?? "{}");
check("my message is persisted", JSON.stringify(stored).includes("Can someone take the empty states?"));
const designThread = stored.messages?.design ?? [];
check(
  "my message and the reply are persisted",
  designThread.length >= 7 && designThread.at(-1)?.authorId !== "me",
  { length: designThread.length, lastAuthor: designThread.at(-1)?.authorId },
);
check(
  "the most recently messaged conversation is listed first",
  stored.conversations?.[0]?.id === "jordan",
  stored.conversations?.[0]?.id,
);
check(
  "the group's preview reflects its own last message",
  (stored.conversations.find((c: { id: string }) => c.id === "design")?.lastMessage?.text ?? "").length > 0,
);

// --- reset ----------------------------------------------------------------
console.log("\nreset");
await click(document.querySelector('button[aria-label="Reset demo data"]'), "reset");
check("reset restores the seed thread", await waitFor(() => text().includes("spacing scale")));
check(
  "reset removes the sent messages",
  await waitFor(() => !text().includes("Can someone take the empty states?")),
);

await act(async () => {
  root.unmount();
});

console.log(`\n${failures === 0 ? "ALL UI CHECKS PASSED" : `${failures} UI CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
