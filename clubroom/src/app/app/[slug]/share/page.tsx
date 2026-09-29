import type { Metadata } from "next";
import QRCode from "qrcode";
import { ExternalLink } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getClubContext, requireAdmin } from "@/lib/club";
import { publicEnv } from "@/lib/env";
import { CopyLink } from "../copy-link";

export const metadata: Metadata = { title: "Share" };

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  requireAdmin(ctx);
  const register = `${publicEnv.appUrl()}/c/${ctx.club.slug}/register`;
  const page = `${publicEnv.appUrl()}/c/${ctx.club.slug}`;
  const svg = await QRCode.toString(register, { type: "svg", margin: 1, color: { dark: "#0b0c10", light: "#ffffff" }, errorCorrectionLevel: "M" });
  const waText = encodeURIComponent(`Registrations for ${ctx.club.name}${ctx.season ? ` (${ctx.season.name})` : ""} are open. Sign up here: ${register}`);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="eyebrow">Share</p>
        <h1 className="display mt-1 text-[32px] text-ink">Get the link out</h1>
        <p className="mt-2 text-[14px] text-ink-muted">Same link everywhere: bio, group chat, flyer. Parents open it on their phone and it takes about three minutes.</p>
      </div>

      <Card className="p-5">
        <p className="eyebrow mb-2">Registration form</p>
        <CopyLink value={register} />
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonLink href={`https://wa.me/?text=${waText}`} variant="secondary" size="sm" icon={<WhatsAppIcon className="size-4" />} target="_blank" rel="noreferrer">
            Send on WhatsApp
          </ButtonLink>
          <ButtonLink href={register} variant="outline" size="sm" icon={<ExternalLink className="size-4" />} target="_blank" rel="noreferrer">
            Open the form
          </ButtonLink>
        </div>
      </Card>

      <Card className="p-5">
        <p className="eyebrow mb-2">Club page</p>
        <CopyLink value={page} />
        <p className="mt-2 text-[12.5px] text-ink-muted">Previews properly in WhatsApp and Instagram, with your logo and colours.</p>
      </Card>

      <Card className="flex flex-col items-center gap-4 p-6 sm:flex-row">
        <div data-testid="qr" className="w-44 shrink-0 overflow-hidden rounded-[var(--r-md)] bg-white p-2" dangerouslySetInnerHTML={{ __html: svg }} />
        <div>
          <h3 className="text-[15px] font-bold text-ink">QR code for flyers and the stadium door</h3>
          <p className="mt-1 text-[13px] text-ink-muted">Points at the registration form. Right-click or long-press to save it, or print this page.</p>
          <a href={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} download={`${ctx.club.slug}-register-qr.svg`} className="mt-3 inline-block text-[12.5px] font-bold text-club">
            Download SVG
          </a>
        </div>
      </Card>
    </div>
  );
}
