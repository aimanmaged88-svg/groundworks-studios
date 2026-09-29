"use client";

import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveFeeAction, saveSeasonAction, saveVenuesAction } from "@/app/start/actions";
import { Button } from "@/components/ui/button";
import { Banner, SectionHead } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { describeDivision, divisionsFromDefaults, type AgeRuleMode, type Division } from "@/lib/age-rule";
import { cn } from "@/lib/utils";

type Season = { id: string; name: string; starts_on: string | null; ends_on: string | null; age_rule_mode: AgeRuleMode; age_cutoff_date: string | null; fee_cents: number | null; fee_label: string | null; registration_open: boolean } | null;

export function SeasonSettings({
  slug,
  clubId,
  sportName,
  defaults,
  season,
  divisions,
  venues,
}: {
  slug: string;
  clubId: string;
  sportName: string;
  defaults: Array<{ name: string; min_age?: number | null; max_age?: number | null }>;
  season: Season;
  divisions: Division[];
  venues: Array<{ id: string; name: string; address: string | null }>;
}) {
  const router = useRouter();
  const year = new Date().getFullYear();
  const [name, setName] = useState(season?.name ?? "");
  const [startsOn, setStartsOn] = useState(season?.starts_on ?? "");
  const [endsOn, setEndsOn] = useState(season?.ends_on ?? "");
  const [mode, setMode] = useState<AgeRuleMode>(season?.age_rule_mode ?? "age_at_date");
  const [cutoff, setCutoff] = useState(season?.age_cutoff_date ?? `${year}-12-31`);
  const [open, setOpen] = useState(season?.registration_open ?? true);
  const [rows, setRows] = useState<Division[]>(divisions.length ? divisions : divisionsFromDefaults(defaults, "age_at_date", year));
  const [feeMode, setFeeMode] = useState<"set" | "later">(season?.fee_cents ? "set" : "later");
  const [amount, setAmount] = useState(season?.fee_cents ? String(season.fee_cents / 100) : "");
  const [label, setLabel] = useState(season?.fee_label ?? "per player, per season");
  const [venueRows, setVenueRows] = useState(venues.map((v) => ({ id: v.id, name: v.name, address: v.address ?? "" })));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const refYear = Number((cutoff || `${year}-12-31`).slice(0, 4)) || year;
  const num = (v: string) => (v === "" ? null : Number(v));
  const update = (i: number, patch: Partial<Division>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = () =>
    start(async () => {
      setMsg(null);
      const r1 = await saveSeasonAction(clubId, { name, starts_on: startsOn || null, ends_on: endsOn || null, age_rule_mode: mode, age_cutoff_date: mode === "age_at_date" ? cutoff : null, registration_open: open, divisions: rows });
      if (!r1.ok) return setMsg({ tone: "danger", text: r1.error });
      const r2 = await saveFeeAction(clubId, { mode: feeMode, amount, label });
      if (!r2.ok) return setMsg({ tone: "danger", text: r2.error });
      const r3 = await saveVenuesAction(clubId, venueRows);
      if (!r3.ok) return setMsg({ tone: "danger", text: r3.error });
      setMsg({ tone: "ok", text: "Saved. Age groups are recalculated from dates of birth straight away." });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-8">
      {msg && (
        <Banner tone={msg.tone}>
          <span>{msg.text}</span>
        </Banner>
      )}
      <section>
        <SectionHead title="Season" number="01" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Season name" required className="sm:col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Starts">
            <Input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
          </Field>
          <Field label="Ends">
            <Input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
          </Field>
        </div>
        <label className="mt-4 flex cursor-pointer items-center justify-between rounded-[var(--r-md)] bg-elev px-4 py-3.5">
          <span>
            <span className="block text-[14px] font-bold text-ink">Registrations open</span>
            <span className="block text-[12.5px] text-ink-muted">Turn off to close the form without taking the page down.</span>
          </span>
          <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} className="size-5 accent-[var(--club-primary)]" />
        </label>
      </section>

      <section>
        <SectionHead title="Age groups" number="02" sub="From date of birth. Changing the rule moves players between groups; nothing else changes." />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(["age_at_date", "birth_year"] as const).map((m) => (
            <button key={m} type="button" onClick={() => { setMode(m); setRows(divisionsFromDefaults(defaults, m, refYear)); }} className={cn("rounded-[var(--r-md)] border-2 p-4 text-left", mode === m ? "border-club bg-elev" : "border-transparent bg-elev hover:border-line-strong")}>
              <span className="block text-[14px] font-bold text-ink">{m === "age_at_date" ? "Age on a set date" : "Year they were born"}</span>
              <span className="mt-0.5 block text-[12.5px] text-ink-muted">{m === "age_at_date" ? "How old they are on a date you choose." : "Everyone born in the same year plays together."}</span>
            </button>
          ))}
        </div>
        {mode === "age_at_date" && (
          <Field label="Ages counted on" required className="mt-4">
            <Input type="date" value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
          </Field>
        )}
        <div className="mt-4 flex items-center justify-between">
          <p className="eyebrow">Groups</p>
          <button type="button" onClick={() => setRows(divisionsFromDefaults(defaults, mode, refYear))} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink-muted hover:text-ink">
            <RotateCcw className="size-3.5" /> {sportName} defaults
          </button>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {rows.map((d, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-[var(--r-md)] bg-elev p-3">
              <div className="flex items-center gap-2">
                <Input value={d.name} onChange={(e) => update(i, { name: e.target.value })} className="min-w-0 flex-1 py-2.5 font-bold" aria-label="Age group name" />
                <div className="w-28 shrink-0">
                  <Select value={d.gender ?? ""} onChange={(e) => update(i, { gender: e.target.value || null })} className="py-2.5" aria-label="Gender">
                    <option value="">Mixed</option>
                    <option value="Boy">Boys</option>
                    <option value="Girl">Girls</option>
                  </Select>
                </div>
                <button type="button" aria-label="Remove age group" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="grid size-9 shrink-0 place-items-center rounded-full text-ink-dim hover:bg-elev2 hover:text-danger">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="eyebrow w-14 shrink-0">{mode === "birth_year" ? "Born" : "Ages"}</span>
                {mode === "birth_year" ? (
                  <>
                    <Input type="number" value={d.born_from ?? ""} onChange={(e) => update(i, { born_from: num(e.target.value) })} placeholder="from" className="w-24 py-2.5" aria-label="Born from" />
                    <span className="text-ink-dim">to</span>
                    <Input type="number" value={d.born_to ?? ""} onChange={(e) => update(i, { born_to: num(e.target.value) })} placeholder="to" className="w-24 py-2.5" aria-label="Born to" />
                  </>
                ) : (
                  <>
                    <Input type="number" value={d.min_age ?? ""} onChange={(e) => update(i, { min_age: num(e.target.value) })} placeholder="min" className="w-20 py-2.5" aria-label="Minimum age" />
                    <span className="text-ink-dim">to</span>
                    <Input type="number" value={d.max_age ?? ""} onChange={(e) => update(i, { max_age: num(e.target.value) })} placeholder="max" className="w-20 py-2.5" aria-label="Maximum age" />
                  </>
                )}
                <span className="ml-auto hidden truncate text-[11.5px] text-ink-dim sm:inline">{describeDivision(d, mode)}</span>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-3" icon={<Plus className="size-4" />} onClick={() => setRows([...rows, { name: "", sort: rows.length + 1 }])}>
          Add an age group
        </Button>
      </section>

      <section>
        <SectionHead title="Fee" number="03" sub="Tracked as paid or owing. Online payment comes later." />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => setFeeMode("set")} className={cn("rounded-[var(--r-md)] border-2 p-4 text-left", feeMode === "set" ? "border-club bg-elev" : "border-transparent bg-elev hover:border-line-strong")}>
            <span className="block text-[14px] font-bold text-ink">Set the fee</span>
            <span className="mt-0.5 block text-[12.5px] text-ink-muted">Shown on the form; new registrations get a fee record.</span>
          </button>
          <button type="button" onClick={() => setFeeMode("later")} className={cn("rounded-[var(--r-md)] border-2 p-4 text-left", feeMode === "later" ? "border-club bg-elev" : "border-transparent bg-elev hover:border-line-strong")}>
            <span className="block text-[14px] font-bold text-ink">Confirm it later</span>
            <span className="mt-0.5 block text-[12.5px] text-ink-muted">The form says the club will confirm fees.</span>
          </button>
        </div>
        {feeMode === "set" && (
          <div className="mt-4 grid grid-cols-[140px_1fr] gap-3">
            <Field label="Amount" required>
              <div className="flex items-center overflow-hidden rounded-[var(--r-md)] border border-line-strong bg-input focus-within:border-club">
                <span className="pl-4 text-ink-dim">$</span>
                <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent py-3 pl-1 pr-3 text-[16px] text-ink outline-none" placeholder="180" aria-label="Fee amount" />
              </div>
            </Field>
            <Field label="Shown as">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} />
            </Field>
          </div>
        )}
      </section>

      <section>
        <SectionHead title="Venues" number="04" />
        <div className="mt-4 flex flex-col gap-2">
          {venueRows.map((row, i) => (
            <div key={row.id ?? `new-${i}`} className="flex items-start gap-2 rounded-[var(--r-md)] bg-elev p-3">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <Input placeholder="Venue name" value={row.name} onChange={(e) => setVenueRows(venueRows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))} aria-label="Venue name" />
                <Input placeholder="Address" value={row.address} onChange={(e) => setVenueRows(venueRows.map((r, j) => (j === i ? { ...r, address: e.target.value } : r)))} aria-label="Venue address" />
              </div>
              <button type="button" aria-label="Remove venue" onClick={() => setVenueRows(venueRows.filter((_, j) => j !== i))} className="mt-1 grid size-9 place-items-center rounded-full text-ink-dim hover:bg-elev2 hover:text-danger">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-3" icon={<Plus className="size-4" />} onClick={() => setVenueRows([...venueRows, { id: undefined as unknown as string, name: "", address: "" }])}>
          Add a venue
        </Button>
      </section>

      <div>
        <Button onClick={save} loading={pending} size="lg">
          Save changes
        </Button>
      </div>
    </div>
  );
}
