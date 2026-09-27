"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Edit3,
  FileText,
  Image as ImageIcon,
  Info,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  Video,
} from "lucide-react";

type Person = {
  id: string;
  name: string;
  initials: string;
  color: string;
  preview: string;
  time: string;
  unread?: number;
  online?: boolean;
};

type Message = {
  id: number;
  text: string;
  mine?: boolean;
  time: string;
  read?: boolean;
};

const people: Person[] = [
  {
    id: "maya",
    name: "Maya Chen",
    initials: "MC",
    color: "bg-[#ffd6cb] text-[#9d493b]",
    preview: "That sounds perfect! I’ll send...",
    time: "9:41 AM",
    online: true,
  },
  {
    id: "jordan",
    name: "Jordan Taylor",
    initials: "JT",
    color: "bg-[#d9d4ff] text-[#5a4eaa]",
    preview: "Are we still on for tomorrow?",
    time: "Yesterday",
    unread: 2,
  },
  {
    id: "sam",
    name: "Sam Williams",
    initials: "SW",
    color: "bg-[#cfead9] text-[#3e7956]",
    preview: "Sent a photo",
    time: "Mon",
    online: true,
  },
  {
    id: "olivia",
    name: "Olivia Martinez",
    initials: "OM",
    color: "bg-[#f9e3ae] text-[#946b25]",
    preview: "Thanks for your help!",
    time: "Sun",
  },
  {
    id: "noah",
    name: "Noah Patel",
    initials: "NP",
    color: "bg-[#c9e5ef] text-[#397587]",
    preview: "You: Let’s catch up soon",
    time: "Sat",
  },
  {
    id: "design",
    name: "Design team",
    initials: "DT",
    color: "bg-[#e7d5f5] text-[#764797]",
    preview: "Alex: New ideas are in Figma",
    time: "Fri",
    unread: 5,
  },
];

const initialMessages: Record<string, Message[]> = {
  maya: [
    {
      id: 1,
      text: "Hey! Are you free for a quick catch-up this week?",
      time: "9:36 AM",
    },
    {
      id: 2,
      text: "I have a few ideas I’d love to run by you.",
      time: "9:37 AM",
    },
    {
      id: 3,
      text: "Absolutely! I’m free Thursday afternoon. What did you have in mind?",
      mine: true,
      time: "9:39 AM",
    },
    {
      id: 4,
      text: "That sounds perfect! I’ll send over a calendar invite.",
      time: "9:41 AM",
    },
  ],
  jordan: [{ id: 1, text: "Are we still on for tomorrow?", time: "Yesterday" }],
  sam: [{ id: 1, text: "Sent a photo", time: "Mon" }],
  olivia: [{ id: 1, text: "Thanks for your help!", time: "Sun" }],
  noah: [{ id: 1, text: "Let’s catch up soon", mine: true, time: "Sat" }],
  design: [{ id: 1, text: "New ideas are in Figma", time: "Fri" }],
};

