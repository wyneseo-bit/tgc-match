import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Reached without a valid recovery link/session — nothing to reset.
  if (!user) {
    redirect("/login");
  }

  return <ResetPasswordForm email={user.email ?? ""} />;
}
