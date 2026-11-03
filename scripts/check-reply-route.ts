/**
 * Verifies the request `POST /api/chat/reply` builds for Gemini, by stubbing
 * fetch and capturing what the SDK actually sends. Run with:
 *   bun scripts/check-reply-route.ts
 * Not part of the app build.
 */

export {};

process.env.GEMINI_API_KEY = "dummy-key-for-shape-check";

let captured: { url: string; body: unknown } | undefined;

// Capturing the outgoing request.
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  // The SDK hands over a Request object rather than (url, init).
  const request = input instanceof Request ? input : new Request(input, init);
  const raw = await request.clone().text();
  captured = {
    url: request.url,
    body: raw ? JSON.parse(raw) : undefined,
  };
  // A canned Gemini Interactions response.
  return new Response(
    JSON.stringify({
      id: "int-123",
      status: "completed",
      output_text: "oh nice, i'll take a look tonight",
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};

const { POST } = await import("../app/api/chat/reply/route");
const { resetStore, readStore } = await import("../lib/chat/storage");

resetStore();
const store = readStore();

function request(conversationId: string, authorId: string, prompt: string) {
  const conversation = store.conversations.find((c) => c.id === conversationId)!;
  const nameOf = (id: string) =>
    id === "me" ? store.me.name : store.people.find((p) => p.id === id)?.name ?? id;
  return {
    conversationId,
    kind: conversation.kind,
    conversationName: conversation.name,
    authorId,
    authorName: nameOf(authorId),
    members: conversation.memberIds.map((id) => ({ id, name: nameOf(id) })),
    prompt,
    history: (store.messages[conversationId] ?? []).map((message) => ({
      authorId: message.authorId,
      authorName: nameOf(message.authorId),
      text: message.text,
    })),
  };
}

let failures = 0;
function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) console.log(`  ok   ${label}`);
  else {
    failures += 1;
    console.log(`  FAIL ${label}`, detail ?? "");
  }
}

const response = await POST(
  new Request("http://localhost/api/chat/reply", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request("design", "maya", "what do you think of the empty state?")),
  }),
);

console.log("\ncaptured request");
check("response is 200", response.status === 200, response.status);
const payload = (await response.json()) as { text: string };
check("response text comes from output_text", payload.text === "oh nice, i'll take a look tonight", payload.text);
check("a request was captured", Boolean(captured));
check("hits the Interactions endpoint", /interactions/.test(captured?.url ?? ""), captured?.url);
console.log("  url:", captured?.url);

const body = captured?.body as {
  model: string;
  system_instruction: string;
  store: boolean;
  input: Array<{ type: string; content: Array<{ type: string; text: string }> }>;
  generation_config?: Record<string, unknown>;
};

check("model is set", Boolean(body.model), body.model);
check("system_instruction carries Maya's identity", /product designer/.test(body.system_instruction));
check("system_instruction names the group", /Design team/.test(body.system_instruction));
check("system_instruction names the other members", /Sam Williams/.test(body.system_instruction));
check("store is false (no server-side session)", body.store === false);
check(
  "history is replayed as user_input/model_output steps",
  body.input.length > 0 && body.input.every((step) => ["user_input", "model_output"].includes(step.type)),
  body.input.map((s) => s.type),
);
check(
  "the prompt is the final user_input",
  body.input.at(-1)?.type === "user_input" &&
    body.input.at(-1)?.content[0]?.text === "what do you think of the empty state?",
  body.input.at(-1),
);
check(
  "other people's turns are attributed by name",
  body.input.some((step) => step.content[0]?.text.includes(": ")),
);
check("no thinking tokens burned on a one-liner", body.generation_config?.thinking_level === "low");
console.log("  input steps:", JSON.stringify(body.input.map((s) => [s.type, s.content[0].text])));

// The current user's own turns must not be attributed with a name prefix.
const mine = body.input.filter((step) => step.type === "user_input" && step.content[0]?.text.startsWith("Jamie Davis:"));
check("the user's own turns stay bare", mine.length === 0, mine);

// A DM must name the counterpart rather than a group.
const dmResponse = await POST(
  new Request("http://localhost/api/chat/reply", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request("maya", "maya", "thursday works for me")),
  }),
);
check("dm response is 200", dmResponse.status === 200);
const dmBody = captured?.body as { system_instruction: string };
check(
  "dm instruction names the counterpart",
  /Jamie Davis/.test(dmBody.system_instruction),
  dmBody.system_instruction,
);
check("dm system instruction differs from the group one", dmBody.system_instruction !== body.system_instruction);
check("dm instruction mentions a direct message", /direct message/.test(dmBody.system_instruction), dmBody.system_instruction);

console.log(`\n${failures === 0 ? "ROUTE CHECK PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
