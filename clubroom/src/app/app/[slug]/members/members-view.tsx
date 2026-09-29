"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Download, Eye, HeartPulse, Pencil, Plus, Search, Upload, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Banner, Chip, EmptyState, SectionHead, StatTile } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { applyFilters, EMPTY_FILTERS, fullName, genderBucket, sortRows, type MemberFilters, type MemberRow, type SortKey } from "@/lib/members";
import { cn, fmtDate, fmtDob, money, pluralise } from "@/lib/utils";
import { addPlayerAction, archivePersonAction, getSensitiveAction, saveGuardianAction, savePersonAction, saveRegistrationAction, saveSensitiveAction, setFeeAction, type Sensitive } from "./actions";

type Options = { gender: string[]; experience: string[]; heard_via: string[]; uniform_size: string[]; relationship: string[]; ambulance_cover: string[] };

type Props = {
  slug: string;
  clubId: string;
  timezone: string;
  rows: MemberRow[];
  ageGroups: string[];
  teams: string[];
  season: { id: string; name: string; fee_cents: number | null } | null;
  fieldOptions: Options;
  customFields: Array<{ key: string; label: string }>;
};

const FEE_LABEL: Record<string, string> = { owing: "Owing", partial: "Part paid", paid: "Paid", waived: "Waived" };
const STATUS_LABEL: Record<string, string> = { new: "New", reviewed: "Reviewed", placed: "Placed", withdrawn: "Withdrawn" };

