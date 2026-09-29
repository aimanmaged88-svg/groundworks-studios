"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyLink({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-[var(--r-md)] border border-line bg-input py-1.5 pl-3.5 pr-1.5">
      <code className="min-w-0 flex-1 truncate text-[13px] text-ink">{value}</code>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        icon={done ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />}
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }}
      >
        {done ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
