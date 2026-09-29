import { ButtonLink } from "@/components/ui/button";

/** Shown in place of the sign-in and sign-up forms until the database is connected. */
export function NotConnected({ title }: { title: string }) {
  return (
    <div className="rise rule-top pt-4">
      <h1 className="display text-[44px] text-ink">{title}</h1>
      <p className="eyebrow mt-3">Opening soon</p>
      <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">
        Logins aren&rsquo;t open yet. Have a look at the registration page and members list in your club&rsquo;s colours, leave your details there, and we&rsquo;ll be in touch when your club can go live.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <ButtonLink href="/preview" size="lg">
          See it in your colours
        </ButtonLink>
        <ButtonLink href="/" variant="ghost" size="md">
          Back to the home page
        </ButtonLink>
      </div>
    </div>
  );
}
