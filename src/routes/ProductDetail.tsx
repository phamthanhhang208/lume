import { Link, useParams } from "react-router";

import VerdictTag from "@/components/ui/VerdictTag";
import { useProduct } from "@/features/products/api/useProduct";
import { useStickerUrls } from "@/features/products/api/useStickerUrls";
import { useLatestVerdicts } from "@/features/verdicts/api/useLatestVerdicts";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = useProduct(id);
  const stickerUrls = useStickerUrls(product.data ? [product.data] : undefined);
  const verdicts = useLatestVerdicts();
  const verdict = id ? verdicts.data?.byProductId[id] : undefined;

  return (
    <main className="flex min-h-svh flex-col overflow-y-auto bg-cream pb-8">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-3 lg:mx-auto lg:w-full lg:max-w-3xl lg:pt-8">
        <Link
          to="/dashboard"
          className="absolute right-4 top-14 flex h-8 w-8 items-center justify-center rounded-full lg:hidden"
          style={{ background: "rgba(60,40,20,.7)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </Link>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          product detail
        </div>
        {product.data && (
          <>
            <h1 className="mt-0.5 font-hand text-4xl font-bold leading-tight text-ink">
              {product.data.name}
            </h1>
            <svg width="64" height="8" viewBox="0 0 64 8" style={{ display: "block", marginTop: 2 }}>
              <path d="M2,5 Q13,2 26,4.5 T45,4 T62,5" fill="none" stroke="#FBC9A5" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </>
        )}
      </div>

      <div className="px-4 lg:mx-auto lg:w-full lg:max-w-3xl lg:px-5">
        {product.isPending && (
          <p className="font-mono text-[11px] text-ink-faint">loading…</p>
        )}
        {product.error && (
          <p className="font-sans text-xs text-rose-deep" role="alert">
            {product.error.message}
          </p>
        )}

        {product.data && (
          <>
            {/* Product hero card */}
            <div
              className="mb-4 flex items-start gap-3 rounded-2xl border border-black/[0.10] bg-white p-4"
              style={{ boxShadow: "0 2px 6px rgba(20,18,14,.12), 0 12px 28px rgba(20,18,14,.16)" }}
            >
              <div
                className="flex h-[110px] w-[90px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/[0.10] bg-cream"
                style={{ transform: "rotate(-3deg)" }}
              >
                {stickerUrls.data?.[product.data.sticker_image_url] ? (
                  <img
                    src={stickerUrls.data[product.data.sticker_image_url]}
                    alt={product.data.name}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-rose" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {product.data.brand && (
                  <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                    {product.data.brand}
                  </div>
                )}
                <div className="font-hand text-3xl font-bold leading-tight text-ink">
                  {product.data.name}
                </div>
                <div
                  className="mt-1.5 inline-block rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em]"
                  style={{ background: "rgba(168,184,156,.22)", borderColor: "rgba(124,145,112,.5)", color: "#7CB89C" }}
                >
                  {product.data.category}
                  {product.data.subcategory && ` · ${product.data.subcategory}`}
                </div>
                {verdict && (
                  <div className="mt-2">
                    <VerdictTag verdict={verdict.verdict} />
                  </div>
                )}
              </div>
            </div>

            {/* Verdict card */}
            {verdict && (
              <div className="mb-4 rounded-2xl border border-black/[0.10] bg-white p-4">
                <h2 className="font-hand text-xl font-semibold leading-none text-ink">why</h2>
                <p className="mt-1.5 font-sans text-sm leading-relaxed text-ink">
                  {verdict.reasoning}
                </p>
              </div>
            )}

            {/* Ingredients */}
            <div className="rounded-2xl border border-black/[0.10] bg-white p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-soft">
                  ingredients · {product.data.ingredients.length}
                </h2>
              </div>
              {product.data.ingredients.length === 0 ? (
                <p className="font-sans text-xs text-ink-soft">no ingredients listed.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {product.data.ingredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-black/[0.12] bg-cream px-2.5 py-1 font-sans text-xs text-ink"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
