"use client";

import { useState } from "react";

import { useDirectory } from "@/hooks/use-directory";
import { useMessages } from "@/hooks/use-messages";
import { useSendMessage } from "@/hooks/use-send-message";
import { ChatHeader } from "@/components/chat/chat-header";
import { ConversationDetails } from "@/components/chat/conversation-details";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { MessageComposer } from "@/components/chat/message-composer";
import { MessageList } from "@/components/chat/message-list";
import type { Conversation, Person } from "@/lib/chat/types";

/**
 * The chat shell.
 *
 * This is the only place that owns "which conversation is open". Everything else
 * either reads it from props (presentational components) or from TanStack Query
 * (data), which keeps the client boundary small and obvious.
 */
export function ChatWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isPending, isError } = useDirectory();

  const conversations = data?.conversations ?? [];
  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];

  if (isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f7f9] p-6">
        <div className="max-w-[420px] rounded-2xl border border-[#e8e9ed] bg-white p-8 text-center shadow-[0_12px_50px_rgba(31,37,52,0.08)]">
          <h1 className="text-[16px] font-semibold text-[#1b1d24]">Could not load your messages</h1>
          <p className="mt-2 text-[13px] text-[#8a8d97]">
            Your conversations live in this browser&rsquo;s local storage and could not be read.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#1b1d24] md:p-6">
      <div className="mx-auto flex min-h-screen max-w-[1480px] overflow-hidden bg-white shadow-[0_12px_50px_rgba(31,37,52,0.08)] md:min-h-[calc(100vh-48px)] md:rounded-2xl md:border md:border-[#e8e9ed]">
        <ConversationSidebar selectedId={selected?.id ?? ""} onSelect={setSelectedId} />

        {!selected ? (
          <section className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 text-center">
            {isPending ? (
              <>
                <div className="h-12 w-12 animate-pulse rounded-full bg-[#f0f1f4]" />
                <p className="text-[13px] text-[#9a9da6]">Loading conversations…</p>
              </>
            ) : (
              <>
                <h1 className="text-[16px] font-semibold">No conversation selected</h1>
                <p className="max-w-[280px] text-[13px] text-[#9a9da6]">
                  Pick a chat from the sidebar to start reading and sending messages.
                </p>
              </>
            )}
          </section>
        ) : (
          data && (
            <ChatPanel
              key={selected.id}
              conversation={selected}
              people={data.people}
              me={data.me}
            />
          )
        )}

        {selected && data && (
          <ConversationDetails conversation={selected} people={data.people} me={data.me} />
        )}
      </div>
    </main>
  );
}

interface ChatPanelProps {
  conversation: Conversation;
  people: Person[];
  me: Person;
}

/**
 * Owns the queries for the open conversation.
 *
 * `key={conversation.id}` remounts this per conversation, so an in-flight reply
 * stream always writes into the cache entry it belongs to, and the typing
 * indicator is shared by the transcript and the composer.
 */
function ChatPanel({ conversation, people, me }: ChatPanelProps) {
  const messages = useMessages(conversation.id);
  // The hook needs the participants and the thread so far, because the replies
  // are generated in character from those rather than picked at random.
  const { send, isPending: isSending, typingIds } = useSendMessage({
    conversation,
    people,
    me,
    history: messages.data ?? [],
  });

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-white">
      <ChatHeader conversation={conversation} people={people} me={me} />

      <MessageList
        conversation={conversation}
        people={people}
        me={me}
        messages={messages.data ?? []}
        isLoading={messages.isPending}
        isFetching={messages.isFetching}
        error={messages.error}
        typingIds={typingIds}
      />

      <MessageComposer
        conversation={conversation}
        people={people}
        send={send}
        // The composer stays blocked while the thread is still being read as
        // well as while replies are outstanding.
        isSending={isSending || messages.isPending}
        isLoadingThread={messages.isPending}
      />
    </section>
  );
}
