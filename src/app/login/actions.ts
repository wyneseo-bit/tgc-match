"use server";

import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

async function getOrigin() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function signIn(_prevState: unknown, formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;
  const rememberMe = formData.get("rememberMe") === "on";

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("login_attempts")
    .select("failed_count, locked_until")
    .eq("email", email)
    .maybeSingle();

  if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
    const minutesLeft = Math.ceil(
      (new Date(attempt.locked_until).getTime() - Date.now()) / 60000,
    );
    return {
      error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
      email,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const failedCount = (attempt?.failed_count ?? 0) + 1;
    const locked = failedCount >= MAX_ATTEMPTS;

    await admin.from("login_attempts").upsert({
      email,
      failed_count: locked ? 0 : failedCount,
      locked_until: locked
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString()
        : null,
    });

    if (locked) {
      return {
        error: `Too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`,
        email,
      };
    }

    const attemptsLeft = MAX_ATTEMPTS - failedCount;
    return {
      error: `That email and password don't match. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`,
      email,
    };
  }

  await admin.from("login_attempts").delete().eq("email", email);

  // Unchecked "keep me logged in": downgrade the session cookies Supabase
  // just set (which default to a long expiry) to session-only, so they
  // clear when the browser closes instead of persisting for weeks.
  if (!rememberMe) {
    const cookieStore = await cookies();
    for (const c of cookieStore.getAll()) {
      if (c.name.startsWith("sb-")) {
        cookieStore.set(c.name, c.value);
      }
    }
  }

  redirect("/");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/matches` },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signUp(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const displayName = formData.get("displayName") as string;

  // The public.users profile row is created by a database trigger
  // (handle_new_user, see supabase/schema.sql) reading this metadata —
  // not by a client-side insert, since signUp() grants no session (and
  // therefore no RLS-authenticated insert) until the email is confirmed.
  const { data, error } = await supabase.auth.signUp({
    email,
    password: formData.get("password") as string,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    return { error: error.message, needsConfirmation: false, email, displayName };
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
    return { error: error.message, sent: false, email };
  }

  return { error: null, sent: true, email };
}
