"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = {
  error: string | null;
  saved: boolean;
  displayName?: string;
  location?: string;
} | null;

const NAME_MIN = 2;
const NAME_MAX = 40;
const LOCATION_MAX = 80;

export async function updateProfile(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (displayName.length < NAME_MIN || displayName.length > NAME_MAX) {
    return { error: `Display name must be ${NAME_MIN}–${NAME_MAX} characters.`, saved: false, displayName, location };
  }
  if (location.length > LOCATION_MAX) {
    return { error: `Location must be ${LOCATION_MAX} characters or fewer.`, saved: false, displayName, location };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in", saved: false };

  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName, location: location || null })
    .eq("id", user.id);

  if (error) return { error: error.message, saved: false, displayName, location };

  // Name and location show in the sidebar, on profiles and on match tiles.
  revalidatePath("/", "layout");
  return { error: null, saved: true, displayName, location };
}
