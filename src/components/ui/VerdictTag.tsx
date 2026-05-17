import { cn } from "@/lib/cn";
import type { VerdictKind } from "@/types/database";

interface VerdictTagProps {
  verdict: VerdictKind;
  className?: string;
}

const COPY: Record<VerdictKind, string> = {
  works: "works ✓",
  neutral: "? neutral",
  skip: "skip ✗",
};

const STYLES: Record<VerdictKind, string> = {
  works:
    "bg-verdict-works-bg text-verdict-works-fg border-verdict-works-border",
  neutral:
    "bg-verdict-neutral-bg text-verdict-neutral-fg border-verdict-neutral-border",
  skip: "bg-verdict-skip-bg text-verdict-skip-fg border-verdict-skip-border",
};

export default function VerdictTag({ verdict, className }: VerdictTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-[3px] font-sans text-[11.5px] font-semibold leading-snug tracking-[0.01em]",
        STYLES[verdict],
        className,
      )}
    >
      {COPY[verdict]}
    </span>
  );
}
