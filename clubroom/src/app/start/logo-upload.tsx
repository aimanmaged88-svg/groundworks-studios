"use client";

import { ImagePlus, LoaderCircle, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { extractPalette } from "@/lib/colours";
import { createClient } from "@/lib/supabase/browser";
import { logoUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

/**
 * Uploads the club logo straight to Storage from the browser (the storage
 * policy only lets club admins write under their club's folder) and pulls a
 * palette out of it.
 */
export function LogoUpload({
  clubId,
  clubName,
  value,
  onChange,
}: {
  clubId: string;
  clubName: string;
  value: string | null;
  onChange: (path: string | null, palette: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(logoUrl(value));
  const input = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return setError("Use a PNG, JPG, WebP or SVG.");
    if (file.size > 2 * 1024 * 1024) return setError("Keep the logo under 2 MB.");
    setBusy(true);
    try {
      const localUrl = URL.createObjectURL(file);
      const palette = await new Promise<string[]>((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            resolve(extractPalette(img, 5));
          } catch {
            resolve([]);
          }
        };
        img.onerror = () => resolve([]);
        img.src = localUrl;
      });
      const ext = file.type === "image/svg+xml" ? "svg" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${clubId}/logo-${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from("club-logos").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (upErr) throw upErr;
      setPreview(localUrl);
      onChange(path, palette);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={cn(
          "flex items-center gap-4 rounded-[var(--r-lg)] border border-dashed border-line-strong bg-input p-4 text-left transition-colors hover:border-club",
          busy && "pointer-events-none opacity-70",
        )}
      >
        <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-elev2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={clubName} className="size-full object-cover" />
          ) : busy ? (
            <LoaderCircle className="size-6 animate-[spin_0.8s_linear_infinite] text-ink-muted" />
          ) : (
            <ImagePlus className="size-6 text-ink-muted" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-[14.5px] font-bold text-ink">{preview ? "Change logo" : "Add your logo"}</span>
          <span className="mt-0.5 block text-[12.5px] text-ink-muted">PNG, JPG or SVG, under 2 MB. A square one on a plain or transparent background looks best. We&rsquo;ll pull your colours from it.</span>
        </span>
        {preview && <RefreshCw className="ml-auto size-4 shrink-0 text-ink-dim" />}
      </button>
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}
