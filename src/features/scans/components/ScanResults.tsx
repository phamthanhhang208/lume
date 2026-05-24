import type { Scan, SkinMetrics } from "@/types/database";

type MetricKey = keyof SkinMetrics;

interface MetricGroup {
  title: string;
  accent: string;
  metrics: MetricKey[];
}

const METRIC_LABELS: Record<MetricKey, string> = {
  wrinkle: "wrinkle",
  pore: "pore",
  acne: "acne",
  redness: "redness",
  oiliness: "oiliness",
  moisture: "moisture",
  dark_circle: "dark circles",
  eye_bag: "eye bags",
  firmness: "firmness",
  radiance: "radiance",
  age_spot: "age spots",
  texture: "texture",
  droopy_eyelid: "droopy eyelid",
};

const GROUPS: MetricGroup[] = [
  { title: "glow", accent: "#7CB89C", metrics: ["radiance", "moisture"] },
  { title: "texture", accent: "#E5C56A", metrics: ["pore", "wrinkle", "firmness", "texture"] },
  { title: "tone", accent: "#E37B8C", metrics: ["redness", "age_spot", "oiliness", "acne"] },
  { title: "eyes", accent: "#B59B7C", metrics: ["dark_circle", "eye_bag", "droopy_eyelid"] },
];

interface ScanResultsProps {
  scan: Scan;
}

export default function ScanResults({ scan }: ScanResultsProps) {
  const scanDate = new Date(scan.created_at);

  return (
    <section className="flex flex-col gap-4">
      {/* Hero: skin age + overall score */}
      <div
        className="flex items-center gap-4 rounded-2xl border border-black/[0.10] bg-white p-4"
        style={{
          boxShadow:
            "0 2px 6px rgba(20,18,14,.08), 0 12px 28px rgba(20,18,14,.10)",
          transform: "rotate(-0.6deg)",
        }}
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sage">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7CB89C"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3c2 4 4 6 4 9a4 4 0 0 1-8 0c0-3 2-5 4-9z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
            skin age
          </div>
          <div className="font-hand text-5xl font-bold leading-none text-ink">
            {scan.skin_age || "—"}
          </div>
          <div className="mt-1 font-sans text-[11px] leading-tight text-ink-soft">
            overall score{" "}
            <strong className="text-ink">{scan.overall_score || "—"}</strong>
            <span className="text-ink-faint">
              {" "}· {scanDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Grouped metric chips */}
      <div className="flex flex-col gap-3">
        {GROUPS.map((group, gi) => (
          <div key={group.title}>
            <div className="mb-1.5 ml-1 flex items-baseline gap-2">
              <h3 className="font-hand text-xl font-semibold text-ink">
                {group.title}
              </h3>
              <span
                className="flex-1"
                style={{
                  borderTop: "1px dashed rgba(40,35,28,.16)",
                  marginBottom: 3,
                }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.metrics.map((key, mi) => {
                const rotate = (((gi + mi) % 3) - 1) * 0.5;
                const value = scan.metrics[key] ?? 0;
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-black/[0.10] bg-white px-2.5 pt-1.5 pb-1.5"
                    style={{
                      borderLeft: `4px solid ${group.accent}`,
                      transform: `rotate(${rotate}deg)`,
                      boxShadow: "0 1px 3px rgba(20,18,14,.06)",
                    }}
                  >
                    <div className="font-mono text-[8.5px] uppercase tracking-[0.06em] text-ink-soft">
                      {METRIC_LABELS[key]}
                    </div>
                    <div className="font-hand text-2xl font-bold leading-none text-ink">
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
