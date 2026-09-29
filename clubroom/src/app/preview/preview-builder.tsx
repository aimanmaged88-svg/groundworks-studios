"use client";

import { ArrowRight, Check, ImagePlus, Link2, MapPin, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClubMark, ClubTheme } from "@/components/club-mark";
import { Button, ButtonLink } from "@/components/ui/button";
import { Banner, Chip } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ensureVisibleOnDark, extractPalette, isHex, onColour } from "@/lib/colours";
import { cn } from "@/lib/utils";

type Initial = { name: string; handle: string; suburb: string; sport: string; primary: string; accent: string; logo: string };
const PRESETS = ["#1f6feb", "#e0362c", "#0f9d58", "#f2b705", "#7c3aed", "#ff6b00", "#00a3a3", "#111111"];

export function PreviewBuilder({ sports, initial }: { sports: Array<{ key: string; name: string }>; initial: Initial }) {
  const [name, setName] = useState(initial.name);
  const [handle, setHandle] = useState(initial.handle.replace(/^@/, ""));
  const [suburb, setSuburb] = useState(initial.suburb);
  const [sport, setSport] = useState(initial.sport || "basketball");
  const [primary, setPrimary] = useState(isHex(initial.primary) ? initial.primary : "#f2b705");
  const [accent, setAccent] = useState(isHex(initial.accent) ? initial.accent : "#1d2026");
  const [logo, setLogo] = useState<string | null>(initial.logo || null);
  const [logoFetchable, setLogoFetchable] = useState(!!initial.logo);
  const [palette, setPalette] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const displayName = name.trim() || "Your Club";
  const onPrimary = useMemo(() => (isHex(primary) ? onColour(primary) : "#0b0c10"), [primary]);
  const colours = { primary, accent, on_primary: onPrimary };

  async function paletteFrom(src: string, crossOrigin = false) {
    return new Promise<string[]>((resolve) => {
      const img = new Image();
      if (crossOrigin) img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          resolve(extractPalette(img, 5));
        } catch {
          resolve([]);
        }
      };
      img.onerror = () => resolve([]);
      img.src = src;
    });
  }

  async function applyPalette(pal: string[]) {
    setPalette(pal);
    if (pal[0]) setPrimary(ensureVisibleOnDark(pal[0]));
    if (pal[1]) setAccent(ensureVisibleOnDark(pal[1]));
  }

  async function onFile(file: File) {
    const url = URL.createObjectURL(file);
    setLogo(url);
    setLogoFetchable(false);
    setNote(null);
    applyPalette(await paletteFrom(url));
  }

  // Best effort: pull the profile picture by handle. Instagram doesn't support this officially,
  // so it can fail; the upload is the reliable path.
  async function fetchFromInstagram() {
    const h = handle.trim().replace(/^@/, "");
    if (!h) return;
    setFetching(true);
    setNote(null);
    const src = `https://unavatar.io/instagram/${encodeURIComponent(h)}?fallback=false`;
    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
    if (!ok) {
      setNote("Couldn't pull the picture from Instagram this time. Upload the logo instead; it takes ten seconds.");
      setFetching(false);
      return;
    }
    setLogo(src);
    setLogoFetchable(true);
    const pal = await paletteFrom(src, true);
    if (pal.length) applyPalette(pal);
    else setNote("Got the picture. Pick the main colour by hand: the browser wouldn't let us read the pixels.");
    setFetching(false);
  }

  useEffect(() => {
    if (initial.logo) {
      paletteFrom(initial.logo, true).then((pal) => {
        if (pal.length) applyPalette(pal);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Relative on purpose: the origin is added when copied, so server and client render the same thing.
  const shareUrl = `/preview?${new URLSearchParams({ name, handle, suburb, sport, primary, accent, ...(logoFetchable && logo ? { logo } : {}) }).toString()}`;
  const signUpUrl = `/sign-up?next=${encodeURIComponent(`/start?${new URLSearchParams({ name, sport, suburb, primary, accent }).toString()}`)}`;

  return (
    <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
      {/* Controls */}
      <div className="flex flex-col gap-5">
        <Field label="Club name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bankstown Bullets" autoFocus />
        </Field>
        <Field label="Instagram">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center overflow-hidden rounded-[var(--r-md)] border border-line-strong bg-input focus-within:border-club">
              <span className="pl-4 text-ink-dim">@</span>
              <input value={handle} onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))} className="w-full bg-transparent py-3 pl-1 pr-3 text-[16px] text-ink outline-none" placeholder="yourclub" />
            </div>
            <Button type="button" variant="secondary" onClick={fetchFromInstagram} loading={fetching} disabled={!handle.trim()}>
              Grab logo
            </Button>
          </div>
        </Field>
        <div className="grid grid-cols-[1fr_140px] gap-3">
          <Field label="Suburb">
            <Input value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="Bankstown" />
          </Field>
          <Field label="Sport">
            <Select value={sport} onChange={(e) => setSport(e.target.value)}>
              {sports.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div>
          <p className="eyebrow mb-2">Logo</p>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <button type="button" onClick={() => fileInput.current?.click()} className="flex w-full items-center gap-3 rounded-[var(--r-md)] border border-dashed border-line-strong bg-input p-3 text-left hover:border-club">
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-elev2">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-5 text-ink-dim" />
              )}
            </span>
            <span className="text-[13px] text-ink-muted">{logo ? "Change the logo" : "Upload the logo (PNG or JPG). We pull the colours from it."}</span>
          </button>
          {note && <p className="mt-2 text-[12.5px] text-warn">{note}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Main colour">
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...palette, ...PRESETS])].slice(0, 10).map((c) => (
                <button key={c} type="button" aria-label={c} onClick={() => setPrimary(c)} className={cn("size-7 rounded-full border-2", primary.toLowerCase() === c.toLowerCase() ? "border-ink" : "border-transparent")} style={{ background: c }} />
              ))}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={isHex(primary) ? primary : "#000000"} onChange={(e) => setPrimary(e.target.value)} className="size-10 cursor-pointer rounded-[8px] border border-line-strong bg-input p-1" aria-label="Main colour picker" />
              <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="py-2 font-mono text-[13px] uppercase" maxLength={7} />
            </div>
          </Field>
          <Field label="Second colour">
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...palette, ...PRESETS])].slice(0, 10).map((c) => (
                <button key={c} type="button" aria-label={c} onClick={() => setAccent(c)} className={cn("size-7 rounded-full border-2", accent.toLowerCase() === c.toLowerCase() ? "border-ink" : "border-transparent")} style={{ background: c }} />
              ))}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={isHex(accent) ? accent : "#000000"} onChange={(e) => setAccent(e.target.value)} className="size-10 cursor-pointer rounded-[8px] border border-line-strong bg-input p-1" aria-label="Second colour picker" />
              <Input value={accent} onChange={(e) => setAccent(e.target.value)} className="py-2 font-mono text-[13px] uppercase" maxLength={7} />
            </div>
          </Field>
        </div>

        <div className="hairline flex flex-col gap-3 pt-5">
          <ButtonLink href={signUpUrl} size="lg" icon={<ArrowRight className="size-4" />}>
            Start with these colours
          </ButtonLink>
          <ShareLink url={shareUrl} />
        </div>

        <LeadForm club={{ name, handle, suburb, sport, primary, accent, logo: logoFetchable ? logo : null }} />
      </div>

      {/* Screens */}
      <ClubTheme colours={colours}>
        <div data-theme="dark" className="rounded-[var(--r-xl)] bg-bg p-4 text-ink md:p-6" style={{ colorScheme: "dark" }}>
          <div className="mb-3 flex items-center gap-2">
            <Chip tone="warn">Sample numbers</Chip>
            <span className="text-[12px] text-ink-dim">Your name and colours, made-up data.</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Phone>
              <div className="band px-4 pb-6 pt-5">
                <ClubMark name={displayName} src={logo} size={52} />
                <p className="display mt-3 text-[26px] leading-[0.94]">{displayName}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">{[suburb || "Your suburb", "Summer 2026/27"].join(" · ")}</p>
              </div>
              <div className="px-4 pt-5">
                <p className="eyebrow">Registrations open</p>
                <p className="display mt-1 text-[22px] text-ink">Come and play</p>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">Sign your child up with {displayName}. The form takes about three minutes.</p>
                <span className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[var(--r-md)] bg-club text-[12px] font-bold uppercase tracking-[0.06em] text-on-club">Register</span>
                <div className="rule-top mt-5 grid grid-cols-[70px_1fr] gap-3 py-3 text-[12px]">
                  <span className="eyebrow">Ages</span>
                  <span className="display text-[15px] text-ink">U10 to U18</span>
                  <span className="eyebrow">Fee</span>
                  <span className="display text-[15px] text-ink">$180</span>
                </div>
              </div>
            </Phone>

            <Phone>
              <div className="band flex items-center gap-3 px-4 py-3">
                <ClubMark name={displayName} src={logo} size={34} />
                <div className="min-w-0">
                  <p className="display text-[18px]">Register</p>
                  <p className="truncate text-[9.5px] font-bold uppercase tracking-[0.14em] opacity-80">{displayName}</p>
                </div>
              </div>
              <div className="px-4 pt-4">
                <div className="rule-top flex items-baseline gap-2 pt-2">
                  <span className="numeral text-[14px] text-club">01</span>
                  <span className="display text-[17px] text-ink">The player</span>
                </div>
                {["Player first name", "Date of birth", "Gender"].map((l) => (
                  <div key={l} className="mt-3">
                    <p className="eyebrow">{l}</p>
                    <div className="mt-1 h-10 rounded-[var(--r-md)] border border-line-strong bg-input" />
                  </div>
                ))}
                <p className="mt-2 text-[10.5px] text-ink-dim">That puts them in U12 for Summer 2026/27.</p>
              </div>
            </Phone>

            <Phone>
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <ClubMark name={displayName} src={logo} size={28} />
                <span className="display truncate text-[13px] text-ink">{displayName}</span>
              </div>
              <div className="px-4 pt-4">
                <p className="eyebrow">Summer 2026/27</p>
                <p className="display mt-1 text-[22px] text-ink">Members</p>
                <div className="scoreboard mt-3 !grid-cols-2">
                  {[
                    ["68", "Players", "text-club"],
                    ["12", "Owing", "text-warn"],
                    ["5", "Medical notes", "text-ink"],
                    ["3", "This week", "text-ink"],
                  ].map(([v, l, c]) => (
                    <div key={l}>
                      <span className={cn("numeral text-[26px]", c)}>{v}</span>
                      <span className="eyebrow block">{l}</span>
                    </div>
                  ))}
                </div>
                <ul className="mt-2 text-[12px]">
                  {["Zara D.", "Kai D.", "Amira D."].map((n, i) => (
                    <li key={n} className="flex items-center justify-between border-b border-line py-2">
                      <span className="font-bold text-ink">{n}</span>
                      <Chip tone="muted">{["U12", "U14", "U10"][i]}</Chip>
                    </li>
                  ))}
                </ul>
              </div>
            </Phone>

            <Phone>
              <div className="band px-4 pb-5 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">This Friday</p>
                <p className="display mt-1 text-[24px] leading-[0.94]">
                  {displayName.split(" ")[0]} U12
                  <br />v Sample City
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] opacity-90">
                  <MapPin className="size-3" /> 5:40pm · Court 2
                </p>
              </div>
              <div className="px-4 pt-4">
                <div className="flex gap-2">
                  <span className="inline-flex h-9 flex-1 items-center justify-center rounded-[var(--r-md)] bg-ink text-[10px] font-bold uppercase tracking-[0.04em] text-bg">I&rsquo;m in</span>
                  <span className="inline-flex h-9 flex-1 items-center justify-center rounded-[var(--r-md)] border border-line-strong px-1 text-center text-[10px] font-bold uppercase tracking-[0.04em] leading-none text-ink">Can&rsquo;t make it</span>
                </div>
                <div className="rule-top mt-5 pt-3">
                  <p className="eyebrow">Zara&rsquo;s level</p>
                  <p className="display mt-1 text-[20px] text-ink">
                    Hooper <span className="text-ink-dim">· 14 sessions</span>
                  </p>
                  <div className="mt-2 h-1.5 w-full bg-line">
                    <div className="h-1.5 w-[20%] bg-club" />
                  </div>
                  <p className="mt-1 text-[10.5px] text-ink-dim">8 more to reach Bucket. Earned by turning up, never by ranking.</p>
                </div>
              </div>
            </Phone>
          </div>
        </div>
      </ClubTheme>
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return <div className="aspect-[9/17] overflow-hidden rounded-[22px] border border-line-strong bg-bg">{children}</div>;
}

function ShareLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  if (!url) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}${url}`);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.06em] text-ink-muted hover:text-ink"
    >
      {done ? <Check className="size-4 text-ok" /> : <Link2 className="size-4" />} {done ? "Link copied" : "Copy a link to this preview"}
    </button>
  );
}

function LeadForm({ club }: { club: { name: string; handle: string; suburb: string; sport: string; primary: string; accent: string; logo: string | null } }) {
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", mobile: "", message: "" });
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  if (state === "sent") {
    return (
      <Banner tone="ok">
        <b>Got it.</b> Aiman will be in touch, usually the same day.
      </Banner>
    );
  }
  return (
    <div className="hairline pt-5">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.06em] text-club">
          <Send className="size-4" /> Not the one who sets things up? Send this to us and we&rsquo;ll set it up with you
        </button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setState("busy");
            setError(null);
            const res = await fetch("/api/leads", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ club_name: club.name || "Unnamed club", sport_key: club.sport, suburb: club.suburb, instagram: club.handle, contact_name: contact.name, email: contact.email, mobile: contact.mobile, colours: { primary: club.primary, accent: club.accent }, logo_url: club.logo ?? "", message: contact.message, website: (document.getElementById("lead_website") as HTMLInputElement | null)?.value ?? "" }),
            });
            const json = (await res.json()) as { ok: boolean; error?: string };
            if (!json.ok) {
              setError(json.error ?? "Something went wrong.");
              setState("error");
              return;
            }
            setState("sent");
          }}
          className="flex flex-col gap-3"
        >
          <p className="text-[13px] text-ink-muted">Leave a name and one way to reach you. We set the club up on a call, in about twenty minutes.</p>
          <div className="absolute left-[-9999px]" aria-hidden="true">
            <input id="lead_website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <Input placeholder="Your name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="email" placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            <Input type="tel" placeholder="Mobile" value={contact.mobile} onChange={(e) => setContact({ ...contact, mobile: e.target.value })} />
          </div>
          <Textarea placeholder="Anything we should know (optional)" value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} rows={2} />
          {error && <p className="text-[12.5px] text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" loading={state === "busy"} icon={<Send className="size-4" />}>
              Send
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
