import type { FormEvent } from "react";

import IngredientList from "@/features/products/components/IngredientList";
import { useCreateProductMutation } from "@/features/products/api/useCreateProductMutation";
import { subcategoriesFor } from "@/features/products/utils/subcategories";
import { useDraftProductStore } from "@/stores/useDraftProductStore";

interface PreviewStepProps {
  userId: string;
  onSaved: () => void;
}

export default function PreviewStep({ userId, onSaved }: PreviewStepProps) {
  const {
    category,
    productId,
    originalStoragePath,
    stickerStoragePath,
    ingredients,
    name,
    brand,
    subcategory,
    shade,
    frontProcessingStatus,
    backProcessingStatus,
    setName,
    setBrand,
    setSubcategory,
    setShade,
    setIngredients,
    setStep,
  } = useDraftProductStore();
  const createProduct = useCreateProductMutation();

  if (!category || !productId || !originalStoragePath || !stickerStoragePath) {
    return (
      <section>
        <p>missing required data. start over.</p>
        <button type="button" onClick={() => setStep("category")}>
          back to start
        </button>
      </section>
    );
  }

  const options = subcategoriesFor(category);
  const frontPending = frontProcessingStatus === "pending";
  const backPending = backProcessingStatus === "pending";
  const stillProcessing = frontPending || backPending;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createProduct.mutate(
      {
        productId,
        userId,
        category,
        subcategory: subcategory || null,
        name,
        brand: brand || null,
        shade: shade || null,
        originalStoragePath,
        stickerStoragePath,
        ingredients,
      },
      { onSuccess: onSaved },
    );
  };

  return (
    <section>
      <h2>step 4: preview &amp; edit</h2>
      <p>review what we read off the photos. edit anything that looks off, then save.</p>
      <form onSubmit={onSubmit}>
        <p>
          <label>
            name{" "}
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={createProduct.isPending}
              placeholder={frontPending ? "reading..." : "product name"}
            />
            {frontPending && <span aria-busy="true"> reading...</span>}
          </label>
        </p>
        <p>
          <label>
            brand{" "}
            <input
              type="text"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              disabled={createProduct.isPending}
              placeholder={frontPending ? "reading..." : "brand name"}
            />
            {frontPending && <span aria-busy="true"> reading...</span>}
          </label>
        </p>
        <p>
          <label>
            subcategory{" "}
            <select
              value={subcategory}
              onChange={(event) => setSubcategory(event.target.value)}
              disabled={createProduct.isPending}
            >
              <option value="">— pick one —</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {frontPending && <span aria-busy="true"> reading...</span>}
          </label>
        </p>
        <p>
          <label>
            shade{" "}
            <input
              type="text"
              value={shade}
              onChange={(event) => setShade(event.target.value)}
              disabled={createProduct.isPending}
              placeholder={frontPending ? "reading..." : "(optional) color or shade"}
            />
            {frontPending && <span aria-busy="true"> reading...</span>}
          </label>
        </p>
        {backPending ? (
          <p aria-busy="true">reading ingredients...</p>
        ) : (
          <IngredientList
            ingredients={ingredients}
            onChange={setIngredients}
            disabled={createProduct.isPending}
          />
        )}
        <p>
          <button
            type="button"
            onClick={() => setStep("back")}
            disabled={createProduct.isPending}
          >
            back
          </button>{" "}
          <button
            type="submit"
            disabled={createProduct.isPending || !name || stillProcessing}
          >
            {createProduct.isPending
              ? "saving..."
              : stillProcessing
                ? "still processing..."
                : "save"}
          </button>
        </p>
        {createProduct.error && (
          <p role="alert">error: {createProduct.error.message}</p>
        )}
      </form>
    </section>
  );
}
