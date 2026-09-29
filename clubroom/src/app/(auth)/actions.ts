"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; sent?: string; fields?: Record<string, string> } | undefined;

const email = z.email({ error: "Enter a valid email address." }).trim().toLowerCase();
const password = z.string().min(8, { error: "Use at least 8 characters." });

function safeNext(v: FormDataEntryValue | null, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z
    .object({ full_name: z.string().trim().min(2, { error: "Tell us your name." }), email, password })
    .safeParse({ full_name: form.get("full_name"), email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const next = safeNext(form.get("next"), "/start");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${publicEnv.appUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.message };
  if (data.session) redirect(next);
  return { sent: parsed.data.email };
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email, password: z.string().min(1, { error: "Enter your password." }) }).safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const next = safeNext(form.get("next"), "/app");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "That email and password don't match." };
  redirect(next);
}

export async function sendMagicLink(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email }).safeParse({ email: form.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const next = safeNext(form.get("next"), "/app");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${publicEnv.appUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: error.message };
  return { sent: parsed.data.email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
