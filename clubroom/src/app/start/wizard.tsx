"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Copy, Link2, MailCheck, MapPin, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ClubMark, ClubTheme } from "@/components/club-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Banner, Chip } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { describeDivision, divisionsFromDefaults, type AgeRuleMode, type Division } from "@/lib/age-rule";
import { ensureVisibleOnDark, isHex, onColour } from "@/lib/colours";
import { logoUrl } from "@/lib/storage";
import { cn, money, slugify } from "@/lib/utils";
import { LogoUpload } from "./logo-upload";
import {
  checkSlug,
  createClubAction,
  goLiveAction,
  inviteAdminsAction,
  saveFeeAction,
  saveLookAction,
  saveSeasonAction,
  saveVenuesAction,
  skipStepAction,
  updateClubBasicsAction,
} from "./actions";

export type Colours = { primary: string; accent: string; on_primary: string };

export type WizardData = {
  club: {
    id: string;
    slug: string;
    name: string;
    sport_key: string;
    suburb: string | null;
    state: string | null;
    logo_path: string | null;
    colours: Colours;
    theme_default: "dark" | "light" | "system";
    short_name: string | null;
    instagram_handle: string | null;
    status: string;
    onboarding_step: number;
  } | null;
  sports: Array<{ key: string; name: string; default_divisions: Array<{ name: string; min_age?: number | null; max_age?: number | null }> }>;
  venues: Array<{ id: string; name: string; address: string | null }>;
  season: {
    id: string;
    name: string;
    starts_on: string | null;
    ends_on: string | null;
    age_rule_mode: AgeRuleMode;
    age_cutoff_date: string | null;
    fee_cents: number | null;
    fee_label: string | null;
    registration_open: boolean;
  } | null;
  divisions: Division[];
  invites: Array<{ email: string; role: string; accepted_at: string | null }>;
  userName: string | null;
  userEmail: string;
  initialStep?: number;
};

const STEPS = [
  { key: "club", title: "Your club" },
  { key: "look", title: "Logo and colours" },
  { key: "venues", title: "Where you play" },
  { key: "season", title: "Season and age groups" },
  { key: "fees", title: "Fees" },
  { key: "people", title: "Other admins" },
  { key: "live", title: "Go live" },
] as const;

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

