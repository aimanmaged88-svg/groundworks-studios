import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { createClient } from "@/lib/supabase/server";
import { PreviewBuilder } from "./preview-builder";

export const metadata: Metadata = {
  title: "See it in your colours",
  description: "Type your club's name and Instagram handle and see the registration page, members list and parent app in your colours.",
};

export default async function PreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  // The preview needs no database; fall back to the built-in sport list if one isn't configured.
  let sports: Array<{ key: string; name: string }> | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      sports = (await supabase.from("sports").select("key, name").order("sort")).data;
    } catch {
      sports = null;
    }
  }
  sports ??= [
    { key: "basketball", name: "Basketball" },
    { key: "netball", name: "Netball" },
    { key: "football", name: "Football (soccer)" },
    { key: "rugby_league", name: "Rugby league" },
    { key: "afl", name: "Australian rules" },
    { key: "other", name: "Other sport" },
  ];
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 md:px-8">
        <section className="py-12 md:py-16">
          <div className="rule-top pt-4">
            <h1 className="display text-[44px] text-ink sm:text-[64px]">Your club. Your colours. One minute.</h1>
          </div>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-muted">Nothing is saved unless you ask us to get in touch. The screens below are samples with made-up numbers, drawn in your colours.</p>
        </section>
        <PreviewBuilder sports={(sports ?? []).map((s) => ({ key: s.key, name: s.name }))} initial={{ name: q.name ?? "", handle: q.handle ?? "", suburb: q.suburb ?? "", sport: q.sport ?? "basketball", primary: q.primary ?? "", accent: q.accent ?? "", logo: q.logo ?? "" }} />
      </main>
      <SiteFooter />
    </div>
  );
}
