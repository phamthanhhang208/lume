import type { Scan, SkinMetrics } from "@/types/database";

const METRIC_LABELS: Record<keyof SkinMetrics, string> = {
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

interface ScanResultsProps {
  scan: Scan;
}

export default function ScanResults({ scan }: ScanResultsProps) {
  const metricEntries = Object.entries(METRIC_LABELS) as Array<
    [keyof SkinMetrics, string]
  >;

  return (
    <section>
      <h2>your results</h2>
      <p>scanned: {new Date(scan.created_at).toLocaleString()}</p>
      <p>overall score: {scan.overall_score}</p>
      <p>skin age: {scan.skin_age}</p>

      <h3>metrics</h3>
      <ul>
        {metricEntries.map(([key, label]) => (
          <li key={key}>
            {label}: {scan.metrics[key]}
          </li>
        ))}
      </ul>
    </section>
  );
}
