export const THEME_COOKIE = "cr_theme";
export type Theme = "dark" | "light";

export function isTheme(v: unknown): v is Theme {
  return v === "dark" || v === "light";
}
