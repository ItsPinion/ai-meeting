/** TanStack Query keys for the chat data. */
export const chatKeys = {
  all: ["chat"] as const,
  directory: () => [...chatKeys.all, "directory"] as const,
  messages: (conversationId: string) => [...chatKeys.all, "messages", conversationId] as const,
};
