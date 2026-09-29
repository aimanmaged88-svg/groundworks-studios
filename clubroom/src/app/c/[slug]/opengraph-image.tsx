import { ImageResponse } from "next/og";
import { getPublicClub } from "@/lib/public-club";
import { logoUrl } from "@/lib/storage";

export const alt = "Club registration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicClub(slug);
  const club = data?.club;
  const season = data?.season;
  const primary = club?.colours.primary ?? "#f2b705";
  const onPrimary = club?.colours.on_primary ?? "#14120a";
  const logo = logoUrl(club?.logo_path);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: `linear-gradient(160deg, #0b0c10 0%, #14161c 60%, ${primary}33 100%)`,
          color: "#f4f4f6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {logo ? (
            <img src={logo} width={128} height={128} style={{ borderRadius: 999, objectFit: "cover" }} alt="" />
          ) : (
            <div style={{ width: 128, height: 128, borderRadius: 999, background: primary, color: onPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, fontWeight: 800 }}>
              {(club?.name ?? "C").slice(0, 1)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 64, fontWeight: 800, textTransform: "uppercase", letterSpacing: -1, lineHeight: 1 }}>{club?.name ?? "Clubroom"}</div>
            {club?.suburb && <div style={{ marginTop: 14, fontSize: 26, color: "#a4a8b3", letterSpacing: 4, textTransform: "uppercase" }}>{[club.suburb, club.state].filter(Boolean).join(", ")}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 44, fontWeight: 800 }}>{season?.registration_open ? "Registrations open" : club?.name}</div>
            {season && <div style={{ marginTop: 8, fontSize: 28, color: "#a4a8b3" }}>{season.name}</div>}
          </div>
          <div style={{ background: primary, color: onPrimary, borderRadius: 999, padding: "22px 44px", fontSize: 30, fontWeight: 800 }}>Register</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