export function Wizard({ data }: { data: WizardData }) {
  const [club, setClub] = useState(data.club);
  const [venues, setVenues] = useState(data.venues);
  const [season, setSeason] = useState(data.season);
  const [divisions, setDivisions] = useState(data.divisions);
  const [invites, setInvites] = useState(data.invites);
  const completed = club?.onboarding_step ?? 0;
  const [step, setStep] = useState(() => Math.min(data.initialStep ?? completed, STEPS.length - 1));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const go = (n: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, n)));
  const sport = data.sports.find((s) => s.key === club?.sport_key) ?? data.sports[0];

  return (
    <div className="club-glow min-h-dvh">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-6">
        <Link href="/" className="display text-[18px] text-ink">
          Clubroom
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-ink-dim">
            Step {step + 1} of {STEPS.length}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-8">
        <ol className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {STEPS.map((s, i) => {
            const done = i < completed;
            const current = i === step;
            const reachable = i <= completed;
            return (
              <li key={s.key} className="shrink-0">
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => go(i)}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition-colors",
                    current ? "border-club bg-club/15 text-ink" : done ? "border-line text-ink-muted hover:text-ink" : "border-line text-ink-dim",
                    !reachable && "opacity-50",
                  )}
                >
                  {done && !current ? <Check className="size-3.5 text-ok" /> : <span className="numeral text-[11px]">{i + 1}</span>}
                  {s.title}
                </button>
              </li>
            );
          })}
        </ol>

        <div key={step} className="rise">
          {step === 0 && (
            <StepClub
              club={club}
              sports={data.sports}
              onDone={(c) => {
                setClub(c);
                go(1);
              }}
            />
          )}
          {step === 1 && club && (
            <StepLook
              club={club}
              onBack={() => go(0)}
              onDone={(patch) => {
                setClub({ ...club, ...patch, onboarding_step: Math.max(club.onboarding_step, 2) });
                go(2);
              }}
            />
          )}
          {step === 2 && club && (
            <StepVenues
              clubId={club.id}
              venues={venues}
              onBack={() => go(1)}
              onDone={(v) => {
                setVenues(v);
                setClub({ ...club, onboarding_step: Math.max(club.onboarding_step, 3) });
                go(3);
              }}
            />
          )}
          {step === 3 && club && (
            <StepSeason
              clubId={club.id}
              sportName={sport?.name ?? "your sport"}
              defaults={sport?.default_divisions ?? []}
              season={season}
              divisions={divisions}
              onBack={() => go(2)}
              onDone={(s, d) => {
                setSeason(s);
                setDivisions(d);
                setClub({ ...club, onboarding_step: Math.max(club.onboarding_step, 4) });
                go(4);
              }}
            />
          )}
          {step === 4 && club && (
            <StepFees
              clubId={club.id}
              season={season}
              onBack={() => go(3)}
              onDone={(feeCents, label) => {
                if (season) setSeason({ ...season, fee_cents: feeCents, fee_label: label });
                setClub({ ...club, onboarding_step: Math.max(club.onboarding_step, 5) });
                go(5);
              }}
            />
          )}
          {step === 5 && club && (
            <StepPeople
              clubId={club.id}
              invites={invites}
              userEmail={data.userEmail}
              onBack={() => go(4)}
              onDone={(inv) => {
                setInvites(inv);
                setClub({ ...club, onboarding_step: Math.max(club.onboarding_step, 6) });
                go(6);
              }}
            />
          )}
          {step === 6 && club && <StepLive club={club} sportName={sport?.name ?? ""} venues={venues} season={season} divisions={divisions} invites={invites} onBack={() => go(5)} />}
        </div>
      </main>
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function StepShell({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display mt-2 text-[34px] text-ink sm:text-[40px]">{title}</h1>
      {lead && <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-ink-muted">{lead}</p>}
      <div className="mt-8 flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Nav({ onBack, next = "Continue", pending, skip, extra }: { onBack?: () => void; next?: string; pending?: boolean; skip?: () => void; extra?: React.ReactNode }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      {onBack && (
        <Button type="button" variant="ghost" onClick={onBack} icon={<ArrowLeft className="size-4" />}>
          Back
        </Button>
      )}
      <div className="ml-auto flex items-center gap-3">
        {skip && (
          <Button type="button" variant="ghost" onClick={skip}>
            Skip for now
          </Button>
        )}
        {extra}
        <Button type="submit" size="lg" loading={pending} icon={<ArrowRight className="size-4" />}>
          {next}
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function StepClub({ club, sports, onDone }: { club: WizardData["club"]; sports: WizardData["sports"]; onDone: (club: NonNullable<WizardData["club"]>) => void }) {
  const [name, setName] = useState(club?.name ?? "");
  const [sportKey, setSportKey] = useState(club?.sport_key ?? "basketball");
  const [suburb, setSuburb] = useState(club?.suburb ?? "");
  const [state, setState] = useState(club?.state ?? "NSW");
  const [slug, setSlug] = useState(club?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!club);
  const [slugState, setSlugState] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (club || slug.length < 3) return setSlugState("idle");
    setSlugState("checking");
    const t = setTimeout(async () => {
      const r = await checkSlug(slug);
      setSlugState(r.available ? "free" : "taken");
    }, 350);
    return () => clearTimeout(t);
  }, [slug, club]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      if (club) {
        const r = await updateClubBasicsAction(club.id, { name, sport_key: sportKey, suburb, state });
        if (!r.ok) return setError(r.error);
        onDone({ ...club, name, sport_key: sportKey, suburb, state });
      } else {
        const r = await createClubAction({ name, sport_key: sportKey, slug, suburb, state });
        if (!r.ok) return setError(r.error);
        onDone({
          id: r.clubId,
          slug: r.slug,
          name,
          sport_key: sportKey,
          suburb,
          state,
          logo_path: null,
          colours: { primary: "#f2b705", accent: "#f2b705", on_primary: "#14120a" },
          theme_default: "dark",
          short_name: null,
          instagram_handle: null,
          status: "onboarding",
          onboarding_step: 1,
        });
      }
    });
  };

  return (
    <form onSubmit={submit}>
      <StepShell eyebrow="Step 1" title="Your club" lead="The name goes on the registration form, the parent app and every email. You can change it later.">
        <Field label="Club name" required htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bankstown Bullets Basketball" required minLength={2} autoFocus />
        </Field>
        <Field label="Sport" required htmlFor="sport" hint="Sets the words we use (game or match, division names) and the default age groups. All of it can be changed.">
          <Select id="sport" value={sportKey} onChange={(e) => setSportKey(e.target.value)}>
            {sports.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <Field label="Suburb" htmlFor="suburb">
            <Input id="suburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="Bankstown" />
          </Field>
          <Field label="State" htmlFor="state">
            <Select id="state" value={state} onChange={(e) => setState(e.target.value)}>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Web address"
          required
          htmlFor="slug"
          hint={
            club ? (
              "The address is fixed once the club exists."
            ) : slugState === "taken" ? (
              <span className="text-danger">Taken. Try another.</span>
            ) : slugState === "free" ? (
              <span className="text-ok">Available.</span>
            ) : (
              "Short, lowercase, dashes allowed. This is the link parents get."
            )
          }
        >
          <div className="flex items-center overflow-hidden rounded-[var(--r-md)] border border-line-strong bg-input focus-within:border-club">
            <span className="shrink-0 select-none pl-4 text-[15px] text-ink-dim">clubroom.au/c/</span>
            <input
              id="slug"
              value={slug}
              disabled={!!club}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="w-full bg-transparent py-3 pr-4 text-[16px] text-ink outline-none disabled:opacity-60"
              required
              minLength={3}
            />
          </div>
        </Field>
        {error && (
          <Banner tone="danger">
            <span>{error}</span>
          </Banner>
        )}
        <Nav pending={pending} next={club ? "Continue" : "Create the club"} />
      </StepShell>
    </form>
  );
}

