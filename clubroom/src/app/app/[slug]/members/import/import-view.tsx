"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, FileSpreadsheet, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Banner, Chip, SectionHead } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { buildRow, TARGETS, type ImportRow } from "@/lib/import";
import { cn, fmtDob, pluralise } from "@/lib/utils";

type Parsed = { headers: string[]; rows: ImportRow[]; total: number; mapping: Record<string, string>; fileName: string };
type Result = { created: number; duplicates: number; skipped: number; errors: Array<{ row: number; error: string }> };

export function ImportView({ slug, seasonName, existingKeys }: { slug: string; seasonName: string | null; existingKeys: string[] }) {
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [skip, setSkip] = useState<Set<number>>(new Set());
  const input = useRef<HTMLInputElement>(null);
  const existing = useMemo(() => new Set(existingKeys), [existingKeys]);

  const built = useMemo(() => (parsed ? parsed.rows.map((r, i) => buildRow(r, mapping, i, parsed.fileName)) : []), [parsed, mapping]);
  const preview = useMemo(() => {
    const seen = new Set<string>();
    return built.map((b) => {
      const key = `${b.payload.player.first_name.trim().toLowerCase()}|${b.payload.player.last_name.trim().toLowerCase()}|${b.payload.player.dob}`;
      const dupInFile = b.payload.player.dob ? seen.has(key) : false;
      if (b.payload.player.dob) seen.add(key);
      const dupExisting = b.payload.player.dob ? existing.has(key) : false;
      return { ...b, dupInFile, dupExisting, blocked: b.problems.some((p) => p.startsWith("no ")) };
    });
  }, [built, existing]);
  const ready = preview.filter((p) => !p.blocked && !skip.has(p.index)).length;

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("slug", slug);
      fd.append("file", file);
      const res = await fetch("/api/import/parse", { method: "POST", body: fd });
      const json = (await res.json()) as (Parsed & { ok: true }) | { ok: false; error: string };
      if (!json.ok) throw new Error(json.error);
      setParsed(json);
      setMapping(json.mapping);
      setSkip(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!parsed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/import/commit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, fileName: parsed.fileName, mapping, rows: parsed.rows, skip: [...skip] }) });
      const json = (await res.json()) as (Result & { ok: true }) | { ok: false; error: string };
      if (!json.ok) throw new Error(json.error);
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          <p className="eyebrow">Import</p>
          <h1 className="display mt-1 text-[36px] text-ink">Done</h1>
        </div>
        <div className="scoreboard">
          <div>
            <span className="numeral text-[38px] text-ok">{result.created}</span>
            <span className="eyebrow block">Added</span>
          </div>
          <div>
            <span className="numeral text-[38px] text-warn">{result.duplicates}</span>
            <span className="eyebrow block">Flagged as duplicates</span>
          </div>
          <div>
            <span className="numeral text-[38px] text-ink">{result.skipped}</span>
            <span className="eyebrow block">Skipped</span>
          </div>
          <div>
            <span className="numeral text-[38px] text-danger">{result.errors.length}</span>
            <span className="eyebrow block">Errors</span>
          </div>
        </div>
        {result.errors.length > 0 && (
          <ul className="text-[13px] text-ink-muted">
            {result.errors.map((e) => (
              <li key={e.row} className="border-b border-line py-2">
                Row {e.row}: {e.error}
              </li>
            ))}
          </ul>
        )}
        <p className="text-[13.5px] text-ink-muted">Duplicates are players who already had a registration this season with the same name and date of birth. They&rsquo;re marked in Members so you can archive the extra one.</p>
        <ButtonLink href={`/app/${slug}/members`} icon={<ArrowRight className="size-4" />} className="self-start">
          Go to Members
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/app/${slug}/members`} className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-muted hover:text-ink">
          <ArrowLeft className="size-3.5" /> Members
        </Link>
        <h1 className="display mt-2 text-[36px] text-ink md:text-[48px]">Import a spreadsheet</h1>
        <p className="mt-2 max-w-xl text-[14.5px] text-ink-muted">
          Excel or CSV, one row per player, headers in the first row. The file is read once and not kept. Rows go into {seasonName ?? "the club"} the same way a form submission does.
        </p>
      </div>
      {error && (
        <Banner tone="danger">
          <span>{error}</span>
        </Banner>
      )}

      {!parsed ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) upload(f);
          }}
          className={cn("flex flex-col items-center gap-3 rounded-[var(--r-lg)] border-2 border-dashed border-line-strong px-6 py-16 text-center transition-colors hover:border-club", busy && "pointer-events-none opacity-60")}
        >
          <FileSpreadsheet className="size-8 text-ink-dim" />
          <span className="display text-[20px] text-ink">{busy ? "Reading…" : "Drop the file here, or tap to choose"}</span>
          <span className="text-[13px] text-ink-muted">.xlsx or .csv, up to 2,000 rows</span>
          <input ref={input} type="file" accept=".xlsx,.xlsm,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </button>
      ) : (
        <>
          <section>
            <SectionHead title="Match the columns" number="01" sub={`${parsed.fileName} · ${pluralise(parsed.total, "row")}. We guessed from the headers; fix anything that's wrong.`} />
            <div className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-2">
              {TARGETS.map((t) => (
                <label key={t.key} className="grid grid-cols-[150px_1fr] items-center gap-3 text-[13px]">
                  <span className={cn("font-bold", mapping[t.key] ? "text-ink" : "text-ink-dim")}>{t.label}</span>
                  <Select value={mapping[t.key] ?? ""} onChange={(e) => setMapping({ ...mapping, [t.key]: e.target.value })} className="py-2 text-[13px]">
                    <option value="">Not in the file</option>
                    {parsed.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                </label>
              ))}
            </div>
          </section>

          <section>
            <SectionHead title="Check the rows" number="02" sub={`${ready} of ${parsed.total} will be added. Untick a row to skip it.`} />
            <div className="-mx-4 mt-3 overflow-x-auto md:mx-0">
              <table className="data-table min-w-[900px] text-[13px]">
                <thead>
                  <tr>
                    <th />
                    <th>Row</th>
                    <th>Player</th>
                    <th>Born</th>
                    <th>Parent</th>
                    <th>Contact</th>
                    <th>Consents</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 300).map((p) => (
                    <tr key={p.index} className={cn(p.blocked && "opacity-50")}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Include row ${p.index + 2}`}
                          checked={!p.blocked && !skip.has(p.index)}
                          disabled={p.blocked}
                          onChange={(e) => {
                            const next = new Set(skip);
                            if (e.target.checked) next.delete(p.index);
                            else next.add(p.index);
                            setSkip(next);
                          }}
                          className="size-4 accent-[var(--club-primary)]"
                        />
                      </td>
                      <td className="text-ink-dim">{p.index + 2}</td>
                      <td className="font-bold text-ink">
                        {p.payload.player.first_name} {p.payload.player.last_name}
                      </td>
                      <td className="text-ink-muted">{p.payload.player.dob ? fmtDob(p.payload.player.dob) : "—"}</td>
                      <td className="text-ink-muted">{[p.payload.guardian.first_name, p.payload.guardian.last_name].filter(Boolean).join(" ") || "—"}</td>
                      <td className="text-ink-muted">{p.payload.guardian.mobile ?? p.payload.guardian.email ?? "—"}</td>
                      <td className="text-ink-muted">{p.payload.consents.filter((c) => c.granted).map((c) => c.key).join(", ") || "—"}</td>
                      <td>
                        <span className="inline-flex flex-wrap gap-1">
                          {p.problems.map((pr) => (
                            <Chip key={pr} tone={p.blocked ? "danger" : "warn"}>
                              {pr}
                            </Chip>
                          ))}
                          {p.dupExisting && <Chip tone="warn">already in members</Chip>}
                          {p.dupInFile && <Chip tone="warn">twice in file</Chip>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 300 && <p className="px-4 py-3 text-[12.5px] text-ink-dim">Showing the first 300 of {preview.length} rows. All of them will be imported.</p>}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={() => setParsed(null)}>
              Choose another file
            </Button>
            <Button size="lg" icon={<Upload className="size-4" />} onClick={commit} loading={busy} disabled={!ready} className="ml-auto">
              Import {pluralise(ready, "row")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
