/** Deep-link helpers for /messages?with=username */

export function buildMessagesSearch(withUsername?: string) {
  return { with: withUsername?.trim() || undefined };
}

export function messagesPath(withUsername?: string): {
  to: "/messages";
  search: { with: string | undefined };
} {
  return {
    to: "/messages",
    search: { with: withUsername?.trim() || undefined },
  };
}
