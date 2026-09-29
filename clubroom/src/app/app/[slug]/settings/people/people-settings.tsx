"use client";

import { useRouter } from "next/navigation";
import { Check, Copy, MailCheck, Trash2, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Banner, Chip, SectionHead } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { fmtDate } from "@/lib/utils";
import { inviteAction, removeMemberAction, revokeInviteAction } from "../actions";

type Member = { id: string; user_id: string; role: "admin" | "coach"; email: string; name: string };
type Invite = { id: string; email: string; role: string; expires_at: string };

export function PeopleSettings({ slug, me, members, invites }: { slug: string; me: string; members: Member[]; invites: Invite[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "coach">("coach");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [result, setResult] = useState<{ link: string; sent: boolean; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const invite = () =>
    start(async () => {
      setError(null);
      setResult(null);
      const r = await inviteAction(slug, { email, role, first_name: first, last_name: last });
      if (!r.ok) return setError(r.error);
      setResult({ link: r.link, sent: r.sent, email });
      setEmail("");
      setFirst("");
      setLast("");
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionHead title="Invite someone" number="01" sub="Admins see everything. Coaches see their own teams, roll call and their players' medical details, nothing else." />
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px]">
          <Field label="Email" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="coach@example.com" />
          </Field>
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value as "admin" | "coach")}>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          {role === "coach" && (
            <>
              <Field label="First name" hint="So they can be put on a team before they log in.">
                <Input value={first} onChange={(e) => setFirst(e.target.value)} />
              </Field>
              <Field label="Last name">
                <Input value={last} onChange={(e) => setLast(e.target.value)} />
              </Field>
            </>
          )}
        </div>
        {error && (
          <Banner tone="danger" className="mt-3">
            <span>{error}</span>
          </Banner>
        )}
        {result && (
          <Banner tone={result.sent ? "ok" : "warn"} className="mt-3" icon={<MailCheck className="size-4" />}>
            {result.sent ? `Invite emailed to ${result.email}.` : `Email isn't connected yet, so send ${result.email} this link yourself:`}
            {!result.sent && (
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate text-[12.5px]">{result.link}</code>
                <Button size="sm" variant="secondary" icon={copied ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />} onClick={async () => { await navigator.clipboard.writeText(result.link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                  Copy
                </Button>
              </div>
            )}
          </Banner>
        )}
        <Button className="mt-4" onClick={invite} loading={pending} icon={<UserPlus className="size-4" />} disabled={!email}>
          Send invite
        </Button>
      </section>

      <section>
        <SectionHead title="People with access" number="02" />
        <ul className="mt-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border-b border-line py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-ink">{m.name || m.email}</span>
                {m.name && <span className="block truncate text-[12px] text-ink-muted">{m.email}</span>}
              </span>
              <Chip tone={m.role === "admin" ? "club" : "muted"}>{m.role}</Chip>
              {m.user_id !== me ? (
                <button type="button" aria-label={`Remove ${m.email}`} onClick={() => start(async () => { const r = await removeMemberAction(slug, m.id); if (!r.ok) setError(r.error); router.refresh(); })} className="grid size-8 place-items-center rounded-full text-ink-dim hover:bg-elev2 hover:text-danger">
                  <Trash2 className="size-4" />
                </button>
              ) : (
                <span className="text-[11px] text-ink-dim">you</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {invites.length > 0 && (
        <section>
          <SectionHead title="Waiting to join" number="03" />
          <ul className="mt-2">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 border-b border-line py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-ink">{i.email}</span>
                  <span className="block text-[12px] text-ink-muted">Invite expires {fmtDate(i.expires_at, "long")}</span>
                </span>
                <Chip tone="muted">{i.role}</Chip>
                <button type="button" aria-label={`Revoke invite for ${i.email}`} onClick={() => start(async () => { const r = await revokeInviteAction(slug, i.id); if (!r.ok) setError(r.error); router.refresh(); })} className="grid size-8 place-items-center rounded-full text-ink-dim hover:bg-elev2 hover:text-danger">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
