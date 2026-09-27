"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Paperclip, Send, Smile } from "lucide-react";

import { cn } from "@/lib/utils";
import { composerPlaceholder } from "@/lib/chat/format";
import type { Conversation, Person } from "@/lib/chat/types";

interface MessageComposerProps {
  conversation: Conversation;
  people: Person[];
  /** From `useSendMessage`. Resolves once every reply has landed. */
  send: (text: string) => void;
  /**
   * True while this conversation is unsettled — either its history is still
   * being read, or replies to your last message are still arriving.
   */
  isSending: boolean;
  /** Distinguishes the two reasons `isSending` can be true. */
  isLoadingThread: boolean;
}

/**
 * Message input.
 *
 * The send button and the Enter shortcut stay disabled while `isSending` is
 * true, so you can never fire a second message into a conversation that is
 * still answering you.
 */
export function MessageComposer({
  conversation,
  people,
  send,
  isSending,
  isLoadingThread,
}: MessageComposerProps) {
  const [draft, setDraft] = useState("");
  const [draftedFor, setDraftedFor] = useState(conversation.id);

  // Clear the draft when the conversation changes (React's "adjust state during
  // render" pattern). `ChatPanel` is keyed by conversation id and remounts this
  // component anyway, so this is just a safety net.
  if (draftedFor !== conversation.id) {
    setDraftedFor(conversation.id);
    setDraft("");
  }

  const canSend = draft.trim().length > 0 && !isSending;
  const status = isLoadingThread ? "Loading conversation…" : "Waiting for replies…";

  function sendDraft() {
    if (!canSend) return;
    send(draft);
    setDraft("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendDraft();
  }

  return (
    <div className="border-t border-[#eaebef] bg-white px-5 py-4 md:px-10 md:py-5">
      <form onSubmit={submit} className="mx-auto max-w-[760px]">
        <div
          className={cn(
            "flex items-end gap-2 rounded-xl border bg-[#fbfbfc] px-3 py-2 shadow-sm transition",
            isSending
              ? "border-[#e6e7f4]"
              : "border-[#dedfe5] focus-within:border-[#8990ec] focus-within:ring-2 focus-within:ring-[#4f5ce6]/10",
          )}
        >
          <button
            type="button"
            aria-label="Add attachment"
            className="mb-1 rounded-lg p-2 text-[#858892] hover:bg-[#eeeff3]"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            aria-label="Message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                event.keyCode !== 229
              ) {
                event.preventDefault();
                sendDraft();
              }
            }}
            placeholder={isSending ? status : composerPlaceholder(conversation, people)}
            rows={1}
            disabled={isSending}
            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#a5a7af] disabled:cursor-not-allowed"
          />

          <button
            type="button"
            aria-label="Add emoji"
            className="mb-1 rounded-lg p-2 text-[#858892] hover:bg-[#eeeff3]"
          >
            <Smile size={18} />
          </button>

          <button
            type="submit"
            aria-label="Send message"
            disabled={!canSend}
            className="mb-1 rounded-lg bg-[#4f5ce6] p-2 text-white transition hover:bg-[#414dcc] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSending ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}
          </button>
        </div>

        <div className="mt-2 flex min-h-[16px] items-center justify-between gap-3">
          <p className="hidden text-[11px] text-[#b0b2ba] md:block">
            Press Enter to send · Shift + Enter for a new line
          </p>
          {isSending && (
            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-1.5 text-[11px] font-medium text-[#6b6fd0]"
            >
              <LoaderCircle size={11} className="animate-spin" />
              {status}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
