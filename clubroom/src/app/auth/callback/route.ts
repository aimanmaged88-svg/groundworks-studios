import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Completes email links (sign-up confirmation, magic link) and lands the user where they were going. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const nextParam = url.searchParams.get("next") ?? "/app";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/app";

  const supabase = await createClient();
  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "email" | "magiclink" | "signup" | "recovery" | "invite" | "email_change" });
    ok = !error;
  }
  if (!ok) return NextResponse.redirect(new URL("/sign-in?error=link", url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
