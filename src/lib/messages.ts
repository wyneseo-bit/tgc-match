export type ConversationRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender_id: string | null;
  user_a_read_at: string | null;
  user_b_read_at: string | null;
};

export const CONVERSATION_COLUMNS =
  "id, user_a_id, user_b_id, last_message_at, last_message_preview, last_sender_id, user_a_read_at, user_b_read_at";

/** The other person sent the latest message and I haven't opened it since. */
export function isUnread(c: ConversationRow, me: string) {
  if (!c.last_message_at || c.last_sender_id === me) return false;
  const readAt = c.user_a_id === me ? c.user_a_read_at : c.user_b_read_at;
  return !readAt || new Date(readAt) < new Date(c.last_message_at);
}
