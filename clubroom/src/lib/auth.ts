import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser(next?: string) {
  const user = await getSessionUser();
  if (!user) redirect(`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

export type MyClub = {
  club_id: string;
  slug: string;
  name: string;
  logo_path: string | null;
  colours: { primary?: string; accent?: string; on_primary?: string };
  is_demo: boolean;
  status: "onboarding" | "active" | "suspended" | "closed";
  roles: Array<"admin" | "coach" | "parent" | "player">;
};

export const getMyClubs = cache(async (): Promise<MyClub[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_clubs");
  if (error) throw error;
  return (data ?? []) as MyClub[];
});

export async function isPlatformOwner() {
  const supabase = await createClient();
  const { data } = await supabase.from("platform_users").select("user_id").maybeSingle();
  return !!data;
}
