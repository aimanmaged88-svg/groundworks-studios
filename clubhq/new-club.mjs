#!/usr/bin/env node
// ClubHQ · stamp a new club from the template.
//
//   node new-club.mjs clubs/<slug>/club.config.json
//
// Reads the config, fills every {{TOKEN}} in template/, and writes a complete
// deployable club into clubs/<slug>/:
//
//   staff/index.html                 → deploy to the club's staff host
//   family/index.html + sw.js + manifest.webmanifest → the family host
//   supabase/setup.sql               → run once in a fresh Supabase project
//   supabase/functions/*/index.ts    → deploy with `supabase functions deploy`
//
// Drop the club's logo.png, favicon.png and icon-192.png into
// clubs/<slug>/assets/ before running and they're copied into both apps.

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const TPL = join(ROOT, "template");

const configPath = process.argv[2];
if (!configPath) { console.error("usage: node new-club.mjs clubs/<slug>/club.config.json"); process.exit(1); }
const cfg = JSON.parse(readFileSync(resolve(configPath), "utf8"));

// ---------- defaults ----------
const DEF = {
  hq: (cfg.short || "Club") + " HQ",
  tagline: "More than a game.",
  emoji: "🏅",
  tz: "Australia/Sydney",
  locale: "en-AU",
  currency: "$",
  cc: "61",
  lat: -33.87, lon: 151.21,
  scoreWord: "points", scoreAbbr: "pts",
  area: "court", areaShort: "ct",
  scoresheet: "score",
  film: { name: "", urlHint: "https://…" },
  check: { abbr: "WWCC", name: "Working With Children Check", authority: "the Office of the Children's Guardian", placeholder: "WWC1234567E" },
  ageGroups: [
    { label: "U12", maxAge: 11 }, { label: "U14", maxAge: 13 },
    { label: "U16", maxAge: 15 }, { label: "U18", maxAge: 17 },
    { label: "Open", maxAge: 999 },
  ],
  prayerLabel: "Maghrib",
  greet: "Hi", greetLong: "Hi", thanks: "Thank you",
  chatEmptyStaff: "Say hello.", chatEmptyFamily: "Say hello 👋",
  hashtag: "", taskOwners: ["Admin"],
  defaultComp: "Local competition", defaultFee: 0,
  dateOrder: "dmy",
  colors: {
    accent: "#FF8A1E", accent2: "#E36F00", accentInk: "#1A0C00", bg: "#0B0A08",
    lightAccent: "#C35803", lightAccent2: "#A34700", lightBg: "#F5F2EC",
  },
  contactName: "", clubBase: "", minRoster: 7, minGame: 5, prayerDefault: false,
};
const club = { ...DEF, ...cfg, film: { ...DEF.film, ...(cfg.film || {}) }, check: { ...DEF.check, ...(cfg.check || {}) }, colors: { ...DEF.colors, ...(cfg.colors || {}) } };

const required = ["slug", "name", "short", "staffUrl", "familyUrl", "supabaseUrl", "supabaseKey", "clubEmail", "clubPhone", "wa"];
const missing = required.filter(k => !club[k]);
if (missing.length) { console.error("config is missing: " + missing.join(", ")); process.exit(1); }

const hexToRgb = h => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  if (!m) { console.error("bad hex colour: " + h); process.exit(1); }
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

// The slice of config both apps carry at runtime.
const CLIENT_KEYS = ["slug","name","short","hq","tagline","emoji","staffUrl","familyUrl","supabaseUrl","supabaseKey",
  "tz","locale","currency","cc","wa","lat","lon","scoreWord","scoreAbbr","area","areaShort","scoresheet","film","check",
  "ageGroups","prayerLabel","greet","greetLong","thanks","chatEmptyStaff","chatEmptyFamily","hashtag","taskOwners",
  "defaultComp","defaultFee","dateOrder"];
const clientConfig = Object.fromEntries(CLIENT_KEYS.map(k => [k, club[k]]));

