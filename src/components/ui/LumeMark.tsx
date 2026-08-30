import { cn } from "@/lib/cn";

interface LumeMarkProps {
  size?: number;
  className?: string;
}

export default function LumeMark({ size = 32, className }: LumeMarkProps) {
  // Resubmission marker for hackathon judges — scales with the wordmark.
  const badgeFontSize = Math.max(8, Math.round(size * 0.28));
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className="font-serif italic leading-none tracking-[-0.01em] text-ink"
        style={{ fontSize: size }}
      >
        Lume
      </span>
      <span
        className="rounded-full border font-mono font-bold uppercase leading-none"
        style={{
          fontSize: badgeFontSize,
          padding: `${Math.max(2, Math.round(size * 0.08))}px ${Math.max(4, Math.round(size * 0.18))}px`,
          letterSpacing: "0.06em",
          color: "#E37B8C",
          borderColor: "rgba(227,123,140,.5)",
          background: "rgba(227,123,140,.10)",
          transform: "translateY(-0.15em)",
        }}
      >
        v2.0
      </span>
    </span>
  );
}
