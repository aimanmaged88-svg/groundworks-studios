"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/card";
import { CheckCard, Field, Input, Select, Textarea } from "@/components/ui/field";
import { ageGroupFor } from "@/lib/age-rule";
import type { FormField, PublicClub } from "@/lib/public-club";
import { money } from "@/lib/utils";

const SECTIONS: Array<{ key: FormField["section"]; title: string; lead: (v: Record<string, string>) => string }> = [
  { key: "player", title: "The player", lead: () => "One form per child. If you have more than one playing, fill it in again." },
  { key: "guardian", title: "Parent or guardian", lead: () => "Who we contact, and who gets the app login." },
  { key: "medical", title: "Medical and emergency", lead: () => "Only club admins and the player's coach can see this." },
  { key: "extra", title: "Anything else", lead: () => "Optional, but it helps." },
];

export function RegistrationForm({ club, form, season }: { club: PublicClub["club"]; form: NonNullable<PublicClub["form"]>; season: NonNullable<PublicClub["season"]> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fields = useMemo(() => form.fields.filter((f) => f.enabled !== false), [form.fields]);
  const dobField = fields.find((f) => f.maps_to === "player.dob");
  const dob = dobField ? values[dobField.key] : undefined;
  const group = dob && dob.length === 10 ? ageGroupFor(dob, season, season.divisions) : null;

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: club.slug, form_id: form.id, values, consents, website: (document.getElementById("website") as HTMLInputElement | null)?.value ?? "" }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; id?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      router.push(`/c/${club.slug}/thanks`);
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-8">
      {error && (
        <Banner tone="danger">
          <span>{error}</span>
        </Banner>
      )}
      {form.intro && <p className="text-[14.5px] leading-relaxed text-ink-muted">{form.intro}</p>}

      {/* Honeypot: real people never see or fill this. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label>
          Website <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {SECTIONS.map((section, i) => {
        const sectionFields = fields.filter((f) => f.section === section.key);
        if (!sectionFields.length) return null;
        return (
          <section key={section.key} className="rise rule-top pt-3">
            <div className="flex items-baseline gap-3">
              <span className="numeral text-[20px] text-club">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="display text-[24px] text-ink">{section.title}</h2>
            </div>
            <p className="mt-1.5 text-[13px] text-ink-muted">{section.lead(values)}</p>
            <div className="mt-5 flex flex-col gap-5">
              {sectionFields.map((f) => (
                <FieldControl key={f.key} field={f} value={values[f.key] ?? ""} onChange={(v) => set(f.key, v)} extra={f.maps_to === "player.dob" && dob && dob.length === 10 ? (group ? `That puts them in ${group} for ${season.name}.` : "That date doesn't fit any of this season's age groups. Submit anyway and the club will sort it out.") : undefined} />
              ))}
            </div>
          </section>
        );
      })}

      {form.consents.length > 0 && (
        <section className="rise rule-top pt-3">
          <div className="flex items-baseline gap-3">
            <span className="numeral text-[20px] text-club">{String(SECTIONS.filter((s) => fields.some((f) => f.section === s.key)).length + 1).padStart(2, "0")}</span>
            <h2 className="display text-[24px] text-ink">Consent</h2>
          </div>
          <p className="mt-1 text-[13px] text-ink-muted">Required ones are marked. We keep a record of exactly what you agreed to and when.</p>
          <div className="mt-4 flex flex-col gap-2.5">
            {form.consents.map((c) => (
              <CheckCard key={c.key} name={`consent_${c.key}`} title={c.label} text={c.text} required={c.required} checked={!!consents[c.key]} onChange={(v) => setConsents((s) => ({ ...s, [c.key]: v }))} />
            ))}
          </div>
        </section>
      )}

      <section className="flex items-center gap-5 rule-top pt-4">
        <span className="numeral text-[34px] text-club">{season.fee_cents ? money(season.fee_cents, { compact: true }) : "—"}</span>
        <span>
          <span className="block text-[13.5px] font-bold text-ink">{season.fee_cents ? `Season fee ${season.fee_label ?? ""}`.trim() : "Fee to be confirmed"}</span>
          <span className="block text-[12.5px] text-ink-muted">{season.fee_cents ? "Nothing to pay right now. The club will tell you how and when." : "The club will confirm fees before the season starts. Nothing to pay now."}</span>
        </span>
      </section>

      {form.collection_notice && (
        <p className="flex gap-2 text-[11.5px] leading-relaxed text-ink-dim">
          <Lock className="mt-0.5 size-3.5 shrink-0" /> {form.collection_notice}
        </p>
      )}

      <Button type="submit" size="lg" loading={busy} icon={<ArrowRight className="size-4" />} className="w-full">
        Submit registration
      </Button>
      <p className="-mt-4 text-center text-[11.5px] leading-relaxed text-ink-dim">
        Held securely in Australia. Only {club.short_name || club.name} admins and your child&rsquo;s coach can see medical details.
      </p>
    </form>
  );
}

function FieldControl({ field, value, onChange, extra }: { field: FormField; value: string; onChange: (v: string) => void; extra?: string }) {
  const id = `f_${field.key}`;
  const common = { id, name: field.key, required: field.required, value, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(e.target.value) };
  const hint = extra ?? field.help;
  if (field.type === "checkbox") {
    return <CheckCard name={field.key} title={field.label} text={field.help} required={field.required} checked={value === "yes"} onChange={(v) => onChange(v ? "yes" : "")} />;
  }
  return (
    <Field label={field.label} required={field.required} htmlFor={id} hint={hint}>
      {field.type === "select" ? (
        <Select {...common}>
          <option value="">Select</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      ) : field.type === "textarea" ? (
        <Textarea {...common} rows={3} />
      ) : (
        <Input
          {...common}
          type={field.type}
          inputMode={field.type === "tel" ? "tel" : field.type === "email" ? "email" : undefined}
          autoComplete={field.maps_to === "guardian.email" ? "email" : field.maps_to === "guardian.mobile" ? "tel" : field.type === "date" ? "off" : undefined}
          placeholder={field.type === "tel" ? "04__ ___ ___" : undefined}
        />
      )}
    </Field>
  );
}
