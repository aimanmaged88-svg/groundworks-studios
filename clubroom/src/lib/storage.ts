/** Public URL for an object in a public bucket, or null. */
export function publicObjectUrl(bucket: "club-logos" | "club-media", path: string | null | undefined) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export function logoUrl(path: string | null | undefined) {
  return publicObjectUrl("club-logos", path);
}
