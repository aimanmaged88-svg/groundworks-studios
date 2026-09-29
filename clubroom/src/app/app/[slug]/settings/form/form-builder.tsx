"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Banner, Chip, SectionHead } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { FormConsent, FormField } from "@/lib/public-club";
import { cn } from "@/lib/utils";
import { saveFormTemplateAction } from "../actions";

type State = { intro: string; collection_notice: string; fields: FormField[]; consents: FormConsent[] };
const SECTIONS: Array<{ key: FormField["section"]; title: string }> = [
  { key: "player", title: "The player" },
  { key: "guardian", title: "Parent or guardian" },
  { key: "medical", title: "Medical and emergency" },
  { key: "extra", title: "Anything else" },
];
const LOCKED = new Set(["player.first_name", "player.dob", "guardian.email"]);

export function FormBuilder({ slug, version, initial }: { slug: string; version: number; initial: State }) {
  const router = useRouter();
  const [s, setS] = useState<State>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);

  const setField = (key: string, patch: Partial<FormField>) => setS({ ...s, fields: s.fields.map((f) => (f.key === key ? { ...f, ...patch } : f)) });
  const move = (key: string, dir: -1 | 1) => {
    const i = s.fields.findIndex((f) => f.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= s.fields.length || s.fields[j].section !== s.fields[i].section) return;
    const next = [...s.fields];
    [next[i], next[j]] = [next[j], next[i]];
    setS({ ...s, fields: next });
  };
  const addCustom = (section: FormField["section"]) => {
    const key = `custom_${Date.now().toString(36)}`;
    const idx = s.fields.map((f) => f.section).lastIndexOf(section);
    const field: FormField = { key, label: "New question", type: "text", required: false, section, maps_to: "custom", enabled: true };
    const next = [...s.fields];
    next.splice(idx < 0 ? next.length : idx + 1, 0, field);
    setS({ ...s, fields: next });
  };
  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await saveFormTemplateAction(slug, s);
      if (!r.ok) return setMsg({ tone: "danger", text: r.error });
      setMsg({ tone: "ok", text: `Saved as version ${r.version}. Parents see it straight away; older consents keep their original wording.` });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Chip tone="muted">Version {version}</Chip>
        <Link href={`/c/${slug}/register`} target="_blank" className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.06em] text-club">
          <ExternalLink className="size-3.5" /> Open the live form
        </Link>
      </div>
      {msg && (
        <Banner tone={msg.tone}>
          <span>{msg.text}</span>
        </Banner>
      )}

      <section>
        <SectionHead title="Intro and notice" number="01" />
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Intro" hint="Shown at the top of the form.">
            <Textarea value={s.intro} onChange={(e) => setS({ ...s, intro: e.target.value })} rows={2} placeholder="Takes about three minutes. One form per child." />
          </Field>
          <Field label="Collection notice" hint="Why you collect this and who sees it. Wording to be confirmed by your legal review.">
            <Textarea value={s.collection_notice} onChange={(e) => setS({ ...s, collection_notice: e.target.value })} rows={3} placeholder="We collect these details to run the season safely. They are stored in Australia and seen only by club admins and your child's coach." />
          </Field>
        </div>
      </section>

      {SECTIONS.map((sec, n) => (
        <section key={sec.key}>
          <SectionHead title={sec.title} number={String(n + 2).padStart(2, "0")} action={<Button size="sm" variant="outline" icon={<Plus className="size-4" />} onClick={() => addCustom(sec.key)}>Add a question</Button>} />
          <div className="mt-3 flex flex-col gap-2">
            {s.fields
              .filter((f) => f.section === sec.key)
              .map((f) => {
                const locked = f.maps_to ? LOCKED.has(f.maps_to) : false;
                const custom = !f.maps_to || f.maps_to === "custom";
                const off = f.enabled === false;
                return (
                  <div key={f.key} className={cn("flex flex-col gap-3 rounded-[var(--r-md)] bg-elev p-3", off && "opacity-60")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input value={f.label} onChange={(e) => setField(f.key, { label: e.target.value })} className="min-w-0 flex-1 py-2.5 font-bold" aria-label="Question label" />
                      {custom ? (
                        <div className="w-32 shrink-0">
                          <Select value={f.type} onChange={(e) => setField(f.key, { type: e.target.value as FormField["type"] })} className="py-2.5" aria-label="Question type">
                            <option value="text">Short text</option>
                            <option value="textarea">Long text</option>
                            <option value="select">Choice</option>
                            <option value="checkbox">Tick box</option>
                            <option value="date">Date</option>
                            <option value="tel">Phone</option>
                            <option value="email">Email</option>
                          </Select>
                        </div>
                      ) : (
                        <Chip tone="muted">{f.type}</Chip>
                      )}
                      <label className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink-muted">
                        <input type="checkbox" checked={!!f.required} disabled={locked} onChange={(e) => setField(f.key, { required: e.target.checked })} className="size-4 accent-[var(--club-primary)]" /> Required
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink-muted">
                        <input type="checkbox" checked={!off} disabled={locked} onChange={(e) => setField(f.key, { enabled: e.target.checked })} className="size-4 accent-[var(--club-primary)]" /> On
                      </label>
                      <span className="ml-auto flex items-center gap-1">
                        <button type="button" aria-label="Move up" onClick={() => move(f.key, -1)} className="grid size-8 place-items-center rounded-full text-ink-dim hover:bg-elev2 hover:text-ink">
                          <ArrowUp className="size-4" />
                        </button>
                        <button type="button" aria-label="Move down" onClick={() => move(f.key, 1)} className="grid size-8 place-items-center rounded-full text-ink-dim hover:bg-elev2 hover:text-ink">
                          <ArrowDown className="size-4" />
                        </button>
                        {custom && (
                          <button type="button" aria-label="Remove question" onClick={() => setS({ ...s, fields: s.fields.filter((x) => x.key !== f.key) })} className="grid size-8 place-items-center rounded-full text-ink-dim hover:bg-elev2 hover:text-danger">
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </span>
                    </div>
                    {f.type === "select" && (
                      <Input value={(f.options ?? []).join(", ")} onChange={(e) => setField(f.key, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })} placeholder="Options, separated by commas" className="py-2.5 text-[13px]" aria-label="Options" />
                    )}
                    <Input value={f.help ?? ""} onChange={(e) => setField(f.key, { help: e.target.value })} placeholder="Help text under the question (optional)" className="py-2.5 text-[13px]" aria-label="Help text" />
                    {locked && <p className="text-[11.5px] text-ink-dim">Always on and required: the database needs it.</p>}
                  </div>
                );
              })}
          </div>
        </section>
      ))}

      <section>
        <SectionHead title="Consents" number="06" sub="Each one is stored with the exact wording and time it was agreed to." action={<Button size="sm" variant="outline" icon={<Plus className="size-4" />} onClick={() => setS({ ...s, consents: [...s.consents, { key: `consent_${Date.now().toString(36)}`, label: "New consent", text: "", required: false }] })}>Add a consent</Button>} />
        <div className="mt-3 flex flex-col gap-2">
          {s.consents.map((c, i) => (
            <div key={c.key} className="flex flex-col gap-2 rounded-[var(--r-md)] bg-elev p-3">
              <div className="flex items-center gap-2">
                <Input value={c.label} onChange={(e) => setS({ ...s, consents: s.consents.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className="min-w-0 flex-1 py-2.5 font-bold" aria-label="Consent label" />
                <label className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink-muted">
                  <input type="checkbox" checked={!!c.required} onChange={(e) => setS({ ...s, consents: s.consents.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)) })} className="size-4 accent-[var(--club-primary)]" /> Required
                </label>
                <button type="button" aria-label="Remove consent" onClick={() => setS({ ...s, consents: s.consents.filter((_, j) => j !== i) })} className="grid size-8 place-items-center rounded-full text-ink-dim hover:bg-elev2 hover:text-danger">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <Textarea value={c.text} onChange={(e) => setS({ ...s, consents: s.consents.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} rows={2} className="text-[13.5px]" aria-label="Consent wording" />
            </div>
          ))}
        </div>
      </section>

      <div>
        <Button onClick={save} loading={pending} size="lg">
          Publish version {version + 1}
        </Button>
      </div>
    </div>
  );
}
