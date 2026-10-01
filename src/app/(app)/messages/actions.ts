"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";

const BODY_MAX = 2000;
const PREVIEW_MAX = 120;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

const pairFilter = (col1: string, col2: string, a: string, b: string) =>
  `and(${col1}.eq.${a},${col2}.eq.${b}),and(${col1}.eq.${b},${col2}.eq.${a})`;

/** Collectors can message each other once they share a match or a trade. */
async function canMessage(me: string, them: string) {
  const admin = createAdminClient();
  const [{ count: matches }, { count: trades }] = await Promise.all([
    admin.from("matches").select("id", { count: "exact", head: true }).or(pairFilter("user_a_id", "user_b_id", me, them)),
    admin.from("trades").select("id", { count: "exact", head: true }).or(pairFilter("proposer_id", "recipient_id", me, them)),
  ]);
  return (matches ?? 0) + (trades ?? 0) > 0;
}

/** Opens (creating if needed) the conversation with `otherId`, then goes there. */
export async function startConversation(otherId: string) {
  const { user } = await requireUser();
  if (otherId === user.id) return { error: "You can't message yourself." };
  if (!(await canMessage(user.id, otherId))) {
    return { error: "You can message a collector once you have a match or a trade with them." };
  }

  const [a, b] = [user.id, otherId].sort();
  const admin = createAdminClient();
  await admin
    .from("conversations")
    .upsert({ user_a_id: a, user_b_id: b }, { onConflict: "user_a_id,user_b_id", ignoreDuplicates: true });
  const { data: convo } = await admin
    .from("conversations")
    .select("id")
    .eq("user_a_id", a)
    .eq("user_b_id", b)
    .single();
  if (!convo) return { error: "Couldn't open the conversation." };

  redirect(`/messages/${convo.id}`);
}

export async function sendMessage(conversationId: string, rawBody: string) {
  const { supabase, user } = await requireUser();
  const body = rawBody.trim();
  if (!body) return { error: "Write a message first." };
  if (body.length > BODY_MAX) return { error: `Messages can be up to ${BODY_MAX} characters.` };

  // RLS: only returns the conversation if the caller is in it.
  const { data: convo } = await supabase
    .from("conversations")
    .select("id, user_a_id, user_b_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!convo) return { error: "Conversation not found." };

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("messages")
    .insert({ conversation_id: convo.id, sender_id: user.id, body, created_at: now });
  if (error) return { error: error.message };

  const iAmA = convo.user_a_id === user.id;
  await admin
    .from("conversations")
    .update({
      last_message_at: now,
      last_message_preview: body.slice(0, PREVIEW_MAX),
      last_sender_id: user.id,
      [iAmA ? "user_a_read_at" : "user_b_read_at"]: now,
    })
    .eq("id", convo.id);

  const { data: me } = await admin.from("users").select("display_name").eq("id", user.id).single();
  await notify(iAmA ? convo.user_b_id : convo.user_a_id, {
    kind: "message_new",
    title: `New message from ${me?.display_name ?? "a collector"}`,
    body: body.slice(0, PREVIEW_MAX),
    href: `/messages/${convo.id}`,
    groupKey: `conversation:${convo.id}`,
  });

  revalidatePath("/messages");
  return { error: null };
}

export async function markConversationRead(conversationId: string) {
  const { supabase, user } = await requireUser();
  const { data: convo } = await supabase
    .from("conversations")
    .select("id, user_a_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!convo) return;

  const now = new Date().toISOString();
  const admin = createAdminClient();
  await admin
    .from("conversations")
    .update({ [convo.user_a_id === user.id ? "user_a_read_at" : "user_b_read_at"]: now })
    .eq("id", convo.id);
  // Reading the thread also clears its message notification.
  await admin
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", user.id)
    .eq("group_key", `conversation:${convo.id}`)
    .is("read_at", null);

  revalidatePath("/", "layout");
}
