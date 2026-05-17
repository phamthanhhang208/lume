import { cn } from "@/lib/cn";

interface LumeMarkProps {
  size?: number;
  className?: string;
}

export default function LumeMark({ size = 32, className }: LumeMarkProps) {
  return (
    <span
      className={cn(
        "font-serif italic leading-none tracking-[-0.01em] text-ink",
        className,
      )}
      style={{ fontSize: size }}
    >
      Lume
    </span>
  );
}