const TOKENS = {
  CLUB_JSON: JSON.stringify(clientConfig, null, 2),
  CLUB_NAME: club.name,
  CLUB_SHORT: club.short,
  CLUB_SLUG: club.slug,
  LOCALE: club.locale,
  FAMILY_URL: club.familyUrl,
  FAMILY_HOST: club.familyUrl.replace(/^https?:\/\//, ""),
  STAFF_URL: club.staffUrl,
  STAFF_HOST: club.staffUrl.replace(/^https?:\/\//, ""),
  C_BG: club.colors.bg,
  C_ACCENT: club.colors.accent,
  C_ACCENT_2: club.colors.accent2,
  C_ACCENT_INK: club.colors.accentInk,
  C_ACCENT_RGB: hexToRgb(club.colors.accent),
  C_LIGHT_BG: club.colors.lightBg,
  C_LIGHT_ACCENT: club.colors.lightAccent,
  C_LIGHT_ACCENT_2: club.colors.lightAccent2,
  C_LIGHT_ACCENT_RGB: hexToRgb(club.colors.lightAccent),
  CONTACT_NAME: (club.contactName || "").replace(/'/g, "''"),
  CLUB_EMAIL: club.clubEmail,
  CLUB_PHONE: club.clubPhone,
  CLUB_BASE: (club.clubBase || "").replace(/'/g, "''"),
  MIN_ROSTER: String(club.minRoster),
  MIN_GAME: String(club.minGame),
  PRAYER_DEFAULT: String(!!club.prayerDefault),
  PLAYER_EMAIL_DOMAIN: club.playerEmailDomain || `players.${club.slug}.clubhq.app`,
};

const stamp = text => {
  const out = text.replace(/\{\{([A-Z_0-9]+)\}\}/g, (all, k) => {
    if (!(k in TOKENS)) { console.error("no value for token " + all); process.exit(1); }
    return TOKENS[k];
  });
  return out;
};

const outDir = join(ROOT, "clubs", club.slug);
const files = [
  ["staff/index.html", "staff/index.html"],
  ["family/index.html", "family/index.html"],
  ["family/sw.js", "family/sw.js"],
  ["family/manifest.webmanifest", "family/manifest.webmanifest"],
  ["supabase/setup.sql", "supabase/setup.sql"],
  ["supabase/functions/activate/index.ts", "supabase/functions/activate/index.ts"],
  ["supabase/functions/kid-login/index.ts", "supabase/functions/kid-login/index.ts"],
  ["supabase/functions/join/index.ts", "supabase/functions/join/index.ts"],
  ["supabase/functions/setup/index.ts", "supabase/functions/setup/index.ts"],
  ["supabase/functions/register/index.ts", "supabase/functions/register/index.ts"],
];
for (const [src, dst] of files) {
  const target = join(outDir, dst);
  mkdirSync(dirname(target), { recursive: true });
  const stamped = stamp(readFileSync(join(TPL, src), "utf8"));
  const leftover = stamped.match(/\{\{[A-Z_0-9]+\}\}/);
  if (leftover) { console.error(`unstamped token ${leftover[0]} in ${dst}`); process.exit(1); }
  writeFileSync(target, stamped);
  console.log("wrote " + join("clubs", club.slug, dst));
}

// Logo assets: drop them in clubs/<slug>/assets/ and they land in both apps.
const assetsDir = join(outDir, "assets");
const wanted = ["logo.png", "favicon.png", "icon-192.png"];
if (existsSync(assetsDir)) {
  const have = readdirSync(assetsDir);
  for (const app of ["staff", "family"]) {
    for (const f of wanted) {
      if (have.includes(f)) cpSync(join(assetsDir, f), join(outDir, app, f));
    }
  }
  const short = wanted.filter(f => !have.includes(f));
  if (short.length) console.log("still needed in assets/: " + short.join(", "));
  else console.log("assets copied into staff/ and family/");
} else {
  console.log(`no ${join("clubs", club.slug, "assets")} folder — add logo.png, favicon.png and icon-192.png there and rerun, or copy them into staff/ and family/ by hand.`);
}

console.log(`\n${club.name} is stamped. Next steps:
  1. New Supabase project → SQL editor → run clubs/${club.slug}/supabase/setup.sql
  2. supabase functions deploy (activate, kid-login, join, setup, register) with --no-verify-jwt
  3. Put the project URL + publishable key in club.config.json and rerun if they changed
  4. Deploy clubs/${club.slug}/staff → ${club.staffUrl}
     Deploy clubs/${club.slug}/family → ${club.familyUrl}
  5. In the SQL editor: select create_activation_code('admin', null, '<your email>');
     then sign in at the staff app with "I have a code".`);
