"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function meetsRules(password: string) {
  return (
    password.length >= 10 &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
}

export async function updatePassword(_prevState: unknown, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  if (!meetsRules(password)) {
    return {
      error: "Password must be at least 10 characters, with a number and a symbol.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/matches");
}
