"use client";

import { ArrowRight, MailCheck, Wand2 } from "lucide-react";
import { useActionState, useState } from "react";
import { sendMagicLink, signIn, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

export function SignInForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [pwState, pwAction, pwPending] = useActionState<AuthState, FormData>(signIn, undefined);
  const [linkState, linkAction, linkPending] = useActionState<AuthState, FormData>(sendMagicLink, undefined);

  if (linkState?.sent) {
    return (
      <Banner tone="ok" icon={<MailCheck className="size-5 text-ok" />}>
        <b>Check your email.</b> We sent a sign-in link to <b>{linkState.sent}</b>.
      </Banner>
    );
  }

  const state = mode === "password" ? pwState : linkState;

  return (
    <form action={mode === "password" ? pwAction : linkAction} className="flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" required htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@club.org.au" required />
      </Field>
      {mode === "password" && (
        <Field label="Password" required htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
      )}
      {state?.error && (
        <Banner tone="danger">
          <span>{state.error}</span>
        </Banner>
      )}
      <Button type="submit" size="lg" loading={mode === "password" ? pwPending : linkPending} icon={mode === "password" ? <ArrowRight className="size-4" /> : <Wand2 className="size-4" />} className="mt-1 w-full">
        {mode === "password" ? "Sign in" : "Email me a sign-in link"}
      </Button>
      <button type="button" onClick={() => setMode(mode === "password" ? "link" : "password")} className="text-center text-[13px] font-semibold text-ink-muted underline underline-offset-4 hover:text-ink">
        {mode === "password" ? "Forgot your password? Email me a link instead" : "Use a password instead"}
      </button>
    </form>
  );
}
