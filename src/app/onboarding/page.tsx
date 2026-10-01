import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "./Onboarding";

export const metadata = { title: "Get started" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("display_name").eq("id", user.id).single();

  return <Onboarding displayName={profile?.display_name ?? "collector"} />;
}
