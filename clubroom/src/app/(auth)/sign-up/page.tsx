import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Start your club" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(next && next.startsWith("/") ? next : "/start");
  return (
    <div className="rise">
      <p className="eyebrow">Free for 30 days, no card needed</p>
      <h1 className="display mt-3 text-[38px] text-ink">Start your club</h1>
      <p className="mt-3 text-[14.5px] text-ink-muted">Make a login, set up the club, share the registration link. Every sign-up lands in the one list.</p>
      <div className="mt-8">
        <SignUpForm next={next} />
      </div>
      <p className="mt-6 text-center text-[13.5px] text-ink-muted">
        Already have a login?{" "}
        <Link href={`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
