import { ChatWorkspace } from "@/components/chat/chat-workspace";

/**
 * Server Component. All interactivity lives below the client boundary in
 * `components/chat/chat-workspace.tsx`, so this file needs no directives.
 */
export default function Page() {
  return <ChatWorkspace />;
}
