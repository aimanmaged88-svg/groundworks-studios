import { getClubContext, requireAdmin } from "@/lib/club";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  requireAdmin(ctx);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">{ctx.club.name}</p>
        <h1 className="display mt-1 text-[36px] text-ink md:text-[48px]">Settings</h1>
      </div>
      <SettingsNav slug={slug} />
      <div className="max-w-3xl">{children}</div>
    </div>
  );
}