/* ----------------------------------------------------------------------- */

const PRESETS = ["#1f6feb", "#e0362c", "#0f9d58", "#f2b705", "#7c3aed", "#ff6b00", "#00a3a3", "#111111"];

function StepLook({ club, onBack, onDone }: { club: NonNullable<WizardData["club"]>; onBack: () => void; onDone: (patch: Partial<NonNullable<WizardData["club"]>>) => void }) {
  const [logoPath, setLogoPath] = useState(club.logo_path);
  const [palette, setPalette] = useState<string[]>([]);
  const [primary, setPrimary] = useState(club.colours.primary);
  const [accent, setAccent] = useState(club.colours.accent);
  const [themeDefault, setThemeDefault] = useState<"dark" | "light">(club.theme_default === "light" ? "light" : "dark");
  const [shortName, setShortName] = useState(club.short_name ?? "");
  const [insta, setInsta] = useState(club.instagram_handle ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onPrimary = useMemo(() => (isHex(primary) ? onColour(primary) : "#0b0c10"), [primary]);
  const swatches = [...new Set([...palette, ...PRESETS])].slice(0, 12);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await saveLookAction(club.id, { logo_path: logoPath, primary, accent, on_primary: onPrimary, theme_default: themeDefault, short_name: shortName, instagram_handle: insta });
      if (!r.ok) return setError(r.error);
      onDone({ logo_path: logoPath, colours: { primary, accent, on_primary: onPrimary }, theme_default: themeDefault, short_name: shortName || null, instagram_handle: insta || null });
    });
  };

  return (
    <form onSubmit={submit}>
      <StepShell eyebrow="Step 2" title="Logo and colours" lead="This is what parents see. Upload the logo and we'll suggest colours from it; pick the one that's really yours.">
        <LogoUpload
          clubId={club.id}
          clubName={club.name}
          value={logoPath}
          onChange={(path, pal) => {
            setLogoPath(path);
            setPalette(pal);
            if (pal[0]) {
              setPrimary(ensureVisibleOnDark(pal[0]));
              setAccent(ensureVisibleOnDark(pal[1] ?? pal[0]));
            }
          }}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <ColourPicker label="Main colour" value={primary} onChange={setPrimary} swatches={swatches} hint="Buttons, highlights, the glow." />
          <ColourPicker label="Second colour" value={accent} onChange={setAccent} swatches={swatches} hint="Badges and small accents." />
        </div>

        <div>
          <p className="eyebrow mb-2">Preview</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <PreviewCard club={{ ...club, logo_path: logoPath, colours: { primary, accent, on_primary: onPrimary } }} theme="dark" selected={themeDefault === "dark"} onSelect={() => setThemeDefault("dark")} />
            <PreviewCard club={{ ...club, logo_path: logoPath, colours: { primary, accent, on_primary: onPrimary } }} theme="light" selected={themeDefault === "light"} onSelect={() => setThemeDefault("light")} />
          </div>
          <p className="mt-2 text-[12.5px] text-ink-dim">Tap the one the club should open in. Everyone can switch for themselves later.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Short name" htmlFor="short" hint="For tight spaces, like the app header.">
            <Input id="short" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder={club.name.split(" ").slice(-1)[0]} maxLength={24} />
          </Field>
          <Field label="Instagram" htmlFor="insta">
            <div className="flex items-center overflow-hidden rounded-[var(--r-md)] border border-line-strong bg-input focus-within:border-club">
              <span className="pl-4 text-ink-dim">@</span>
              <input id="insta" value={insta} onChange={(e) => setInsta(e.target.value.replace(/^@/, ""))} className="w-full bg-transparent py-3 pl-1 pr-4 text-[16px] text-ink outline-none" placeholder="yourclub" />
            </div>
          </Field>
        </div>
        {error && (
          <Banner tone="danger">
            <span>{error}</span>
          </Banner>
        )}
        <Nav onBack={onBack} pending={pending} />
      </StepShell>
    </form>
  );
}

