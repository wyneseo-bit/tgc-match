"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function getOrigin() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function signIn(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signUp(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  // The public.users profile row is created by a database trigger
  // (handle_new_user, see supabase/schema.sql) reading this metadata —
  // not by a client-side insert, since signUp() grants no session (and
  // therefore no RLS-authenticated insert) until the email is confirmed.
  const { data, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: { display_name: formData.get("displayName") as string },
    },
  });

  if (error) {
    return { error: error.message, needsConfirmation: false };
  }

  // Email confirmation is required on this project, so signUp() never
  // grants a session immediately — tell the user to check their inbox
  // instead of silently redirecting them to a page that still shows
  // "log in / sign up" with no explanation of what just happened.
  if (!data.session) {
    return { error: null, needsConfirmation: true };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Supabase intentionally doesn't reveal whether the email exists — always
  // show the same "check your email" result to avoid leaking that info.
  if (error) {
    return { error: error.message, sent: false };
  }

  return { error: null, sent: true };
}
