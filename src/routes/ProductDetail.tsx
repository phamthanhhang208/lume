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
    <main>
      <p>
        <Link to="/dashboard">← back to dashboard</Link>
      </p>

      {product.isPending && <p>loading…</p>}
      {product.error && <p role="alert">error: {product.error.message}</p>}

      {product.data && (
        <article>
          <h1>{product.data.name}</h1>
          {product.data.brand && <p>brand: {product.data.brand}</p>}
          <p>
            {product.data.category}
            {product.data.subcategory && ` · ${product.data.subcategory}`}
          </p>

          {stickerUrls.data?.[product.data.sticker_image_url] && (
            <img
              src={stickerUrls.data[product.data.sticker_image_url]}
              alt={product.data.name}
            />
          )}

          {verdict && (
            <section>
              <h2>latest verdict <VerdictTag verdict={verdict.verdict} /></h2>
              <p>{verdict.reasoning}</p>
            </section>
          )}

          <h2>ingredients ({product.data.ingredients.length})</h2>
          {product.data.ingredients.length === 0 ? (
            <p>no ingredients listed.</p>
          ) : (
            <ol>
              {product.data.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ol>
          )}
        </article>
      )}
    </main>
  );
}
