"use client";

import { ArrowRight, MailCheck } from "lucide-react";
import { useActionState } from "react";
import { signUp, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

export function SignUpForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, undefined);

  if (state?.sent) {
    return (
      <Banner tone="ok" icon={<MailCheck className="size-5 text-ok" />}>
        <b>Check your email.</b> We sent a link to <b>{state.sent}</b>. Open it on this device and you&rsquo;ll land straight in the setup.
      </Banner>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Your name" required htmlFor="full_name">
        <Input id="full_name" name="full_name" autoComplete="name" placeholder="First and last name" required minLength={2} />
      </Field>
      <Field label="Email" required htmlFor="email" hint="This becomes your admin login.">
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@club.org.au" required />
      </Field>
      <Field label="Password" required htmlFor="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      {state?.error && (
        <Banner tone="danger">
          <span>{state.error}</span>
        </Banner>
      )}
      <Button type="submit" size="lg" loading={pending} icon={<ArrowRight className="size-4" />} className="mt-1 w-full">
        Create my login
      </Button>
      <p className="text-center text-[11.5px] leading-relaxed text-ink-dim">By continuing you agree to the Clubroom terms and privacy policy (drafts; legal review pending).</p>
    </form>
  );
}
