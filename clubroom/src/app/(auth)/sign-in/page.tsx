import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(next && next.startsWith("/") ? next : "/app");
  return (
    <div className="rise">
      <p className="eyebrow">Welcome back</p>
      <h1 className="display mt-3 text-[38px] text-ink">Sign in</h1>
      <div className="mt-8">
        <SignInForm next={next} />
      </div>
      <p className="mt-6 text-center text-[13.5px] text-ink-muted">
        New club?{" "}
        <Link href="/sign-up" className="font-semibold text-ink underline underline-offset-4">
          Start your club
        </Link>
      </p>
    </div>
  );
}
