import { Link } from "react-router";

import { useProducts } from "@/features/products/api/useProducts";
import { useStickerUrls } from "@/features/products/api/useStickerUrls";
import type { Product } from "@/types/database";

export default function Dashboard() {
  const products = useProducts();
  const stickerUrls = useStickerUrls(products.data);

  return (
    <main>
      <h1>dashboard</h1>
      <p>
        <Link to="/products/new">add product</Link>
        {" · "}
        <Link to="/scan">analyze my skin</Link>
      </p>

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
}

function ProductCard({ product, stickerUrl }: ProductCardProps) {
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
      </Link>
    </li>
  );
}