function ColourPicker({ label, value, onChange, swatches, hint }: { label: string; value: string; onChange: (v: string) => void; swatches: string[]; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {swatches.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            onClick={() => onChange(c)}
            className={cn("size-9 rounded-full border-2 transition-transform hover:scale-105", value.toLowerCase() === c.toLowerCase() ? "border-ink scale-110" : "border-transparent")}
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={isHex(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="size-11 cursor-pointer rounded-[10px] border border-line-strong bg-input p-1" aria-label={`${label} picker`} />
        <Input value={value} onChange={(e) => onChange(e.target.value.trim())} className="font-mono uppercase" maxLength={7} />
      </div>
    </Field>
  );
}

function PreviewCard({ club, theme, selected, onSelect }: { club: NonNullable<WizardData["club"]>; theme: "dark" | "light"; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={cn("rounded-[var(--r-lg)] border-2 p-1 text-left transition-colors", selected ? "border-club" : "border-line hover:border-line-strong")}>
      <div data-theme={theme} className="rounded-[calc(var(--r-lg)-4px)] bg-bg p-4 text-ink" style={{ colorScheme: theme }}>
        <ClubTheme colours={club.colours}>
          <div className="club-glow -m-4 rounded-[calc(var(--r-lg)-4px)] p-4">
            <div className="flex items-center gap-3">
              <ClubMark name={club.name} src={logoUrl(club.logo_path)} size={40} />
              <div className="min-w-0">
                <p className="display truncate text-[15px] text-ink">{club.short_name || club.name}</p>
                <p className="text-[11px] text-ink-muted">{theme === "dark" ? "Dark" : "Light"}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-[var(--r-sm)] border border-line bg-elev px-3 py-2">
                <div className="numeral text-[20px] text-club">24</div>
                <div className="eyebrow">Registered</div>
              </div>
              <div className="rounded-[var(--r-sm)] border border-line bg-elev px-3 py-2">
                <div className="numeral text-[20px] text-ink">6</div>
                <div className="eyebrow">Owing</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-club text-[12.5px] font-bold text-on-club">Register now</span>
              <Chip tone="club">U12</Chip>
            </div>
          </div>
        </ClubTheme>
      </div>
      <p className="px-3 py-2 text-[12px] font-bold text-ink-muted">{selected ? "Opens in this look" : "Use this look"}</p>
    </button>
  );
}

/* ----------------------------------------------------------------------- */

function StepVenues({ clubId, venues, onBack, onDone }: { clubId: string; venues: WizardData["venues"]; onBack: () => void; onDone: (v: WizardData["venues"]) => void }) {
  const [rows, setRows] = useState<Array<{ id?: string; name: string; address: string }>>(venues.length ? venues.map((v) => ({ id: v.id, name: v.name, address: v.address ?? "" })) : [{ name: "", address: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await saveVenuesAction(clubId, rows);
      if (!r.ok) return setError(r.error);
      onDone(r.venues);
    });
  };

  return (
    <form onSubmit={submit}>
      <StepShell eyebrow="Step 3" title="Where you play" lead="Games and trainings get pinned to a venue, and parents get directions from the app. One is plenty to start.">
        {rows.map((row, i) => (
          <div key={row.id ?? i} className="flex items-start gap-3 rounded-[var(--r-md)] border border-line bg-elev p-3.5">
            <MapPin className="mt-3.5 size-4 shrink-0 text-ink-dim" />
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <Input placeholder="Venue name (e.g. Bankstown Basketball Stadium)" value={row.name} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))} />
              <Input placeholder="Address" value={row.address} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, address: e.target.value } : r)))} />
            </div>
            <button type="button" aria-label="Remove venue" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="mt-2 grid size-9 place-items-center rounded-full text-ink-dim hover:bg-elev2 hover:text-danger">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setRows([...rows, { name: "", address: "" }])} icon={<Plus className="size-4" />} className="self-start">
          Add another venue
        </Button>
        {error && (
          <Banner tone="danger">
            <span>{error}</span>
          </Banner>
        )}
        <Nav
          onBack={onBack}
          pending={pending}
          skip={() =>
            start(async () => {
              await skipStepAction(clubId, 3);
              onDone(venues);
            })
          }
        />
      </StepShell>
    </form>
  );
}

