/** Colour helpers shared by the wizard, the preview builder and the app shell. */

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Text colour that reads on a given background. */
export function onColour(hex: string): "#0b0c10" | "#ffffff" {
  return contrastRatio(hex, "#0b0c10") >= contrastRatio(hex, "#ffffff") ? "#0b0c10" : "#ffffff";
}

export function isHex(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
}

function saturation(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function distance(a: [number, number, number], b: [number, number, number]) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

/**
 * Pulls the dominant colours out of an image (browser only). Ignores
 * transparent, near-white and near-black pixels, prefers saturated colours,
 * and returns up to `max` visually distinct hex values, most common first.
 */
export function extractPalette(img: HTMLImageElement, max = 5): string[] {
  const size = 72;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const bins = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 140) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (min > 232 || max < 28) continue; // near white / near black
    if (saturation(r, g, b) < 0.22 && max - min < 34) continue; // grey
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bin = bins.get(key);
    if (bin) {
      bin.r += r;
      bin.g += g;
      bin.b += b;
      bin.n += 1;
    } else bins.set(key, { r, g, b, n: 1 });
  }

  // Rank by area, weighted towards vivid colours: a big dark navy ring should
  // not beat the bright orange it surrounds.
  const ranked = [...bins.values()]
    .map((bn) => ({ rgb: [bn.r / bn.n, bn.g / bn.n, bn.b / bn.n] as [number, number, number], n: bn.n }))
    .map((c) => {
      const vividness = saturation(...c.rgb) * (Math.max(...c.rgb) / 255);
      return { ...c, score: c.n * (0.1 + Math.pow(vividness, 1.5) * 4) };
    })
    .sort((a, b) => b.score - a.score);

  const picked: [number, number, number][] = [];
  for (const c of ranked) {
    if (picked.every((p) => distance(p, c.rgb) > 64)) picked.push(c.rgb);
    if (picked.length >= max) break;
  }
  return picked.map((p) => rgbToHex(p[0], p[1], p[2]));
}

/** Nudges a colour so the club's primary still reads on the dark theme. */
export function ensureVisibleOnDark(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  let [r, g, b] = rgb;
  let guard = 0;
  while (contrastRatio(rgbToHex(r, g, b), "#0b0c10") < 2.4 && guard++ < 12) {
    r = r + (255 - r) * 0.14;
    g = g + (255 - g) * 0.14;
    b = b + (255 - b) * 0.14;
  }
  return rgbToHex(r, g, b);
}
