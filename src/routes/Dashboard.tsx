import { Link } from "react-router";

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

  return (
    <main>
      <header>
        <LumeMark size={36} />
        <h1>dashboard</h1>
      </header>
      <p>
        <Link to="/products/new">add product</Link>
        {" · "}
        <Link to="/scan">analyze my skin</Link>
        {" · "}
        <Link to="/look">build a look</Link>
      </p>

      <section>
        <h2>
          routine verdict — <Link to="/verdict">summary</Link>
        </h2>
        {!canAnalyze && (
          <p>
            {!hasScan && (
              <>
                you need at least one skin scan.{" "}
                <Link to="/scan">analyze my skin</Link>.{" "}
              </>
            )}
            {!hasProducts && (
              <>
                you need at least one product.{" "}
                <Link to="/products/new">add a product</Link>.
              </>
            )}
          </p>
        )}
        <p>
          <button
            type="button"
            onClick={() => generateVerdict.mutate()}
            disabled={!canAnalyze || generateVerdict.isPending}
          >
            {generateVerdict.isPending
              ? "analyzing routine…"
              : "analyze my routine"}
          </button>
        </p>
        {generateVerdict.error && (
          <p role="alert">error: {generateVerdict.error.message}</p>
        )}
      </section>

      <h2>my collection</h2>
      {products.isPending && <p>loading…</p>}
      {products.error && <p role="alert">error: {products.error.message}</p>}
      {products.data && products.data.length === 0 && (
        <p>no products yet. <Link to="/products/new">add your first one</Link>.</p>
      )}
      {products.data && products.data.length > 0 && (
        <ul>
          {products.data.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              stickerUrl={stickerUrls.data?.[product.sticker_image_url]}
              verdict={latestVerdicts.data?.byProductId[product.id]}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

interface ProductCardProps {
  product: Product;
  stickerUrl: string | undefined;
  verdict: Verdict | undefined;
}

function ProductCard({ product, stickerUrl, verdict }: ProductCardProps) {
  return (
    <li>
      <Link to={`/products/${product.id}`}>
        {stickerUrl ? <img src={stickerUrl} alt={product.name} /> : <span>(loading image)</span>}
        <div>
          <strong>{product.name}</strong>
          {product.brand && <> — {product.brand}</>}
        </div>
        <div>
          {product.category}
          {product.subcategory && ` · ${product.subcategory}`}
        </div>
        {verdict && <div><VerdictTag verdict={verdict.verdict} /></div>}
      </Link>
    </li>
  );
}