/* ----------------------------------------------------------------------- */

function defaultSeasonName() {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `Summer ${y}/${String(y + 1).slice(-2)}` : `Winter ${y}`;
}

function StepSeason({
  clubId,
  sportName,
  defaults,
  season,
  divisions,
  onBack,
  onDone,
}: {
  clubId: string;
  sportName: string;
  defaults: WizardData["sports"][number]["default_divisions"];
  season: WizardData["season"];
  divisions: Division[];
  onBack: () => void;
  onDone: (s: NonNullable<WizardData["season"]>, d: Division[]) => void;
}) {
  const year = new Date().getFullYear();
  const [name, setName] = useState(season?.name ?? defaultSeasonName());
  const [startsOn, setStartsOn] = useState(season?.starts_on ?? "");
  const [endsOn, setEndsOn] = useState(season?.ends_on ?? "");
  const [mode, setMode] = useState<AgeRuleMode>(season?.age_rule_mode ?? "age_at_date");
  const [cutoff, setCutoff] = useState(season?.age_cutoff_date ?? `${year}-12-31`);
  const [open, setOpen] = useState(season?.registration_open ?? true);
  const [rows, setRows] = useState<Division[]>(divisions.length ? divisions : divisionsFromDefaults(defaults, "age_at_date", year));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const refYear = Number((cutoff || `${year}-12-31`).slice(0, 4)) || year;
  const resetDefaults = useCallback((m: AgeRuleMode) => setRows(divisionsFromDefaults(defaults, m, refYear)), [defaults, refYear]);

  const switchMode = (m: AgeRuleMode) => {
    setMode(m);
    resetDefaults(m);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await saveSeasonAction(clubId, { name, starts_on: startsOn || null, ends_on: endsOn || null, age_rule_mode: mode, age_cutoff_date: mode === "age_at_date" ? cutoff : null, registration_open: open, divisions: rows });
      if (!r.ok) return setError(r.error);
      onDone({ id: r.seasonId, name, starts_on: startsOn || null, ends_on: endsOn || null, age_rule_mode: mode, age_cutoff_date: mode === "age_at_date" ? cutoff : null, fee_cents: season?.fee_cents ?? null, fee_label: season?.fee_label ?? null, registration_open: open }, rows);
    });
  };

  const update = (i: number, patch: Partial<Division>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const num = (v: string) => (v === "" ? null : Number(v));

  return (
    <form onSubmit={submit}>
      <StepShell eyebrow="Step 4" title="Season and age groups" lead="Age groups come from date of birth, not from the age a parent types in. Pick how your association counts it.">
        <Field label="Season name" required htmlFor="sname">
          <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts" htmlFor="starts">
            <Input id="starts" type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
          </Field>
          <Field label="Ends" htmlFor="ends">
            <Input id="ends" type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
          </Field>
        </div>

        <div>
          <p className="eyebrow mb-2">How age groups are worked out</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ModeCard active={mode === "age_at_date"} onClick={() => switchMode("age_at_date")} title="Age on a set date" text="e.g. how old they are on 31 December. Common for basketball." />
            <ModeCard active={mode === "birth_year"} onClick={() => switchMode("birth_year")} title="Year they were born" text="e.g. everyone born in 2014 plays U12. Common for football." />
          </div>
          {mode === "age_at_date" && (
            <Field label="Ages counted on" required htmlFor="cutoff" className="mt-4">
              <Input id="cutoff" type="date" value={cutoff} onChange={(e) => setCutoff(e.target.value)} required />
            </Field>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="eyebrow">Age groups</p>
            <button type="button" onClick={() => resetDefaults(mode)} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink-muted hover:text-ink">
              <RotateCcw className="size-3.5" /> {sportName} defaults
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {rows.map((d, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-[var(--r-md)] border border-line bg-elev p-2.5">
                <div className="flex items-center gap-2">
                  <Input value={d.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="U12" className="min-w-0 flex-1 py-2.5 font-bold" aria-label="Age group name" />
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
                      <Input type="number" inputMode="numeric" value={d.born_from ?? ""} onChange={(e) => update(i, { born_from: num(e.target.value) })} placeholder="from" className="w-24 py-2.5" aria-label="Born from" />
                      <span className="text-ink-dim">to</span>
                      <Input type="number" inputMode="numeric" value={d.born_to ?? ""} onChange={(e) => update(i, { born_to: num(e.target.value) })} placeholder="to" className="w-24 py-2.5" aria-label="Born to" />
                    </>
                  ) : (
                    <>
                      <Input type="number" inputMode="numeric" value={d.min_age ?? ""} onChange={(e) => update(i, { min_age: num(e.target.value) })} placeholder="min" className="w-20 py-2.5" aria-label="Minimum age" />
                      <span className="text-ink-dim">to</span>
                      <Input type="number" inputMode="numeric" value={d.max_age ?? ""} onChange={(e) => update(i, { max_age: num(e.target.value) })} placeholder="max" className="w-20 py-2.5" aria-label="Maximum age" />
                    </>
                  )}
                  <span className="ml-auto truncate text-[11.5px] text-ink-dim">{describeDivision(d, mode)}</span>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-3" icon={<Plus className="size-4" />} onClick={() => setRows([...rows, { name: "", sort: rows.length + 1 }])}>
            Add an age group
          </Button>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-[var(--r-md)] border border-line bg-elev px-4 py-3.5">
          <span>
            <span className="block text-[14px] font-bold text-ink">Registrations open</span>
            <span className="block text-[12.5px] text-ink-muted">Turn off to close the form without taking the page down.</span>
          </span>
          <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} className="size-5 accent-[var(--club-primary)]" />
        </label>
        {error && (
          <Banner tone="danger">
            <span>{error}</span>
          </Banner>
        )}
        <Nav onBack={onBack} pending={pending} />
      </StepShell>
    </form>
  );
}

function ModeCard({ active, onClick, title, text }: { active: boolean; onClick: () => void; title: string; text: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-[var(--r-md)] border p-4 text-left transition-colors", active ? "border-club bg-club/10" : "border-line bg-elev hover:border-line-strong")}>
      <span className="block text-[14px] font-bold text-ink">{title}</span>
      <span className="mt-0.5 block text-[12.5px] text-ink-muted">{text}</span>
    </button>
  );
}

/* ----------------------------------------------------------------------- */

function StepFees({ clubId, season, onBack, onDone }: { clubId: string; season: WizardData["season"]; onBack: () => void; onDone: (feeCents: number | null, label: string | null) => void }) {
  const [mode, setMode] = useState<"set" | "later">(season?.fee_cents ? "set" : "later");
  const [amount, setAmount] = useState(season?.fee_cents ? String(season.fee_cents / 100) : "");
  const [label, setLabel] = useState(season?.fee_label ?? "per player, per season");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await saveFeeAction(clubId, { mode, amount, label });
      if (!r.ok) return setError(r.error);
      onDone(mode === "set" ? Math.round(Number(amount) * 100) : null, label || null);
    });
  };

  return (
    <form onSubmit={submit}>
      <StepShell eyebrow="Step 5" title="Fees" lead="We never make a number up. Either set the real fee now, or tell families it'll be confirmed. Fees are tracked as paid or owing; online payment comes later.">
        <div className="grid gap-2 sm:grid-cols-2">
          <ModeCard active={mode === "set"} onClick={() => setMode("set")} title="Set the fee now" text="Shown on the registration form and used to track who owes what." />
          <ModeCard active={mode === "later"} onClick={() => setMode("later")} title="Confirm it later" text="The form says the club will confirm fees. You can set it any time." />
        </div>
        {mode === "set" && (
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <Field label="Amount" required htmlFor="amount">
              <div className="flex items-center overflow-hidden rounded-[var(--r-md)] border border-line-strong bg-input focus-within:border-club">
                <span className="pl-4 text-ink-dim">$</span>
                <input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent py-3 pl-1 pr-3 text-[16px] text-ink outline-none" placeholder="180" required />
              </div>
            </Field>
            <Field label="Shown as" htmlFor="label">
              <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="per player, per season" />
            </Field>
          </div>
        )}
        {error && (
          <Banner tone="danger">
            <span>{error}</span>
          </Banner>
        )}
        <Nav onBack={onBack} pending={pending} />
      </StepShell>
    </form>
  );
}

