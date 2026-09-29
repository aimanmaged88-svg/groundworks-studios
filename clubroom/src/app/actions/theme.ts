"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import { createClient } from "@/lib/supabase/server";

/** Remembers the theme in a cookie (first paint) and, when signed in, on the profile. */
export async function setTheme(theme: string) {
  if (!isTheme(theme)) return;
  const store = await cookies();
  store.set(THEME_COOKIE, theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("user_profiles").upsert({ user_id: user.id, theme }, { onConflict: "user_id" });
  }
}