export function MembersView({ slug, timezone, rows, ageGroups, teams, season, fieldOptions, customFields }: Props) {
  const [filters, setFilters] = useState<MemberFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "submitted_at", dir: -1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState<"xlsx" | "csv" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const active = useMemo(() => rows.filter((r) => !r.archived_at), [rows]);
  const visible = useMemo(() => sortRows(applyFilters(rows, filters), sort.key, sort.dir), [rows, filters, sort]);
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const set = (patch: Partial<MemberFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const toggle = <K extends keyof MemberFilters>(key: K, value: MemberFilters[K]) => setFilters((f) => ({ ...f, [key]: f[key] === value ? EMPTY_FILTERS[key] : value }));
  const filtering = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  const stats = useMemo(() => {
    const boys = active.filter((r) => genderBucket(r.gender) === "boy").length;
    const girls = active.filter((r) => genderBucket(r.gender) === "girl").length;
    const dupes = active.filter((r) => r.duplicate_of).length;
    const medical = active.filter((r) => r.has_medical_flag).length;
    const noPhoto = active.filter((r) => r.photo_consent !== true).length;
    const owing = active.filter((r) => r.fee && (r.fee.status === "owing" || r.fee.status === "partial")).length;
    return { boys, girls, unique: active.length - dupes, medical, noPhoto, owing };
  }, [active]);

  const genders = useMemo(() => {
    const present = new Set(active.map((r) => genderBucket(r.gender)));
    return (["boy", "girl", "other", "unknown"] as const).filter((g) => present.has(g));
  }, [active]);
  const groupsPresent = useMemo(() => {
    const names = [...ageGroups, "none"];
    return names.filter((g) => active.some((r) => (r.age_group ?? "none") === g));
  }, [active, ageGroups]);
  const counts = (fn: (r: MemberRow) => string | null | undefined) => {
    const m = new Map<string, number>();
    for (const r of active) {
      const v = fn(r);
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  async function doExport(format: "xlsx" | "csv") {
    setExporting(format);
    setExportError(null);
    try {
      const res = await fetch("/api/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, format, ids: visible.map((r) => r.id), filters }) });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const name = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `members.${format}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  const th = (label: string, key: SortKey, extra?: string) => (
    <th className={extra} onClick={() => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }))}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sort.key === key && (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </span>
    </th>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{season?.name ?? "All time"}</p>
          <h1 className="display mt-1 text-[36px] text-ink md:text-[48px]">Members</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="md" icon={<Download className="size-4" />} loading={exporting === "xlsx"} onClick={() => doExport("xlsx")} disabled={!visible.length}>
            Excel
          </Button>
          <Button variant="secondary" size="md" loading={exporting === "csv"} onClick={() => doExport("csv")} disabled={!visible.length}>
            CSV
          </Button>
          <Link href={`/app/${slug}/members/import`} className="inline-flex h-11 items-center gap-2 rounded-[var(--r-md)] bg-elev2 px-5 text-[13px] font-bold uppercase tracking-[0.06em] text-ink hover:bg-line-strong">
            <Upload className="size-4" /> Import
          </Link>
          <Button variant="ink" size="md" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add player
          </Button>
        </div>
      </div>
      {exportError && (
        <Banner tone="danger">
          <span>{exportError}</span>
        </Banner>
      )}

      <div className="scoreboard">
        <StatTile value={active.length} label="Players" tone="club" active={!filtering} onClick={() => setFilters(EMPTY_FILTERS)} />
        <StatTile value={stats.boys} label="Boys" active={filters.gender === "boy"} onClick={() => toggle("gender", "boy")} />
        <StatTile value={stats.girls} label="Girls" active={filters.gender === "girl"} onClick={() => toggle("gender", "girl")} />
        <StatTile value={stats.unique} label="Unique players" />
        <StatTile value={stats.medical} label="Medical notes" tone={stats.medical ? "warn" : "default"} active={filters.medical === "yes"} onClick={() => toggle("medical", "yes")} />
        <StatTile value={stats.noPhoto} label="No photo consent" active={filters.photo === "no"} onClick={() => toggle("photo", "no")} />
        <StatTile value={stats.owing} label="Owing" tone={stats.owing ? "warn" : "default"} active={filters.fee === "owing"} onClick={() => toggle("fee", "owing")} />
        <StatTile value={rows.length - active.length} label="Archived" active={filters.archived} onClick={() => toggle("archived", true)} />
      </div>

      {active.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <SectionHead title="Age group × gender" sub="Tap a cell to filter" />
            <table className="mt-3 w-full text-[13.5px]">
              <thead>
                <tr className="eyebrow">
                  <th className="py-2 text-left font-bold">Group</th>
                  {genders.map((g) => (
                    <th key={g} className="py-2 text-right font-bold capitalize">
                      {g === "unknown" ? "Not stated" : g === "boy" ? "Boys" : g === "girl" ? "Girls" : "Other"}
                    </th>
                  ))}
                  <th className="py-2 text-right font-bold">Total</th>
                  <th className="w-[30%]" />
                </tr>
              </thead>
              <tbody>
                {groupsPresent.map((g) => {
                  const inG = active.filter((r) => (r.age_group ?? "none") === g);
                  return (
                    <tr key={g} className="border-t border-line">
                      <td className="py-2">
                        <button type="button" onClick={() => toggle("age_group", g)} className={cn("font-bold", filters.age_group === g ? "text-club" : "text-ink hover:text-club")}>
                          {g === "none" ? "Not set" : g}
                        </button>
                      </td>
                      {genders.map((b) => (
                        <td key={b} className="py-2 text-right">
                          <button type="button" onClick={() => set({ age_group: g, gender: b })} className="numeral text-[15px] text-ink-muted hover:text-club">
                            {inG.filter((r) => genderBucket(r.gender) === b).length}
                          </button>
                        </td>
                      ))}
                      <td className="numeral py-2 text-right text-[15px] text-ink">{inG.length}</td>
                      <td className="py-2 pl-3">
                        <div className="h-1.5 w-full bg-line">
                          <div className="h-1.5 bg-club" style={{ width: `${Math.round((inG.length / Math.max(1, active.length)) * 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
          <section>
            <SectionHead title="Experience and how they heard" />
            <table className="mt-3 w-full text-[13.5px]">
              <tbody>
                {counts((r) => r.registration?.experience).map(([v, n]) => (
                  <tr key={`e-${v}`} className="border-t border-line">
                    <td className="py-2">
                      <button type="button" onClick={() => toggle("experience", v)} className={cn("font-bold", filters.experience === v ? "text-club" : "text-ink hover:text-club")}>
                        {v}
                      </button>
                    </td>
                    <td className="numeral py-2 text-right text-[15px] text-ink">{n}</td>
                  </tr>
                ))}
                {counts((r) => r.registration?.heard_via).map(([v, n]) => (
                  <tr key={`h-${v}`} className="border-t border-line">
                    <td className="py-2">
                      <button type="button" onClick={() => toggle("heard_via", v)} className={cn("text-ink-muted hover:text-club", filters.heard_via === v && "text-club")}>
                        {v}
                      </button>
                    </td>
                    <td className="numeral py-2 text-right text-[15px] text-ink">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      <section>
        <SectionHead
          title={`${pluralise(visible.length, "player")}${filtering ? " matching" : ""}`}
          sub={filtering ? "Exports follow these filters and are logged." : "Every export is logged with who, when and what."}
          action={
            filtering ? (
              <Button variant="ghost" size="sm" icon={<X className="size-4" />} onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear
              </Button>
            ) : undefined
          }
        />
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
          <div className="relative flex-1 md:min-w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
            <Input value={filters.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search name, parent, school, phone…" className="pl-10" />
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
            <Select value={filters.gender} onChange={(e) => set({ gender: e.target.value })} className="py-2.5" aria-label="Gender">
              <option value="">All genders</option>
              <option value="boy">Boys</option>
              <option value="girl">Girls</option>
              <option value="other">Other</option>
              <option value="unknown">Not stated</option>
            </Select>
            <Select value={filters.age_group} onChange={(e) => set({ age_group: e.target.value })} className="py-2.5" aria-label="Age group">
              <option value="">All age groups</option>
              {ageGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
              <option value="none">Not set</option>
            </Select>
            <Select value={filters.fee} onChange={(e) => set({ fee: e.target.value })} className="py-2.5" aria-label="Fee">
              <option value="">Fee: all</option>
              {Object.entries(FEE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
              <option value="none">No fee record</option>
            </Select>
            <Select value={filters.status} onChange={(e) => set({ status: e.target.value })} className="py-2.5" aria-label="Status">
              <option value="">Status: all</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            {teams.length > 0 && (
              <Select value={filters.team} onChange={(e) => set({ team: e.target.value })} className="py-2.5" aria-label="Team">
                <option value="">All teams</option>
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="none">No team</option>
              </Select>
            )}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState title={rows.length ? "Nothing matches" : "No players yet"} text={rows.length ? "Try clearing a filter." : "Share the registration link, add a player by hand, or import a spreadsheet."} />
        ) : (
          <div className="-mx-4 mt-4 overflow-x-auto md:mx-0">
            <table className="data-table min-w-[980px] text-[13.5px]">
              <thead>
                <tr>
                  {th("Name", "name", "sticky left-0 z-[2] bg-bg")}
                  {th("Group", "age_group")}
                  {th("Born", "dob")}
                  {th("Gender", "gender")}
                  {th("School", "school")}
                  {th("Parent", "guardian")}
                  <th>Mobile</th>
                  <th>Email</th>
                  {th("Fee", "fee")}
                  <th>Photos</th>
                  {th("Registered", "submitted_at")}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)} className="cursor-pointer">
                    <td className="sticky left-0 z-[1] bg-bg font-bold text-ink">
                      <span className="inline-flex items-center gap-2">
                        {fullName(r)}
                        {r.has_medical_flag && <HeartPulse className="size-3.5 text-warn" aria-label="Medical note" />}
                        {(r.duplicate_of || r.registration?.possible_duplicate) && <Chip tone="warn">dup</Chip>}
                        {r.archived_at && <Chip tone="muted">archived</Chip>}
                      </span>
                    </td>
                    <td>{r.age_group ? <Chip tone="muted">{r.age_group}</Chip> : <span className="text-ink-dim">—</span>}</td>
                    <td className="text-ink-muted">{fmtDob(r.dob)}</td>
                    <td className="text-ink-muted">{r.gender ?? "—"}</td>
                    <td className="text-ink-muted">{r.school ?? "—"}</td>
                    <td className="text-ink-muted">{r.guardian ? fullName(r.guardian) : "—"}</td>
                    <td>
                      {r.guardian?.mobile ? (
                        <a href={`tel:${r.guardian.mobile.replace(/\s/g, "")}`} onClick={(e) => e.stopPropagation()} className="text-ink underline decoration-line underline-offset-4">
                          {r.guardian.mobile}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {r.guardian?.email ? (
                        <a href={`mailto:${r.guardian.email}`} onClick={(e) => e.stopPropagation()} className="text-ink underline decoration-line underline-offset-4">
                          {r.guardian.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{r.fee ? <Chip tone={r.fee.status === "paid" || r.fee.status === "waived" ? "ok" : "warn"}>{FEE_LABEL[r.fee.status]}</Chip> : <span className="text-ink-dim">—</span>}</td>
                    <td className="text-ink-muted">{r.photo_consent == null ? "—" : r.photo_consent ? "Yes" : "No"}</td>
                    <td className="text-ink-muted">{fmtDate(r.registration?.submitted_at ?? r.created_at, "time", timezone)}</td>
                    <td className="text-ink-muted">{r.registration ? STATUS_LABEL[r.registration.status] : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && <PersonSheet key={selected.id} slug={slug} row={selected} options={fieldOptions} customFields={customFields} timezone={timezone} onClose={() => setSelectedId(null)} />}
      {adding && <AddPlayerSheet slug={slug} options={fieldOptions} onClose={() => setAdding(false)} />}
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-line py-2.5 text-[13.5px]">
      <dt className="eyebrow pt-0.5">{k}</dt>
      <dd className="min-w-0 break-words text-ink">{v ?? "—"}</dd>
    </div>
  );
}

function PersonSheet({ slug, row, options, customFields, timezone, onClose }: { slug: string; row: MemberRow; options: Options; customFields: Array<{ key: string; label: string }>; timezone: string; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sensitive, setSensitive] = useState<Sensitive | null | "hidden">("hidden");
  const [p, setP] = useState({ first_name: row.first_name, last_name: row.last_name, dob: row.dob ?? "", gender: row.gender ?? "", school: row.school ?? "" });
  const [g, setG] = useState({ first_name: row.guardian?.first_name ?? "", last_name: row.guardian?.last_name ?? "", mobile: row.guardian?.mobile ?? "", email: row.guardian?.email ?? "" });
  const [reg, setReg] = useState({ uniform_size: row.registration?.uniform_size ?? "", experience: row.registration?.experience ?? "", heard_via: row.registration?.heard_via ?? "", notes: row.registration?.notes ?? "", status: row.registration?.status ?? "new" });
  const [s, setS] = useState({ medical: "", ambulance_cover: "", emergency_name: "", emergency_phone: "", emergency_relationship: "" });

  const reveal = () =>
    start(async () => {
      const r = await getSensitiveAction(row.id);
      if (!r.ok) return setError(r.error);
      setSensitive(r.sensitive);
      if (r.sensitive) setS({ medical: r.sensitive.medical ?? "", ambulance_cover: r.sensitive.ambulance_cover ?? "", emergency_name: r.sensitive.emergency_name ?? "", emergency_phone: r.sensitive.emergency_phone ?? "", emergency_relationship: r.sensitive.emergency_relationship ?? "" });
    });

  const save = () =>
    start(async () => {
      setError(null);
      const r1 = await savePersonAction(slug, row.id, { ...p, dob: p.dob || null, gender: p.gender || null, school: p.school || null });
      if (!r1.ok) return setError(r1.error);
      if (row.guardian) {
        const r2 = await saveGuardianAction(slug, row.guardian.id, { ...g, mobile: g.mobile || null, email: g.email || null });
        if (!r2.ok) return setError(r2.error);
      }
      if (row.registration) {
        const r3 = await saveRegistrationAction(slug, row.registration.id, { ...reg, uniform_size: reg.uniform_size || null, experience: reg.experience || null, heard_via: reg.heard_via || null, notes: reg.notes || null });
        if (!r3.ok) return setError(r3.error);
      }
      if (sensitive !== "hidden") {
        const r4 = await saveSensitiveAction(slug, row.id, s);
        if (!r4.ok) return setError(r4.error);
      }
      setEditing(false);
      router.refresh();
    });

  const archive = (archived: boolean) =>
    start(async () => {
      const r = await archivePersonAction(slug, row.id, archived);
      if (!r.ok) return setError(r.error);
      router.refresh();
      onClose();
    });

  const fee = (status: "owing" | "partial" | "paid" | "waived") =>
    start(async () => {
      const r = await setFeeAction(slug, row.id, status);
      if (!r.ok) return setError(r.error);
      router.refresh();
    });

  return (
    <Sheet
      open
      onClose={onClose}
      title={fullName(row)}
      sub={[row.age_group, row.gender, row.team].filter(Boolean).join(" · ") || undefined}
      wide
      footer={
        editing ? (
          <>
            <Button onClick={save} loading={pending}>
              Save changes
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button variant="ink" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
              Edit
            </Button>
            {row.archived_at ? (
              <Button variant="outline" icon={<ArchiveRestore className="size-4" />} onClick={() => archive(false)} loading={pending}>
                Restore
              </Button>
            ) : (
              <Button variant="danger" icon={<Archive className="size-4" />} onClick={() => archive(true)} loading={pending}>
                Archive
              </Button>
            )}
          </>
        )
      }
    >
      {error && (
        <Banner tone="danger" className="mb-4">
          <span>{error}</span>
        </Banner>
      )}
      {(row.duplicate_of || row.registration?.possible_duplicate) && (
        <Banner tone="warn" className="mb-4">
          Looks like a duplicate: another player has the same name and date of birth. Archive one of them if it&rsquo;s the same child.
        </Banner>
      )}

      <div className="flex flex-col gap-6">
        <section>
          <SectionHead title="Player" number="01" />
          {editing ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="First name" required>
                <Input value={p.first_name} onChange={(e) => setP({ ...p, first_name: e.target.value })} />
              </Field>
              <Field label="Last name">
                <Input value={p.last_name} onChange={(e) => setP({ ...p, last_name: e.target.value })} />
              </Field>
              <Field label="Date of birth">
                <Input type="date" value={p.dob} onChange={(e) => setP({ ...p, dob: e.target.value })} />
              </Field>
              <Field label="Gender">
                <Select value={p.gender} onChange={(e) => setP({ ...p, gender: e.target.value })}>
                  <option value="">Not stated</option>
                  {options.gender.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </Field>
              <Field label="School" className="sm:col-span-2">
                <Input value={p.school} onChange={(e) => setP({ ...p, school: e.target.value })} />
              </Field>
            </div>
          ) : (
            <dl className="mt-2">
              <Row k="Born" v={row.dob ? `${fmtDob(row.dob)}${row.age_group ? ` · ${row.age_group}` : ""}` : null} />
              <Row k="Gender" v={row.gender} />
              <Row k="School" v={row.school} />
              <Row k="Team" v={row.team} />
              <Row k="Photos" v={row.photo_consent == null ? "Not answered" : row.photo_consent ? "Consent given" : "No consent"} />
            </dl>
          )}
        </section>

        <section>
          <SectionHead title="Parent or guardian" number="02" />
          {row.guardian ? (
            editing ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="First name">
                  <Input value={g.first_name} onChange={(e) => setG({ ...g, first_name: e.target.value })} />
                </Field>
                <Field label="Last name">
                  <Input value={g.last_name} onChange={(e) => setG({ ...g, last_name: e.target.value })} />
                </Field>
                <Field label="Mobile">
                  <Input value={g.mobile} onChange={(e) => setG({ ...g, mobile: e.target.value })} />
                </Field>
                <Field label="Email">
                  <Input value={g.email} onChange={(e) => setG({ ...g, email: e.target.value })} />
                </Field>
              </div>
            ) : (
              <dl className="mt-2">
                <Row k="Name" v={`${fullName(row.guardian)}${row.guardian.relationship ? ` (${row.guardian.relationship})` : ""}`} />
                <Row k="Mobile" v={row.guardian.mobile ? <a className="underline underline-offset-4" href={`tel:${row.guardian.mobile.replace(/\s/g, "")}`}>{row.guardian.mobile}</a> : null} />
                <Row k="Email" v={row.guardian.email ? <a className="underline underline-offset-4" href={`mailto:${row.guardian.email}`}>{row.guardian.email}</a> : null} />
              </dl>
            )
          ) : (
            <p className="mt-2 text-[13.5px] text-ink-muted">No guardian on file.</p>
          )}
        </section>

        <section>
          <SectionHead title="Medical and emergency" number="03" sub="Reading these is logged." />
          {sensitive === "hidden" ? (
            <Button variant="outline" size="sm" className="mt-3" icon={<Eye className="size-4" />} onClick={reveal} loading={pending}>
              Show medical and emergency details
            </Button>
          ) : editing ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Conditions, allergies, medication" className="sm:col-span-2">
                <Textarea value={s.medical} onChange={(e) => setS({ ...s, medical: e.target.value })} />
              </Field>
              <Field label="Ambulance cover">
                <Select value={s.ambulance_cover} onChange={(e) => setS({ ...s, ambulance_cover: e.target.value })}>
                  <option value="">Not answered</option>
                  {options.ambulance_cover.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Emergency contact">
                <Input value={s.emergency_name} onChange={(e) => setS({ ...s, emergency_name: e.target.value })} />
              </Field>
              <Field label="Emergency phone">
                <Input value={s.emergency_phone} onChange={(e) => setS({ ...s, emergency_phone: e.target.value })} />
              </Field>
              <Field label="Their relationship">
                <Input value={s.emergency_relationship} onChange={(e) => setS({ ...s, emergency_relationship: e.target.value })} />
              </Field>
            </div>
          ) : (
            <dl className="mt-2">
              <Row k="Medical" v={sensitive?.medical} />
              <Row k="Ambulance" v={sensitive?.ambulance_cover} />
              <Row k="Emergency" v={sensitive?.emergency_name ? `${sensitive.emergency_name}${sensitive.emergency_relationship ? ` (${sensitive.emergency_relationship})` : ""}${sensitive.emergency_phone ? ` · ${sensitive.emergency_phone}` : ""}` : null} />
            </dl>
          )}
        </section>

        <section>
          <SectionHead title="Registration" number="04" sub={row.registration ? `${fmtDate(row.registration.submitted_at, "time", timezone)} · ${row.registration.source.replace("_", " ")}` : "No registration on file"} />
          {row.registration &&
            (editing ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Status">
                  <Select value={reg.status} onChange={(e) => setReg({ ...reg, status: e.target.value as typeof reg.status })}>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Uniform size">
                  <Select value={reg.uniform_size} onChange={(e) => setReg({ ...reg, uniform_size: e.target.value })}>
                    <option value="">Not answered</option>
                    {options.uniform_size.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Experience">
                  <Select value={reg.experience} onChange={(e) => setReg({ ...reg, experience: e.target.value })}>
                    <option value="">Not answered</option>
                    {options.experience.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="How they heard">
                  <Select value={reg.heard_via} onChange={(e) => setReg({ ...reg, heard_via: e.target.value })}>
                    <option value="">Not answered</option>
                    {options.heard_via.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Notes" className="sm:col-span-2">
                  <Textarea value={reg.notes} onChange={(e) => setReg({ ...reg, notes: e.target.value })} />
                </Field>
              </div>
            ) : (
              <dl className="mt-2">
                <Row k="Status" v={STATUS_LABEL[row.registration.status]} />
                <Row k="Uniform" v={row.registration.uniform_size} />
                <Row k="Experience" v={row.registration.experience} />
                <Row k="Heard via" v={row.registration.heard_via} />
                <Row k="Notes" v={row.registration.notes} />
                {customFields.map((f) => (
                  <Row key={f.key} k={f.label} v={row.registration?.custom[f.key]} />
                ))}
              </dl>
            ))}
        </section>

        <section>
          <SectionHead title="Fee" number="05" sub={row.fee ? money(row.fee.amount_cents, { compact: true }) : "No fee record for this season"} />
          <div className="mt-3 flex flex-wrap gap-2">
            {(["owing", "partial", "paid", "waived"] as const).map((st) => (
              <Button key={st} size="sm" variant={row.fee?.status === st ? "ink" : "outline"} onClick={() => fee(st)} loading={pending && false}>
                {FEE_LABEL[st]}
              </Button>
            ))}
          </div>
        </section>
      </div>
    </Sheet>
  );
}

/* ----------------------------------------------------------------------- */

function AddPlayerSheet({ slug, options, onClose }: { slug: string; options: Options; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [v, setV] = useState({
    first_name: "", last_name: "", dob: "", gender: "", school: "",
    g_first: "", g_last: "", g_email: "", g_mobile: "", relationship: "",
    medical: "", ambulance_cover: "", emergency_name: "", emergency_phone: "",
    uniform_size: "", experience: "", heard_via: "", notes: "",
  });
  const u = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  const submit = () =>
    start(async () => {
      setError(null);
      const r = await addPlayerAction(slug, {
        player: { first_name: v.first_name, last_name: v.last_name, dob: v.dob, gender: v.gender, school: v.school },
        guardian: { first_name: v.g_first, last_name: v.g_last, email: v.g_email, mobile: v.g_mobile, relationship: v.relationship },
        sensitive: { medical: v.medical, ambulance_cover: v.ambulance_cover, emergency_name: v.emergency_name, emergency_phone: v.emergency_phone },
        registration: { uniform_size: v.uniform_size, experience: v.experience, heard_via: v.heard_via, notes: v.notes },
      });
      if (!r.ok) return setError(r.error);
      router.refresh();
      onClose();
    });

  return (
    <Sheet
      open
      onClose={onClose}
      title="Add a player"
      sub="For someone who registered on paper or in person. Only the name and date of birth are required."
      wide
      footer={
        <>
          <Button onClick={submit} loading={pending}>
            Add player
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      {error && (
        <Banner tone="danger" className="mb-4">
          <span>{error}</span>
        </Banner>
      )}
      <div className="flex flex-col gap-6">
        <section>
          <SectionHead title="Player" number="01" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="First name" required>
              <Input value={v.first_name} onChange={u("first_name")} autoFocus />
            </Field>
            <Field label="Last name">
              <Input value={v.last_name} onChange={u("last_name")} />
            </Field>
            <Field label="Date of birth" required>
              <Input type="date" value={v.dob} onChange={u("dob")} />
            </Field>
            <Field label="Gender">
              <Select value={v.gender} onChange={u("gender")}>
                <option value="">Not stated</option>
                {options.gender.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="School" className="sm:col-span-2">
              <Input value={v.school} onChange={u("school")} />
            </Field>
          </div>
        </section>
        <section>
          <SectionHead title="Parent or guardian" number="02" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="First name">
              <Input value={v.g_first} onChange={u("g_first")} />
            </Field>
            <Field label="Last name">
              <Input value={v.g_last} onChange={u("g_last")} />
            </Field>
            <Field label="Mobile">
              <Input value={v.g_mobile} onChange={u("g_mobile")} inputMode="tel" />
            </Field>
            <Field label="Email">
              <Input value={v.g_email} onChange={u("g_email")} inputMode="email" />
            </Field>
            <Field label="Relationship">
              <Select value={v.relationship} onChange={u("relationship")}>
                <option value="">Select</option>
                {options.relationship.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
          </div>
        </section>
        <section>
          <SectionHead title="Medical and emergency" number="03" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Conditions, allergies, medication" className="sm:col-span-2">
              <Textarea value={v.medical} onChange={u("medical")} />
            </Field>
            <Field label="Ambulance cover">
              <Select value={v.ambulance_cover} onChange={u("ambulance_cover")}>
                <option value="">Not answered</option>
                {options.ambulance_cover.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="Emergency contact">
              <Input value={v.emergency_name} onChange={u("emergency_name")} />
            </Field>
            <Field label="Emergency phone">
              <Input value={v.emergency_phone} onChange={u("emergency_phone")} inputMode="tel" />
            </Field>
          </div>
        </section>
        <section>
          <SectionHead title="Registration" number="04" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Uniform size">
              <Select value={v.uniform_size} onChange={u("uniform_size")}>
                <option value="">Not answered</option>
                {options.uniform_size.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="Experience">
              <Select value={v.experience} onChange={u("experience")}>
                <option value="">Not answered</option>
                {options.experience.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="How they heard">
              <Select value={v.heard_via} onChange={u("heard_via")}>
                <option value="">Not answered</option>
                {options.heard_via.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={v.notes} onChange={u("notes")} />
            </Field>
          </div>
        </section>
      </div>
    </Sheet>
  );
}
