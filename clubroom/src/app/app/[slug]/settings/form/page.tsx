import type { Metadata } from "next";
import { getClubContext } from "@/lib/club";
import type { FormConsent, FormField } from "@/lib/public-club";
import { createClient } from "@/lib/supabase/server";
import { FormBuilder } from "./form-builder";

export const metadata: Metadata = { title: "Registration form" };

export default async function FormSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  const supabase = await createClient();
  const { data: form } = await supabase.from("form_templates").select("version, intro, collection_notice, fields, consents, published_at").eq("club_id", ctx.club.id).eq("is_active", true).maybeSingle();
  return (
    <FormBuilder
      slug={slug}
      version={form?.version ?? 0}
      initial={{
        intro: form?.intro ?? "",
        collection_notice: form?.collection_notice ?? "",
        fields: (form?.fields ?? []) as FormField[],
        consents: (form?.consents ?? []) as FormConsent[],
      }}
    />
  );
}
