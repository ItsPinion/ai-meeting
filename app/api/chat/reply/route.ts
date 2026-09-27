import { GoogleGenAI } from "@google/genai";

import { buildSystemInstruction, getPersona } from "@/lib/chat/personas";
import type { ReplyErrorResponse, ReplyRequest, ReplyResponse } from "@/lib/chat/reply";

/**
 * Generates one in-character reply with Gemini.
 *
 * The API key stays on the server: the browser only ever talks to this route.
 * Replies are stateless — the client sends the recent thread, and we replay it
 * as `user_input` / `model_output` steps so each persona keeps its own memory of
 * the conversation without any server-side session storage.
 */

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

/** Lazily created so a missing key does not throw at import time. */
let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI | undefined {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return undefined;
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

function failure(status: number, body: ReplyErrorResponse) {
  return Response.json(body, { status });
}

/**
 * Reports whether Gemini is configured, so the UI can say so instead of
 * silently falling back to in-character placeholder lines.
 */
export async function GET() {
  return Response.json({ configured: Boolean(process.env.GEMINI_API_KEY) });
}

export async function POST(request: Request) {
  const ai = getClient();
  if (!ai) {
    return failure(503, {
      error: "GEMINI_API_KEY is not set",
      reason: "not_configured",
    });
  }

  let body: ReplyRequest;
  try {
    body = (await request.json()) as ReplyRequest;
  } catch {
    return failure(400, { error: "Invalid JSON body", reason: "bad_request" });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return failure(400, { error: "prompt is required", reason: "bad_request" });
  }

  const persona = getPersona(body.authorId);
  if (!persona) {
    return failure(400, {
      error: `No persona for author "${body.authorId}"`,
      reason: "bad_request",
    });
  }

  // Everyone except the author, so the persona knows who else is listening.
  const otherMemberNames = (body.members ?? [])
    .filter((member) => member.id !== body.authorId)
    .map((member) => member.name);

  const systemInstruction = buildSystemInstruction({
    persona,
    authorName: body.authorName,
    kind: body.kind,
    conversationName: body.conversationName,
    otherMemberNames,
  });

  // Replay the thread. The user's turns stay bare; other people are attributed by
  // name so a group conversation reads as several distinct voices.
  const input = [
    ...(body.history ?? []).map((turn) =>
      turn.authorId === body.authorId
        ? {
            type: "model_output" as const,
            content: [{ type: "text" as const, text: turn.text }],
          }
        : {
            type: "user_input" as const,
            content: [
              {
                type: "text" as const,
                text:
                  turn.authorId === "me"
                    ? turn.text
                    : `${turn.authorName}: ${turn.text}`,
              },
            ],
          },
    ),
    {
      type: "user_input" as const,
      content: [{ type: "text" as const, text: prompt }],
    },
  ];

  try {
    const interaction = await ai.interactions.create({
      model: MODEL,
      input,
      system_instruction: systemInstruction,
      // Nothing is stored server-side; the client owns the history.
      store: false,
      generation_config: {
        // Chat replies are one-liners, so there is nothing to think deeply about.
        thinking_level: "low",
        max_output_tokens: 160,
      },
    });

    const text = interaction.output_text?.trim();
    if (!text) {
      return failure(502, { error: "Empty response from Gemini", reason: "upstream" });
    }

    return Response.json({ text } satisfies ReplyResponse);
  } catch (error) {
    console.error("[reply] Gemini request failed", error);
    return failure(502, {
      error: error instanceof Error ? error.message : "Gemini request failed",
      reason: "upstream",
    });
  }
}
