import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="club-glow flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-6">
        <Link href="/" className="display text-[18px] text-ink">
          Clubroom
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16 pt-8">{children}</main>
    </div>
  );
}
