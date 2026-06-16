import { Link } from "react-router";

import BottomNav from "@/components/ui/BottomNav";
import LumeMark from "@/components/ui/LumeMark";
import VerdictTag from "@/components/ui/VerdictTag";
import { useProducts } from "@/features/products/api/useProducts";
import { useStickerUrls } from "@/features/products/api/useStickerUrls";
import { useLatestScan } from "@/features/scans/api/useLatestScan";
import { useGenerateVerdictMutation } from "@/features/verdicts/api/useGenerateVerdictMutation";
import { useLatestVerdicts } from "@/features/verdicts/api/useLatestVerdicts";
import type { Product, Verdict } from "@/types/database";

export default function Dashboard() {
  const products = useProducts();
  const stickerUrls = useStickerUrls(products.data);
  const latestScan = useLatestScan();
  const latestVerdicts = useLatestVerdicts();
  const generateVerdict = useGenerateVerdictMutation();

  const hasProducts = (products.data?.length ?? 0) > 0;
  const hasScan = !!latestScan.data;
  const canAnalyze = hasProducts && hasScan;

  const onAnalyzeRoutine = () => {
    generateVerdict.mutate(undefined, {
      onSuccess: (verdicts) => {
        pendo.track("verdict_generated", {
          verdict_count: verdicts.length,
          works_count: verdicts.filter((v) => v.verdict === "works").length,
          neutral_count: verdicts.filter((v) => v.verdict === "neutral").length,
          skip_count: verdicts.filter((v) => v.verdict === "skip").length,
          product_count: products.data?.length ?? 0,
        });
      },
    });
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "good morning" : hour < 17 ? "good afternoon" : "good evening";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const verdictCounts = {
    works: Object.values(latestVerdicts.data?.byProductId ?? {}).filter(
      (v) => v.verdict === "works",
    ).length,
    neutral: Object.values(latestVerdicts.data?.byProductId ?? {}).filter(
      (v) => v.verdict === "neutral",
    ).length,
    skip: Object.values(latestVerdicts.data?.byProductId ?? {}).filter(
      (v) => v.verdict === "skip",
    ).length,
  };

  const totalVerdicts = verdictCounts.works + verdictCounts.neutral + verdictCounts.skip;

  return (
    <>
      {/* ─── Mobile layout ─── */}
      <main className="flex min-h-svh flex-col overflow-y-auto pb-28 pt-14 lg:hidden">
        <div className="px-5 pb-2">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="font-serif text-5xl italic leading-none text-ink">
                To<i>day</i>
              </h1>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                {today.toUpperCase()}
              </p>
            </div>
            <LumeMark size={28} />
          </div>
        </div>

        <div className="mx-4 mb-4 mt-2">
          <SkinCheckCard scan={latestScan.data} />
        </div>

        {!canAnalyze && (
          <div className="mx-4 mb-4 rounded-2xl border border-dashed border-[#B59B7C] bg-white px-5 py-6 text-center">
            <p className="font-hand text-xl font-semibold text-ink">
              {!hasProducts && !hasScan
                ? "your shelf is empty (but bright)"
                : !hasProducts
                  ? "add a product to get started"
                  : "scan your skin to unlock verdict"}
            </p>
            <p className="mt-2 font-sans text-xs leading-relaxed text-ink-soft">
              {!hasProducts &&
                "snap a product → we turn it into a sticker → AI tells you if it's pulling weight."}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {!hasProducts && (
                <Link
                  to="/products/new"
                  className="rounded-full px-5 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
                  style={{
                    background: "#E37B8C",
                    boxShadow: "0 4px 14px rgba(178,107,74,.4)",
                  }}
                >
                  + add product
                </Link>
              )}
              {hasProducts && !hasScan && (
                <Link
                  to="/scan"
                  className="rounded-full px-5 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
                  style={{
                    background: "#7CB89C",
                    boxShadow: "0 4px 14px rgba(124,184,156,.4)",
                  }}
                >
                  scan my skin
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="mx-4 mb-2 flex items-baseline justify-between">
          <div>
            <h2 className="font-hand text-xl font-semibold leading-none text-ink">
              my collection
            </h2>
            {hasProducts && (
              <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-soft">
                {products.data?.length} product
                {products.data?.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {canAnalyze && (
            <button
              type="button"
              onClick={onAnalyzeRoutine}
              disabled={!canAnalyze || generateVerdict.isPending}
              className="rounded-full border border-black/20 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.06em] text-ink disabled:opacity-40"
            >
              {generateVerdict.isPending ? "analyzing…" : "analyze routine"}
            </button>
          )}
        </div>

        {generateVerdict.error && (
          <p className="mx-4 mb-2 font-sans text-xs text-rose-deep" role="alert">
            {generateVerdict.error.message}
          </p>
        )}

        {products.isPending && (
          <p className="mx-4 font-mono text-[11px] text-ink-faint">loading…</p>
        )}
        {products.data && products.data.length > 0 && (
          <div className="mx-4 grid grid-cols-2 gap-2.5">
            {products.data.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                stickerUrl={stickerUrls.data?.[product.sticker_image_url]}
                verdict={latestVerdicts.data?.byProductId[product.id]}
              />
            ))}
            <AddSlot />
          </div>
        )}

        {hasProducts && (
          <Link
            to="/look"
            className="mx-4 mt-4 flex items-center justify-between rounded-2xl p-4"
            style={{
              background: "#3D2F26",
              color: "#F4EDE0",
              boxShadow: "0 4px 14px rgba(20,18,14,.16)",
              transform: "rotate(-0.6deg)",
            }}
          >
            <div>
              <div className="font-hand text-2xl font-semibold leading-none">
                build me a look
              </div>
              <div className="mt-1 font-sans text-[11px] opacity-70">
                ai · uses what you already own
              </div>
            </div>
            <SparkleIcon />
          </Link>
        )}

        <BottomNav />
      </main>

      {/* ─── Desktop layout ─── */}
      <main className="hidden min-h-[calc(100vh-60px)] flex-col bg-cream lg:flex">
        {/* Hero row */}
        <div className="flex items-end justify-between px-8 pt-8 pb-6">
          <div>
            <h1 className="font-hand text-[56px] font-bold leading-none tracking-[-0.01em] text-ink">
              {greeting}
            </h1>
            <svg
              width="120"
              height="8"
              viewBox="0 0 120 8"
              style={{ display: "block", marginTop: 4, marginLeft: 4 }}
            >
              <path
                d="M2,5 Q24,2 48,4.5 T84,4 T118,5"
                fill="none"
                stroke="#FBC9A5"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <p className="mt-1 font-mono text-[13px] uppercase tracking-[0.06em] text-ink-soft">
              {today.toUpperCase()}
            </p>
          </div>

          {/* Stat chips */}
          <div className="flex gap-3">
            {[
              {
                label: "skin age",
                val: latestScan.data ? String(latestScan.data.skin_age) : "—",
                sub: latestScan.data ? "↓ trending" : "no scan",
                color: "#7CB89C",
              },
              {
                label: "overall",
                val: latestScan.data
                  ? String(latestScan.data.overall_score)
                  : "—",
                sub: latestScan.data ? "score" : "no scan",
                color: "#7CB89C",
              },
              {
                label: "works",
                val:
                  totalVerdicts > 0
                    ? `${verdictCounts.works}/${totalVerdicts}`
                    : "—",
                sub: totalVerdicts > 0 ? "products" : "no verdict",
                color: "#1A1A1A",
              },
            ].map((c, i) => (
              <div
                key={c.label}
                className="min-w-[120px] rounded-2xl border border-black/[0.10] bg-white px-4 py-3.5"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(20,18,14,.06), 0 4px 14px rgba(20,18,14,.05)",
                  transform: `rotate(${(i - 1) * 0.4}deg)`,
                }}
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                  {c.label}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <div className="font-hand text-[40px] font-bold leading-none text-ink">
                    {c.val}
                  </div>
                  <div
                    className="font-mono text-[11px] font-bold"
                    style={{ color: c.color }}
                  >
                    {c.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column grid */}
        <div
          className="grid flex-1 gap-6 px-8 pb-8"
          style={{ gridTemplateColumns: "1.6fr 1fr" }}
        >
          {/* Left — Collection */}
          <div
            className="rounded-2xl border border-black/[0.10] bg-white p-5"
            style={{
              boxShadow:
                "0 1px 3px rgba(20,18,14,.05), 0 4px 20px rgba(20,18,14,.05)",
            }}
          >
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <h2 className="font-hand text-3xl font-bold leading-none text-ink">
                  your collection
                </h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                  {products.data?.length ?? 0} products
                  {totalVerdicts > 0 &&
                    ` · ${verdictCounts.works} working`}
                </p>
              </div>
              <div className="flex gap-1.5">
                {canAnalyze && (
                  <button
                    type="button"
                    onClick={onAnalyzeRoutine}
                    disabled={generateVerdict.isPending}
                    className="rounded-full px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-40"
                    style={{ background: "#E37B8C" }}
                  >
                    {generateVerdict.isPending ? "analyzing…" : "analyze routine"}
                  </button>
                )}
              </div>
            </div>

            {products.isPending && (
              <p className="font-mono text-[11px] text-ink-faint">loading…</p>
            )}

            {!hasProducts && !products.isPending && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#B59B7C] py-16 text-center">
                <p className="font-hand text-2xl font-semibold text-ink">
                  your shelf is empty
                </p>
                <p className="mt-2 font-sans text-sm text-ink-soft">
                  snap a product → sticker → AI verdict
                </p>
                <Link
                  to="/products/new"
                  className="mt-4 rounded-full px-5 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
                  style={{
                    background: "#E37B8C",
                    boxShadow: "0 4px 14px rgba(178,107,74,.4)",
                  }}
                >
                  + add first product
                </Link>
              </div>
            )}

            {products.data && products.data.length > 0 && (
              <div className="grid grid-cols-4 gap-3.5">
                {products.data.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    stickerUrl={stickerUrls.data?.[product.sticker_image_url]}
                    verdict={latestVerdicts.data?.byProductId[product.id]}
                    tall
                  />
                ))}
                <AddSlot tall />
              </div>
            )}
          </div>

          {/* Right — Sidebar stack */}
          <div className="flex flex-col gap-4">
            {/* Skin scan card */}
            <div
              className="rounded-2xl border border-black/[0.10] bg-white p-4"
              style={{
                boxShadow:
                  "0 1px 3px rgba(20,18,14,.05), 0 4px 20px rgba(20,18,14,.05)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-rose">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#E37B8C"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c1-5 6-7 8-7s7 2 8 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                    latest scan
                  </div>
                  <div className="font-hand text-2xl font-bold leading-none text-ink">
                    {latestScan.data
                      ? `skin age ${latestScan.data.skin_age}`
                      : "no scan yet"}
                  </div>
                  <div className="mt-0.5 font-sans text-[11.5px] text-ink-soft">
                    {latestScan.data
                      ? new Date(latestScan.data.created_at).toLocaleDateString()
                      : "run your first skin check"}
                  </div>
                </div>
                <Link
                  to="/scan"
                  className="shrink-0 rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white"
                  style={{ background: "#7CB89C" }}
                >
                  {latestScan.data ? "rescan" : "scan"}
                </Link>
              </div>

              {/* Metric bars */}
              {latestScan.data && (
                <div className="mt-3 flex gap-1.5">
                  {(
                    [
                      ["radiance", latestScan.data.metrics.radiance, "#C5DDC9"],
                      ["moisture", latestScan.data.metrics.moisture, "#C5DDC9"],
                      ["texture", latestScan.data.metrics.texture, "#C5DDC9"],
                      ["pores", latestScan.data.metrics.pore, "#FCE3A4"],
                      ["redness", latestScan.data.metrics.redness, "#FCE3A4"],
                      ["oiliness", latestScan.data.metrics.oiliness, "#FCE3A4"],
                      ["acne", latestScan.data.metrics.acne, "#C5DDC9"],
                    ] as [string, number, string][]
                  ).map(([label, score, color]) => (
                    <div key={label} className="flex-1">
                      <div className="h-[4px] overflow-hidden rounded-full bg-black/[0.06]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${score}%`, background: color }}
                        />
                      </div>
                      <div className="mt-0.5 truncate text-center font-mono text-[7.5px] uppercase tracking-[0.02em] text-ink-soft">
                        {label.slice(0, 6)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verdict dark card */}
            <Link
              to="/verdict"
              className="rounded-2xl p-4"
              style={{
                background: "#1A1A1A",
                color: "#F4EDE0",
                boxShadow: "0 4px 20px rgba(60,40,20,.2)",
                transform: "rotate(-0.4deg)",
              }}
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.1em] opacity-70">
                    today's verdict
                  </div>
                  <div className="mt-0.5 font-hand text-[28px] font-bold leading-none">
                    {totalVerdicts > 0
                      ? `${verdictCounts.works} / ${totalVerdicts} working`
                      : "no verdict yet"}
                  </div>
                </div>
                <SparkleIcon color="#FFEC4D" />
              </div>

              {totalVerdicts > 0 && (
                <div className="mt-3 flex gap-1">
                  {[
                    {
                      count: verdictCounts.works,
                      label: "works",
                      color: "#A8B89C",
                    },
                    {
                      count: verdictCounts.neutral,
                      label: "neutral",
                      color: "#D9A45B",
                    },
                    {
                      count: verdictCounts.skip,
                      label: "skip",
                      color: "#C9886A",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex-none rounded-md px-2.5 py-1.5 text-center"
                      style={{
                        flex: Math.max(s.count, 1),
                        background: s.color,
                        color: "#1A1A1A",
                      }}
                    >
                      <div className="font-hand text-[22px] font-bold leading-none">
                        {s.count}
                      </div>
                      <div className="font-mono text-[8px] uppercase tracking-[0.06em]">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="mt-3 w-full rounded-full border py-2 text-center font-mono text-[10.5px] font-bold uppercase tracking-[0.1em]"
                style={{
                  borderColor: "rgba(244,237,224,.3)",
                  color: "#F4EDE0",
                }}
              >
                see full report →
              </div>
            </Link>

            {/* Build a look CTA */}
            <Link
              to="/look"
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/[0.10] bg-white p-4"
              style={{
                boxShadow:
                  "0 1px 3px rgba(20,18,14,.05), 0 4px 20px rgba(20,18,14,.05)",
              }}
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "#E37B8C",
                  transform: "rotate(-4deg)",
                  boxShadow: "0 4px 14px rgba(178,107,74,.4)",
                }}
              >
                <SparkleIcon color="#FFEC4D" size={28} />
              </div>
              <div className="flex-1">
                <div className="font-hand text-[22px] font-bold leading-none text-ink">
                  build me a look
                </div>
                <div className="mt-0.5 font-sans text-[11px] text-ink-soft">
                  type a vibe → ai casts your products → vto render
                </div>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="#1A1A1A"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 4l8 6-8 6" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

// ─── Shared sub-components ───

function SkinCheckCard({ scan }: { scan: { skin_age: number; created_at: string } | null | undefined }) {
  return (
    <Link
      to="/scan"
      className="flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white p-3.5"
      style={{
        boxShadow: "0 1px 3px rgba(20,18,14,.08), 0 4px 14px rgba(20,18,14,.06)",
      }}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E37B8C"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1-5 6-7 8-7s7 2 8 7" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-hand text-xl font-semibold leading-none text-ink">
          Skin check
        </div>
        <div className="mt-0.5 font-sans text-[11.5px] text-ink-soft">
          {scan
            ? `last scan · ${new Date(scan.created_at).toLocaleDateString()}`
            : "no scan yet · start one"}
        </div>
      </div>
      <div
        className="rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-white"
        style={{ background: "#7CB89C" }}
      >
        {scan ? "rescan" : "scan"}
      </div>
    </Link>
  );
}

interface ProductCardProps {
  product: Product;
  stickerUrl: string | undefined;
  verdict: Verdict | undefined;
  tall?: boolean;
}

function ProductCard({ product, stickerUrl, verdict, tall }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="relative flex flex-col rounded-xl border border-black/[0.10] bg-white p-3"
      style={{ boxShadow: "0 1px 2px rgba(20,18,14,.05)" }}
    >
      {verdict && (
        <div className="absolute right-2 top-2">
          <VerdictTag verdict={verdict.verdict} />
        </div>
      )}
      <div
        className="mb-2 flex items-center justify-center rounded-lg border border-black/[0.07] bg-cream"
        style={{ height: tall ? 120 : 92 }}
      >
        {stickerUrl ? (
          <img
            src={stickerUrl}
            alt={product.name}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-rose" />
        )}
      </div>
      <div className="font-mono text-[8.5px] uppercase tracking-[0.05em] text-ink-soft">
        {product.brand}
      </div>
      <div className="font-sans text-[12.5px] font-semibold leading-tight text-ink">
        {product.name}
      </div>
      <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.04em] text-ink-soft">
        {product.subcategory ?? product.category}
      </div>
    </Link>
  );
}

function AddSlot({ tall }: { tall?: boolean }) {
  return (
    <Link
      to="/products/new"
      className="flex flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-[#B59B7C] text-[#8B7355]"
      style={{ minHeight: tall ? 178 : 140 }}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#8B7355"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span className="font-hand text-base font-semibold">add product</span>
    </Link>
  );
}

function SparkleIcon({
  color = "#FFEC4D",
  size = 24,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
    </svg>
  );
}