/* ----------------------------------------------------------------------- */

function StepPeople({ clubId, invites, userEmail, onBack, onDone }: { clubId: string; invites: WizardData["invites"]; userEmail: string; onBack: () => void; onDone: (inv: WizardData["invites"]) => void }) {
  const [text, setText] = useState("");
  const [results, setResults] = useState<Array<{ email: string; link: string; sent: boolean }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emails = text.split(/[\s,;]+/).filter(Boolean);
    if (!emails.length) return onDoneAll();
    start(async () => {
      const r = await inviteAdminsAction(clubId, emails);
      if (!r.ok) return setError(r.error);
      setResults(r.invites);
      setText("");
    });
  };
  const onDoneAll = () =>
    start(async () => {
      await skipStepAction(clubId, 6);
      onDone([...invites, ...results.map((r) => ({ email: r.email, role: "admin", accepted_at: null }))]);
    });

  return (
    <form onSubmit={submit}>
      <StepShell eyebrow="Step 6" title="Other admins" lead={`You're signed in as ${userEmail}. Add the other people who run the club and they get their own login with the same access. Coaches and parents get added from the app later.`}>
        {invites.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {invites.map((i) => (
              <Chip key={i.email} tone={i.accepted_at ? "ok" : "muted"}>
                {i.email} {i.accepted_at ? "· joined" : "· invited"}
              </Chip>
            ))}
          </div>
        )}
        <Field label="Email addresses" htmlFor="emails" hint="One per line, or separated by commas.">
          <textarea id="emails" value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full rounded-[var(--r-md)] border border-line-strong bg-input px-4 py-3 text-[16px] text-ink outline-none focus:border-club" placeholder={"nour@example.com\nabdulla@example.com"} />
        </Field>
        {results.length > 0 && (
          <div className="flex flex-col gap-2">
            {results.map((r) => (
              <div key={r.email} className="flex flex-wrap items-center gap-3 rounded-[var(--r-md)] border border-line bg-elev px-4 py-3">
                <MailCheck className={cn("size-4", r.sent ? "text-ok" : "text-warn")} />
                <span className="text-[14px] font-semibold text-ink">{r.email}</span>
                <span className="text-[12.5px] text-ink-muted">{r.sent ? "Email sent." : "Email isn't set up yet, so send them this link:"}</span>
                <CopyButton value={r.link} label="Copy invite link" className="ml-auto" />
              </div>
            ))}
          </div>
        )}
        {error && (
          <Banner tone="danger">
            <span>{error}</span>
          </Banner>
        )}
        <Nav
          onBack={onBack}
          pending={pending}
          next={text.trim() ? "Send invites" : "Continue"}
          skip={results.length || !text.trim() ? undefined : onDoneAll}
          extra={results.length > 0 && !text.trim() ? undefined : undefined}
        />
        {results.length > 0 && (
          <Button type="button" variant="secondary" onClick={onDoneAll} className="self-end">
            Done inviting
          </Button>
        )}
      </StepShell>
    </form>
  );
}

