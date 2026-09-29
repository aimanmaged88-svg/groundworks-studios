"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { LogoUpload } from "@/app/start/logo-upload";
import { Button } from "@/components/ui/button";
import { Banner, SectionHead } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { isHex, onColour } from "@/lib/colours";
import { updateClubAction } from "./actions";

type Values = {
  name: string;
  short_name: string;
  suburb: string;
  state: string;
  contact_email: string;
  contact_phone: string;
  instagram_handle: string;
  website: string;
  primary: string;
  accent: string;
  theme_default: "dark" | "light";
  logo_path: string | null;
  public_page: { headline: string; blurb: string; cta: string; when: string; where: string };
};

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

export function ClubSettingsForm({ slug, clubId, initial }: { slug: string; clubId: string; initial: Values }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const onPrimary = useMemo(() => (isHex(v.primary) ? onColour(v.primary) : "#0b0c10"), [v.primary]);
  const u = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const up = (k: keyof Values["public_page"]) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, public_page: { ...v.public_page, [k]: e.target.value } });

  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await updateClubAction(slug, { ...v, on_primary: onPrimary });
      if (!r.ok) return setMsg({ tone: "danger", text: r.error });
      setMsg({ tone: "ok", text: "Saved." });
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
        <SectionHead title="Club" number="01" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Club name" required>
            <Input value={v.name} onChange={u("name")} />
          </Field>
          <Field label="Short name" hint="For tight spaces, like the app header.">
            <Input value={v.short_name} onChange={u("short_name")} maxLength={24} />
          </Field>
          <Field label="Suburb">
            <Input value={v.suburb} onChange={u("suburb")} />
          </Field>
          <Field label="State">
            <Select value={v.state} onChange={u("state")}>
              <option value="">Select</option>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Contact email" hint="Shown to families who need to reach the club.">
            <Input type="email" value={v.contact_email} onChange={u("contact_email")} />
          </Field>
          <Field label="Contact phone">
            <Input type="tel" value={v.contact_phone} onChange={u("contact_phone")} />
          </Field>
          <Field label="Instagram">
            <Input value={v.instagram_handle} onChange={u("instagram_handle")} placeholder="handle, without the @" />
          </Field>
          <Field label="Website">
            <Input type="url" value={v.website} onChange={u("website")} placeholder="https://" />
          </Field>
        </div>
      </section>

      <section>
        <SectionHead title="Logo and colours" number="02" />
        <div className="mt-4 flex flex-col gap-4">
          <LogoUpload clubId={clubId} clubName={v.name} value={v.logo_path} onChange={(path, pal) => setV({ ...v, logo_path: path, primary: pal[0] ?? v.primary, accent: pal[1] ?? v.accent })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Main colour">
              <div className="flex items-center gap-2">
                <input type="color" value={isHex(v.primary) ? v.primary : "#000000"} onChange={u("primary")} className="size-11 cursor-pointer rounded-[10px] border border-line-strong bg-input p-1" aria-label="Main colour picker" />
                <Input value={v.primary} onChange={u("primary")} className="font-mono uppercase" maxLength={7} />
              </div>
            </Field>
            <Field label="Second colour">
              <div className="flex items-center gap-2">
                <input type="color" value={isHex(v.accent) ? v.accent : "#000000"} onChange={u("accent")} className="size-11 cursor-pointer rounded-[10px] border border-line-strong bg-input p-1" aria-label="Second colour picker" />
                <Input value={v.accent} onChange={u("accent")} className="font-mono uppercase" maxLength={7} />
              </div>
            </Field>
            <Field label="Opens in">
              <Select value={v.theme_default} onChange={u("theme_default")}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </Select>
            </Field>
          </div>
        </div>
      </section>

      <section>
        <SectionHead title="Public page" number="03" sub="What families see at your club link. Leave blank for the defaults." />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Headline" className="sm:col-span-2">
            <Input value={v.public_page.headline} onChange={up("headline")} placeholder="Come and play" />
          </Field>
          <Field label="Blurb" className="sm:col-span-2">
            <Textarea value={v.public_page.blurb} onChange={up("blurb")} rows={3} placeholder="A couple of sentences about the club and the season." />
          </Field>
          <Field label="Button text">
            <Input value={v.public_page.cta} onChange={up("cta")} placeholder="Register" />
          </Field>
          <Field label="When" hint="e.g. Fridays 5–8pm from 10 October">
            <Input value={v.public_page.when} onChange={up("when")} />
          </Field>
          <Field label="Where" hint="e.g. Bankstown Basketball Stadium" className="sm:col-span-2">
            <Input value={v.public_page.where} onChange={up("where")} />
          </Field>
        </div>
      </section>

      <div className="flex gap-3">
        <Button onClick={save} loading={pending} size="lg">
          Save changes
        </Button>
      </div>
    </div>
  );
}