export default function Page() {
  const [selectedId, setSelectedId] = useState("maya");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const selected =
    people.find((person) => person.id === selectedId) ?? people[0];
  const visiblePeople = useMemo(
    () =>
      people.filter((person) =>
        person.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => ({
      ...current,
      [selectedId]: [
        ...(current[selectedId] ?? []),
        { id: Date.now(), text, mine: true, time: "Just now", read: true },
      ],
    }));
    setDraft("");
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#1b1d24] md:p-6">
      <div className="mx-auto flex min-h-screen max-w-[1480px] overflow-hidden bg-white shadow-[0_12px_50px_rgba(31,37,52,0.08)] md:min-h-[calc(100vh-48px)] md:rounded-2xl md:border md:border-[#e8e9ed]">
        <aside className="hidden w-[340px] shrink-0 border-r border-[#eaebef] bg-[#fbfbfc] md:flex md:flex-col">
          <div className="flex items-center justify-between px-6 pb-5 pt-7">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9b9da6]">
                Workspace
              </p>
              <button className="mt-1 flex items-center gap-1 text-[20px] font-semibold tracking-[-0.03em]">
                Messages <ChevronDown size={16} className="text-[#8f9199]" />
              </button>
            </div>
            <button
              aria-label="Compose new message"
              className="rounded-lg border border-[#e2e3e8] bg-white p-2.5 text-[#555965] shadow-sm transition hover:bg-[#f2f3f6]"
            >
              <Edit3 size={17} />
            </button>
          </div>
          <div className="px-5 pb-5">
            <label className="flex items-center gap-2 rounded-lg bg-[#f0f1f4] px-3 py-2.5 text-sm text-[#9699a2]">
              <Search size={16} />
              <input
                aria-label="Search conversations"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search conversations"
                className="w-full bg-transparent outline-none placeholder:text-[#9699a2]"
              />
            </label>
          </div>
          <div className="flex items-center justify-between px-6 pb-2">
            <span className="text-[12px] font-semibold uppercase tracking-[0.13em] text-[#a0a2aa]">
              Recent
            </span>
            <button className="text-xs font-medium text-[#777b85] hover:text-[#262932]">
              See all
            </button>
          </div>
          <nav aria-label="Conversations" className="space-y-1 px-3">
            {visiblePeople.map((person) => (
              <button
                key={person.id}
                onClick={() => setSelectedId(person.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${person.id === selectedId ? "bg-[#eceef5]" : "hover:bg-[#f1f2f5]"}`}
              >
                <Avatar person={person} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[14px] font-semibold">
                      {person.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-[#a2a4ac]">
                      {person.time}
                    </span>
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] text-[#8a8d97]">
                      {person.preview}
                    </span>
                    {person.unread && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4d5be5] px-1.5 text-[10px] font-bold text-white">
                        {person.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-3 border-t border-[#eaebef] px-6 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#293047] text-xs font-bold text-white">
              JD
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Jamie Davis</p>
              <p className="text-xs text-[#999ca5]">Personal account</p>
            </div>
            <MoreHorizontal size={18} className="text-[#9b9da5]" />
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-white">
          <header className="flex items-center justify-between border-b border-[#eaebef] px-5 py-4 md:px-8 md:py-5">
            <div className="flex items-center gap-3">
              <Avatar person={selected} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[16px] font-semibold">{selected.name}</h1>
                  {selected.online && (
                    <span className="rounded-full bg-[#e4f5eb] px-2 py-0.5 text-[10px] font-semibold text-[#3c8a5a]">
                      Active now
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[#9a9da6]">
                  {selected.online
                    ? "Usually replies in a few minutes"
                    : "Last seen recently"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#787b85]">
              <button
                aria-label="Start voice call"
                className="rounded-lg p-2.5 hover:bg-[#f3f4f6]"
              >
                <Phone size={18} />
              </button>
              <button
                aria-label="Start video call"
                className="rounded-lg p-2.5 hover:bg-[#f3f4f6]"
              >
                <Video size={19} />
              </button>
              <button
                aria-label="Conversation information"
                className="rounded-lg p-2.5 hover:bg-[#f3f4f6]"
              >
                <Info size={19} />
              </button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-7 md:px-10">
            <div className="mx-auto max-w-[760px]">
              <div className="mb-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#eff0f2]" />
                <span className="text-[11px] font-medium text-[#b1b3ba]">
                  Today
                </span>
                <div className="h-px flex-1 bg-[#eff0f2]" />
              </div>
              <div className="space-y-5">
                {(messages[selectedId] ?? []).map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${message.mine ? "justify-end" : "justify-start"}`}
                  >
                    {!message.mine && <Avatar person={selected} small />}
                    <div
                      className={`max-w-[78%] md:max-w-[62%] ${message.mine ? "items-end" : "items-start"} flex flex-col`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${message.mine ? "rounded-br-md bg-[#4f5ce6] text-white" : "rounded-bl-md bg-[#f0f1f4] text-[#3a3d46]"}`}
                      >
                        {message.text}
                      </div>
                      <span className="mt-1.5 flex items-center gap-1 text-[10px] text-[#b1b3ba]">
                        {message.time}
                        {message.mine && message.read && (
                          <>
                            <span>·</span>
                            <Check size={12} />
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-[#eaebef] bg-white px-5 py-4 md:px-10 md:py-5">
            <form onSubmit={sendMessage} className="mx-auto max-w-[760px]">
              <div className="flex items-end gap-2 rounded-xl border border-[#dedfe5] bg-[#fbfbfc] px-3 py-2 shadow-sm focus-within:border-[#8990ec] focus-within:ring-2 focus-within:ring-[#4f5ce6]/10">
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
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder={`Message ${selected.name.split(" ")[0]}...`}
                  rows={1}
                  className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#a5a7af]"
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
                  className="mb-1 rounded-lg bg-[#4f5ce6] p-2 text-white transition hover:bg-[#414dcc] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!draft.trim()}
                >
                  <Send size={17} />
                </button>
              </div>
              <p className="mt-2 hidden text-[11px] text-[#b0b2ba] md:block">
                Press Enter to send · Shift + Enter for a new line
              </p>
            </form>
          </div>
        </section>
        <aside className="hidden w-[250px] shrink-0 border-l border-[#eaebef] bg-[#fbfbfc] px-5 py-7 xl:block">
          <div className="flex flex-col items-center text-center">
            <Avatar person={selected} large />
            <h2 className="mt-3 text-[15px] font-semibold">{selected.name}</h2>
            <p className="mt-1 text-xs text-[#999ca5]">
              {selected.online ? "Online" : "Offline"}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                aria-label="Call"
                className="rounded-lg bg-white p-2.5 text-[#686c77] shadow-sm ring-1 ring-[#e6e7eb] hover:bg-[#f3f4f6]"
              >
                <Phone size={16} />
              </button>
              <button
                aria-label="Video call"
                className="rounded-lg bg-white p-2.5 text-[#686c77] shadow-sm ring-1 ring-[#e6e7eb] hover:bg-[#f3f4f6]"
              >
                <Video size={16} />
              </button>
              <button
                aria-label="More options"
                className="rounded-lg bg-white p-2.5 text-[#686c77] shadow-sm ring-1 ring-[#e6e7eb] hover:bg-[#f3f4f6]"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
          <div className="mt-10 border-t border-[#e6e7eb] pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#a0a2aa]">
              Shared media
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="flex aspect-square items-center justify-center rounded-lg bg-[#eef0f3] text-[#999ca5]">
                <ImageIcon size={18} />
              </div>
              <div className="flex aspect-square items-center justify-center rounded-lg bg-[#eef0f3] text-[#999ca5]">
                <FileText size={18} />
              </div>
              <div className="flex aspect-square items-center justify-center rounded-lg bg-[#eef0f3] text-[#999ca5]">
                <Plus size={18} />
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2 text-xs text-[#9699a3]">
            <CircleHelp size={15} /> Help center
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#9699a3]">
            <Bell size={15} /> Notifications
          </div>
        </aside>
      </div>
    </main>
  );
}

function Avatar({
  person,
  small,
  large,
}: {
  person: Person;
  small?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full font-semibold ${person.color} ${large ? "h-16 w-16 text-lg" : small ? "h-7 w-7 text-[9px]" : "h-10 w-10 text-xs"}`}
    >
      <span>{person.initials}</span>
      {person.online && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#4dbb72] ${small ? "h-2 w-2" : "h-3 w-3"}`}
        />
      )}
    </div>
  );
}
