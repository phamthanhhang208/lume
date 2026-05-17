import type { FormEvent } from "react";

import IngredientList from "@/features/products/components/IngredientList";
import { useCreateProductMutation } from "@/features/products/api/useCreateProductMutation";
import { subcategoriesFor } from "@/features/products/utils/subcategories";
import { useDraftProductStore } from "@/stores/useDraftProductStore";

interface DetailsStepProps {
  userId: string;
  onSaved: () => void;
}

export default function DetailsStep({ userId, onSaved }: DetailsStepProps) {
  const {
    category,
    productId,
    originalStoragePath,
    stickerStoragePath,
    backStoragePath,
    ingredients,
    name,
    brand,
    subcategory,
    setName,
    setBrand,
    setSubcategory,
    setIngredients,
    setStep,
  } = useDraftProductStore();
  const createProduct = useCreateProductMutation();

  if (
    !category ||
    !productId ||
    !originalStoragePath ||
    !stickerStoragePath ||
    !backStoragePath
  ) {
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
        originalStoragePath,
        stickerStoragePath,
        backStoragePath,
        ingredients,
      },
      { onSuccess: onSaved },
    );
  };

  return (
    <section>
      <h2>step 4: details</h2>
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
            />
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
            />
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
          </label>
        </p>
        <IngredientList
          ingredients={ingredients}
          onChange={setIngredients}
          disabled={createProduct.isPending}
        />
        <p>
          <button
            type="button"
            onClick={() => setStep("back")}
            disabled={createProduct.isPending}
          >
            back
          </button>{" "}
          <button type="submit" disabled={createProduct.isPending || !name}>
            {createProduct.isPending ? "saving..." : "save"}
          </button>
        </p>
        {createProduct.error && (
          <p role="alert">error: {createProduct.error.message}</p>
        )}
      </form>
    </section>
  );
}
