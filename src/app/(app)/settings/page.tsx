import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, location")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
      <p className="mt-2 text-muted">How other collectors see you.</p>
      <div className="mt-8">
        <SettingsForm displayName={profile?.display_name ?? ""} location={profile?.location ?? ""} />
      </div>
      <p className="mt-6 text-sm text-muted">Signed in as {user.email}. Card language preferences are coming soon.</p>
    </div>
  );
}
