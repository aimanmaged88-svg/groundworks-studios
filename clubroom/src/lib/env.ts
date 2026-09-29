/** Reads a required environment variable and fails loudly when it is missing. */
export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const publicEnv = {
  supabaseUrl: () => env("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  appUrl: () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
