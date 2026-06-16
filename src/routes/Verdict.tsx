import { Link } from "react-router";

import VerdictTag from "@/components/ui/VerdictTag";
import { useProducts } from "@/features/products/api/useProducts";
import { useLatestScan } from "@/features/scans/api/useLatestScan";
import { useSelfieSignedUrls } from "@/features/scans/api/useSelfieSignedUrls";
import { useSimulateSkinMutation } from "@/features/scans/api/useSimulateSkinMutation";
import { useLatestVerdicts } from "@/features/verdicts/api/useLatestVerdicts";

export default function Verdict() {
  const scan = useLatestScan();
  const verdicts = useLatestVerdicts();
  const products = useProducts();
  const simulate = useSimulateSkinMutation();
  const selfieUrls = useSelfieSignedUrls([
    scan.data?.image_url,
    scan.data?.simulation_image_url,
  ]);

  if (verdicts.isPending || products.isPending || scan.isPending) {
    return (
      <main className="flex min-h-svh flex-col bg-cream">
        <div className="px-5 pt-14 pb-3 relative lg:mx-auto lg:w-full lg:max-w-3xl lg:pt-8">
          <ScreenHeader label="report card" title="per-product read" backTo="/dashboard" />
        </div>
        <p className="mx-5 font-mono text-[11px] text-ink-faint lg:mx-auto lg:max-w-3xl lg:px-5">loading…</p>
      </main>
    );
  }

  const rows = (products.data ?? []).map((product) => ({
    product,
    verdict: verdicts.data?.byProductId[product.id],
  }));

  const hasAny = rows.some((row) => !!row.verdict);

  const works = rows.filter((r) => r.verdict?.verdict === "works").length;
  const neutral = rows.filter((r) => r.verdict?.verdict === "neutral").length;
  const skip = rows.filter((r) => r.verdict?.verdict === "skip").length;

  return (
    <main className="flex min-h-svh flex-col overflow-y-auto bg-cream pb-8">
      <div className="px-5 pt-14 pb-3 relative lg:mx-auto lg:w-full lg:max-w-3xl lg:pt-8">
        <ScreenHeader label="report card" title="per-product read" backTo="/dashboard" />
        {scan.data && (
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint">
            scan from {new Date(scan.data.created_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Summary row */}
      {hasAny && (
        <div className="mx-4 mb-3 flex gap-2 lg:mx-auto lg:max-w-3xl lg:px-4">
          {[
            { count: works, label: "works", color: "#7CB89C", bg: "rgba(168,184,156,.22)", border: "#7CB89C" },
            { count: neutral, label: "neutral", color: "#E5C56A", bg: "rgba(217,164,91,.22)", border: "#E5C56A" },
            { count: skip, label: "skip", color: "#E37B8C", bg: "rgba(201,136,106,.22)", border: "#E37B8C" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="flex-1 rounded-xl border p-2.5"
              style={{
                background: s.bg,
                borderColor: s.border,
                transform: `rotate(${(i - 1) * 0.5}deg)`,
              }}
            >
              <div className="font-hand text-[30px] font-bold leading-none" style={{ color: s.color }}>
                {s.count}
              </div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasAny && (
        <div className="mx-4 lg:mx-auto lg:max-w-3xl lg:px-4 rounded-2xl border border-dashed border-[#B59B7C] bg-white px-5 py-8 text-center">
          <p className="font-hand text-xl font-semibold text-ink">no verdicts yet</p>
          <p className="mt-2 font-sans text-xs text-ink-soft">
            run analyze routine on the dashboard first.
          </p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block rounded-full px-5 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
            style={{ background: "#E37B8C", boxShadow: "0 4px 14px rgba(178,107,74,.4)" }}
          >
            go to dashboard
          </Link>
        </div>
      )}

      {/* Card stack */}
      {hasAny && (
        <div className="mx-4 flex flex-col gap-3 lg:mx-auto lg:max-w-3xl lg:px-4">
          {rows.map(({ product, verdict }, i) => {
            const rot = ((i % 3) - 1) * 0.6;
            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="flex items-start gap-3 rounded-xl border border-black/[0.10] bg-white p-3"
                style={{
                  boxShadow: "0 1px 3px rgba(20,18,14,.06), 0 4px 14px rgba(20,18,14,.06)",
                  transform: `rotate(${rot}deg)`,
                }}
              >
                <div
                  className="flex h-[64px] w-[56px] shrink-0 items-center justify-center rounded-md border border-black/[0.10] bg-cream"
                  style={{ transform: `rotate(${rot * -3}deg)` }}
                >
                  <div className="h-10 w-10 rounded-full bg-rose-pale" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-soft">
                        {product.brand}
                      </div>
                      <div className="font-hand text-xl font-semibold leading-tight text-ink">
                        {product.name}
                      </div>
                    </div>
                    {verdict ? (
                      <VerdictTag verdict={verdict.verdict} />
                    ) : (
                      <span className="font-mono text-[9px] text-ink-faint">—</span>
                    )}
                  </div>
                  {verdict?.reasoning && (
                    <p className="mt-1.5 font-sans text-xs leading-relaxed text-ink">
                      {verdict.reasoning}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Skin simulation preview */}
      {scan.data && (
        <SimulationSection
          scanId={scan.data.id}
          selfiePath={scan.data.image_url}
          simulationPath={scan.data.simulation_image_url}
          urls={selfieUrls.data ?? {}}
          isPending={simulate.isPending}
          error={simulate.error?.message ?? null}
          onSimulate={() =>
            simulate.mutate(
              { scanId: scan.data!.id },
              {
                onSuccess: (result) => {
                  pendo.track("skin_simulation_completed", {
                    scan_id: scan.data!.id,
                    cached: result.cached,
                    has_simulation_image: !!result.simulationImageUrl,
                    concerns_simulated: result.concernsSimulated.join(","),
                  });
                },
              },
            )
          }
        />
      )}

      {/* Build a look CTA */}
      <div className="mx-4 mt-5 lg:mx-auto lg:max-w-3xl lg:px-4">
        <Link
          to="/look"
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-mono text-xs font-bold uppercase tracking-[0.1em]"
          style={{
            background: "#1A1A1A",
            color: "#F4EDE0",
            boxShadow: "0 4px 14px rgba(20,18,14,.16)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFEC4D">
            <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
          </svg>
          build a look with the ✓ pile
        </Link>
      </div>
    </main>
  );
}

interface SimulationSectionProps {
  scanId: string;
  selfiePath: string;
  simulationPath: string | null;
  urls: Record<string, string>;
  isPending: boolean;
  error: string | null;
  onSimulate: () => void;
}

function SimulationSection({
  selfiePath,
  simulationPath,
  urls,
  isPending,
  error,
  onSimulate,
}: SimulationSectionProps) {
  const beforeUrl = urls[selfiePath];
  const afterUrl = simulationPath ? urls[simulationPath] : null;
  const hasSimulation = !!simulationPath;

  return (
    <div className="mx-4 mt-6 lg:mx-auto lg:max-w-3xl lg:px-4">
      <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
        <h3 className="font-hand text-xl font-semibold text-ink">
          {hasSimulation ? "your skin in 4 weeks" : "preview your skin in 4 weeks"}
        </h3>
        <p className="mt-1 font-sans text-xs text-ink-soft">
          {hasSimulation
            ? "Perfect Corp simulation of your low-scoring concerns improving with consistent routine. estimates, not guarantees."
            : "we'll simulate how your skin could look after sticking with the works pile."}
        </p>

        {hasSimulation && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <figure>
              {beforeUrl ? (
                <img
                  src={beforeUrl}
                  alt="before"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ) : (
                <div className="aspect-square w-full rounded-xl bg-cream" />
              )}
              <figcaption className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                today
              </figcaption>
            </figure>
            <figure>
              {afterUrl ? (
                <img
                  src={afterUrl}
                  alt="after"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ) : (
                <div className="aspect-square w-full rounded-xl bg-cream" />
              )}
              <figcaption className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                4 weeks
              </figcaption>
            </figure>
          </div>
        )}

        {!hasSimulation && (
          <button
            type="button"
            onClick={onSimulate}
            disabled={isPending}
            className="mt-3 w-full rounded-full py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-40"
            style={{ background: "#7CB89C", boxShadow: "0 4px 14px rgba(124,184,156,.4)" }}
          >
            {isPending ? "simulating… (~20s)" : "preview your skin in 4 weeks"}
          </button>
        )}

        {error && (
          <p className="mt-2 font-sans text-xs text-rose-deep">{error}</p>
        )}
      </div>
    </div>
  );
}

function ScreenHeader({ label, title, backTo }: { label: string; title: string; backTo: string }) {
  return (
    <>
      <Link
        to={backTo}
        className="absolute right-4 top-14 flex h-8 w-8 items-center justify-center rounded-full lg:hidden"
        style={{ background: "rgba(60,40,20,.7)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 2l10 10M12 2L2 12" />
        </svg>
      </Link>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </div>
      <h1 className="mt-0.5 font-hand text-4xl font-bold leading-tight text-ink">{title}</h1>
      <svg width="120" height="8" viewBox="0 0 120 8" style={{ display: "block", marginTop: 2 }}>
        <path d="M2,5 Q24,2 48,4.5 T84,4 T118,5" fill="none" stroke="#FBC9A5" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </>
  );
}
