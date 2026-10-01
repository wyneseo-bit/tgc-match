"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { LocalTime } from "@/components/LocalTime";
import { cx } from "@/components/ui";
import { markConversationRead, sendMessage } from "../actions";

export type Message = { id: string; sender_id: string; body: string; created_at: string };

const MAX = 2000;

export function Thread({
  conversationId,
  me,
  initial,
}: {
  conversationId: string;
  me: string;
  initial: Message[];
}) {
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  // Live updates: new rows in this conversation arrive over Realtime
  // (RLS applies, so only the two participants receive them).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
          if (m.sender_id !== me) markConversationRead(conversationId);
        },
      )
      .subscribe();
    markConversationRead(conversationId);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, me]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    start(async () => {
      setError(null);
      const r = await sendMessage(conversationId, body);
      if (r.error) {
        setError(r.error);
        return;
      }
      setDraft("");
      // If Realtime isn't connected, refetching keeps the thread correct.
      const { data } = await createClient()
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data) setMessages(data as Message[]);
    });
  };

  return (
    <div className="flex min-h-[60dvh] flex-col rounded-lg bg-page ring-1 ring-inset ring-line">
      <ol className="flex-1 space-y-2 overflow-y-auto p-4 md:p-6" aria-live="polite">
        {messages.length === 0 && (
          <li className="py-10 text-center text-sm text-muted">Say hello and agree where and when to meet.</li>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <li key={m.id} className={cx("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cx(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px]",
                  mine ? "rounded-br-sm bg-pear text-pear-ink" : "rounded-bl-sm bg-page-2 text-fg ring-1 ring-inset ring-line-2",
                )}
              >
                <p className="whitespace-pre-line break-words">{m.body}</p>
                <p className={cx("mt-1 text-[11px]", mine ? "text-pear-ink/60" : "text-muted")}>
                  <LocalTime iso={m.created_at} format="short" />
                </p>
              </div>
            </li>
          );
        })}
        <div ref={bottom} />
      </ol>

      <form
        className="flex items-end gap-2 border-t border-line p-3 md:p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          id="message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={MAX}
          placeholder="Write a message"
          className="max-h-40 min-h-11 flex-1 resize-none rounded-md bg-page-2 px-4 py-2.5 text-[15px] text-fg ring-1 ring-inset ring-line-2 placeholder:text-muted focus:outline-none focus:ring-pear/70"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          aria-label="Send"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-pear text-pear-ink transition hover:bg-pear-2 disabled:opacity-45"
        >
          <PaperPlaneRight size={18} weight="fill" aria-hidden />
        </button>
      </form>
      {error && (
        <p role="alert" className="px-4 pb-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
