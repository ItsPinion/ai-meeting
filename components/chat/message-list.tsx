"use client";

import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";

import { MessageRow } from "@/components/chat/message-row";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { isGroup } from "@/lib/chat/format";
import type { Conversation, Message, Person } from "@/lib/chat/types";

interface MessageListProps {
  conversation: Conversation;
  people: Person[];
  me: Person;
  messages: Message[];
  /** True while the thread is being read for the first time. */
  isLoading: boolean;
  /** True while a background refresh is running. */
  isFetching: boolean;
  error: Error | null;
  /** Ids of the people currently replying, from `useSendMessage`. */
  typingIds: string[];
}

/** Scrollable transcript for the selected conversation. */
export function MessageList({
  conversation,
  people,
  me,
  messages,
  isLoading,
  isFetching,
  error,
  typingIds,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const group = isGroup(conversation);
  const typingPeople = typingIds
    .map((id) => people.find((person) => person.id === id))
    .filter((person): person is Person => Boolean(person));

  // Keep the newest message in view as replies stream in.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, typingPeople.length, conversation.id]);

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-label="Messages"
      aria-live="polite"
      className="flex-1 overflow-y-auto px-5 py-7 md:px-10"
    >
      <div className="mx-auto max-w-[760px]">
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#eff0f2]" />
          <span className="text-[11px] font-medium text-[#b1b3ba]">Today</span>
          <div className="h-px flex-1 bg-[#eff0f2]" />
        </div>

        {isLoading ? (
          <MessageListSkeleton />
        ) : error ? (
          <ErrorMessage message={error.message || "Could not load this conversation."} />
        ) : messages.length === 0 ? (
          <EmptyConversation title={conversation.name ?? "this conversation"} group={group} />
        ) : (
          <div className="space-y-5">
            {messages.map((message) => {
              const author =
                message.authorId === me.id
                  ? me
                  : (people.find((person) => person.id === message.authorId) ?? me);

              return (
                <MessageRow
                  key={message.id}
                  message={message}
                  author={author}
                  showAuthor={group}
                />
              );
            })}

            <TypingIndicator people={typingPeople} />
          </div>
        )}

        {isFetching && !isLoading && (
          <p className="mt-6 text-center text-[11px] text-[#b1b3ba]">Refreshing…</p>
        )}
      </div>
    </div>
  );
}

function MessageListSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      {[
        "w-[58%]",
        "w-[42%] ml-auto",
        "w-[66%]",
        "w-[35%] ml-auto",
      ].map((width, index) => (
        <div
          key={index}
          className={`flex ${width.includes("ml-auto") ? "justify-end" : "justify-start"}`}
        >
          <div className={`h-11 animate-pulse rounded-2xl bg-[#f0f1f4] ${width}`} />
        </div>
      ))}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[#f3d6d2] bg-[#fdf3f1] px-4 py-3 text-[13px] text-[#a04438]">
      {message}
    </div>
  );
}

function EmptyConversation({ title, group }: { title: string; group: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f1f4] text-[#9b9da6]">
        <MessageSquare size={20} />
      </div>
      <p className="mt-4 text-[14px] font-semibold text-[#3a3d46]">No messages yet</p>
      <p className="mt-1 max-w-[280px] text-[12px] text-[#9a9da6]">
        {group
          ? `Say hello to ${title} — everyone in the group will see it.`
          : `Say hello to ${title} to start the conversation.`}
      </p>
    </div>
  );
}
