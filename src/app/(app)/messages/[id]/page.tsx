import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowsLeftRight } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { OPEN_STATUSES } from "@/lib/trades";
import { Avatar } from "@/components/Collector";
import { buttonClass } from "@/components/ui";
import { Thread, type Message } from "./Thread";

export const metadata = { title: "Messages" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS: only participants can load the conversation and its messages.
  const { data: convo } = await supabase
    .from("conversations")
    .select("id, user_a_id, user_b_id")
    .eq("id", id)
    .maybeSingle();
  if (!convo) notFound();

  const otherId = convo.user_a_id === user.id ? convo.user_b_id : convo.user_a_id;
  const [{ data: other }, { data: messages }, { data: openTrade }] = await Promise.all([
    supabase.from("users").select("id, display_name, verified").eq("id", otherId).single(),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: true })
      .limit(200)
      .returns<Message[]>(),
    supabase
      .from("trades")
      .select("id, code")
      .in("status", OPEN_STATUSES)
      .or(`proposer_id.eq.${otherId},recipient_id.eq.${otherId}`)
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="max-w-3xl">
      <Link href="/messages" className="-ml-1 inline-flex h-11 items-center gap-2 px-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden /> Messages
      </Link>
      <header className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <Link href={`/collectors/${otherId}`} className="flex min-w-0 items-center gap-3">
          <Avatar seed={otherId} verified={other?.verified} size={44} />
          <h1 className="truncate font-display text-2xl font-bold tracking-tight hover:underline">
            {other?.display_name ?? "Collector"}
          </h1>
        </Link>
        {openTrade && (
          <Link href={`/trades/${openTrade.id}`} className={buttonClass("secondary", "sm")}>
            <ArrowsLeftRight size={16} weight="bold" aria-hidden /> Trade #{openTrade.code}
          </Link>
        )}
      </header>
      <p className="mt-2 text-sm text-muted">Keep trade details here. Never share passwords or payment details.</p>
      <div className="mt-5">
        <Thread conversationId={convo.id} me={user.id} initial={messages ?? []} />
      </div>
    </div>
  );
}
