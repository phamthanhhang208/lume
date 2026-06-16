import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import VerdictTag from "@/components/ui/VerdictTag";
import { useAuth } from "@/features/auth/api/useAuth";
import IngredientList from "@/features/products/components/IngredientList";
import { useDeleteProductMutation } from "@/features/products/api/useDeleteProductMutation";
import { useProduct } from "@/features/products/api/useProduct";
import { useStickerUrls } from "@/features/products/api/useStickerUrls";
import { useUpdateProductMutation } from "@/features/products/api/useUpdateProductMutation";
import { subcategoriesFor } from "@/features/products/utils/subcategories";
import { useLatestVerdicts } from "@/features/verdicts/api/useLatestVerdicts";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const product = useProduct(id);
  const stickerUrls = useStickerUrls(product.data ? [product.data] : undefined);
  const verdicts = useLatestVerdicts();
  const verdict = id ? verdicts.data?.byProductId[id] : undefined;
  const updateProduct = useUpdateProductMutation();
  const deleteProduct = useDeleteProductMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [shade, setShade] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);

  const startEdit = () => {
    if (!product.data) return;
    setName(product.data.name);
    setBrand(product.data.brand ?? "");
    setSubcategory(product.data.subcategory ?? "");
    setShade(product.data.shade ?? "");
    setIngredients(product.data.ingredients);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    updateProduct.reset();
  };

  const saveEdit = () => {
    if (!product.data) return;
    const trimmedIngredients = ingredients
      .map((i) => i.trim())
      .filter((i) => i.length > 0);
    updateProduct.mutate(
      {
        productId: product.data.id,
        name: name.trim(),
        brand: brand.trim() || null,
        subcategory: subcategory || null,
        shade: shade.trim() || null,
        ingredients: trimmedIngredients,
      },
      {
        onSuccess: () => {
          const changed: string[] = [];
          if (name.trim() !== product.data!.name) changed.push("name");
          if ((brand.trim() || null) !== product.data!.brand) changed.push("brand");
          if ((subcategory || null) !== product.data!.subcategory) changed.push("subcategory");
          if ((shade.trim() || null) !== product.data!.shade) changed.push("shade");
          if (JSON.stringify(trimmedIngredients) !== JSON.stringify(product.data!.ingredients))
            changed.push("ingredients");
          pendo.track("product_updated", {
            product_id: product.data!.id,
            category: product.data!.category,
            fields_changed: changed.join(","),
            ingredient_count: trimmedIngredients.length,
          });
          setIsEditing(false);
        },
      },
    );
  };

  const onDelete = () => {
    if (!product.data || !user) return;
    const confirmed = window.confirm(
      `delete "${product.data.name}"? this can't be undone.`,
    );
    if (!confirmed) return;
    deleteProduct.mutate(
      { productId: product.data.id, userId: user.id },
      {
        onSuccess: () => {
          pendo.track("product_deleted", {
            product_id: product.data!.id,
            category: product.data!.category,
            has_verdict: !!verdict,
          });
          navigate("/dashboard");
        },
      },
    );
  };

  const busy = updateProduct.isPending || deleteProduct.isPending;
  const subcategoryOptions = product.data
    ? subcategoriesFor(product.data.category)
    : [];

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
            {!isEditing && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={startEdit}
                  disabled={busy}
                  className="rounded-full border border-black/25 bg-transparent px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink disabled:opacity-40"
                >
                  edit
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={busy}
                  className="rounded-full border px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-rose-deep disabled:opacity-40"
                  style={{ borderColor: "rgba(178,107,74,.4)" }}
                >
                  {deleteProduct.isPending ? "deleting…" : "delete"}
                </button>
              </div>
            )}
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
        {deleteProduct.error && (
          <p className="font-sans text-xs text-rose-deep" role="alert">
            {deleteProduct.error.message}
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
              {!isEditing ? (
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
                  {product.data.shade && (
                    <div className="mt-1 font-sans text-xs text-ink-soft">
                      shade: {product.data.shade}
                    </div>
                  )}
                  {verdict && (
                    <div className="mt-2">
                      <VerdictTag verdict={verdict.verdict} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 min-w-0 space-y-2">
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                      name
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={busy}
                      required
                      className="mt-0.5 w-full rounded-md border border-black/20 bg-white px-2 py-1 font-sans text-sm text-ink"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                      brand
                    </span>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      disabled={busy}
                      className="mt-0.5 w-full rounded-md border border-black/20 bg-white px-2 py-1 font-sans text-sm text-ink"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                      subcategory
                    </span>
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      disabled={busy}
                      className="mt-0.5 w-full rounded-md border border-black/20 bg-white px-2 py-1 font-sans text-sm text-ink"
                    >
                      <option value="">— none —</option>
                      {subcategoryOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                      shade
                    </span>
                    <input
                      type="text"
                      value={shade}
                      onChange={(e) => setShade(e.target.value)}
                      disabled={busy}
                      placeholder="(optional)"
                      className="mt-0.5 w-full rounded-md border border-black/20 bg-white px-2 py-1 font-sans text-sm text-ink"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Verdict card — hidden in edit mode so the focus is on inputs */}
            {!isEditing && verdict && (
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
                  ingredients · {ingredients.length}
                </h2>
              </div>
              {isEditing ? (
                <IngredientList
                  ingredients={ingredients}
                  onChange={setIngredients}
                  disabled={busy}
                />
              ) : product.data.ingredients.length === 0 ? (
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

            {isEditing && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={busy}
                  className="flex-1 rounded-full border border-black/25 bg-transparent py-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink disabled:opacity-40"
                >
                  cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={busy || !name.trim()}
                  className="flex-1 rounded-full py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-40"
                  style={{ background: "#7CB89C", boxShadow: "0 4px 14px rgba(124,184,156,.4)" }}
                >
                  {updateProduct.isPending ? "saving…" : "save changes"}
                </button>
              </div>
            )}
            {updateProduct.error && (
              <p className="mt-2 font-sans text-xs text-rose-deep" role="alert">
                {updateProduct.error.message}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