function CopyButton({ value, label = "Copy", className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      icon={done ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? "Copied" : label}
    </Button>
  );
}

/* ----------------------------------------------------------------------- */

function StepLive({
  club,
  sportName,
  venues,
  season,
  divisions,
  invites,
  onBack,
}: {
  club: NonNullable<WizardData["club"]>;
  sportName: string;
  venues: WizardData["venues"];
  season: WizardData["season"];
  divisions: Division[];
  invites: WizardData["invites"];
  onBack: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/c/${club.slug}/register`;

  const rows: Array<[string, React.ReactNode]> = [
    ["Club", `${club.name} · ${sportName}`],
    ["Venues", venues.length ? venues.map((v) => v.name).join(", ") : "None yet"],
    ["Season", season ? `${season.name} · ${divisions.map((d) => d.name).join(", ") || "no age groups"}` : "Not set"],
    ["Fee", season?.fee_cents ? `${money(season.fee_cents, { compact: true })} ${season.fee_label ?? ""}` : "To be confirmed"],
    ["Admins", invites.length ? `You + ${invites.length} invited` : "Just you"],
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await goLiveAction(club.id);
          if (r && !r.ok) setError(r.error);
        });
      }}
    >
      <StepShell eyebrow="Step 7" title="Go live" lead="Check the summary. When you go live, the registration link works and the club page is public. Your 30-day trial starts now; no card needed.">
        <ClubTheme colours={club.colours}>
          <div className="club-glow flex items-center gap-4 rounded-[var(--r-lg)] border border-line bg-elev p-5">
            <ClubMark name={club.name} src={logoUrl(club.logo_path)} size={56} />
            <div className="min-w-0">
              <p className="display truncate text-[22px] text-ink">{club.name}</p>
              <p className="text-[12.5px] text-ink-muted">
                {[club.suburb, club.state].filter(Boolean).join(", ") || sportName}
              </p>
            </div>
          </div>
        </ClubTheme>
        <dl className="divide-y divide-line rounded-[var(--r-lg)] border border-line bg-elev">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] gap-3 px-5 py-3.5">
              <dt className="eyebrow pt-0.5">{k}</dt>
              <dd className="text-[14px] text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--r-lg)] border border-club/40 bg-club/10 p-4">
          <Link2 className="size-4 text-club" />
          <code className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{link}</code>
          <CopyButton value={link} label="Copy link" />
        </div>
        {error && (
          <Banner tone="danger">
            <span>{error}</span>
          </Banner>
        )}
        <Nav onBack={onBack} pending={pending} next="Go live" />
      </StepShell>
    </form>
  );
}
