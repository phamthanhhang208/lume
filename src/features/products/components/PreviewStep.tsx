import { useEffect, useRef } from "react";
import type { FormEvent } from "react";

import IngredientList from "@/features/products/components/IngredientList";
import { useCreateProductMutation } from "@/features/products/api/useCreateProductMutation";
import { useSearchIngredientsMutation } from "@/features/products/api/useSearchIngredientsMutation";
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
    ingredientSource,
    ingredientSourceUrl,
    name,
    brand,
    subcategory,
    shade,
    frontProcessingStatus,
    backProcessingStatus,
    backProcessingGeneration,
    setName,
    setBrand,
    setSubcategory,
    setShade,
    setIngredients,
    setStep,
  } = useDraftProductStore();
  const createProduct = useCreateProductMutation();
  const searchIngredients = useSearchIngredientsMutation();
  const lastSearchedGenerationRef = useRef<number>(-1);

  const trimmedName = name.trim();
  const trimmedBrand = brand.trim();
  const backDone = backProcessingStatus === "done";

  const runSearch = (force: boolean) => {
    if (!trimmedName) return;
    if (searchIngredients.isPending) return;
    searchIngredients.mutate(
      { name: trimmedName, brand: trimmedBrand || null },
      {
        onSuccess: (result) => {
          if (result.ingredients.length === 0) return;
          const current = useDraftProductStore.getState();
          // Race-guard: don't overwrite ingredients the user typed while we
          // were searching, unless this was an explicit manual re-search.
          if (!force && current.ingredients.length > 0) return;
          useDraftProductStore.setState({
            ingredients: result.ingredients,
            ingredientSource: result.source,
            ingredientSourceUrl: result.sourceUrl,
          });
        },
      },
    );
  };

  // Auto-trigger search once per back attempt when OCR (or skip) leaves us
  // with no ingredients but we do have a product name to query with.
  useEffect(() => {
    if (!backDone) return;
    if (ingredients.length > 0) return;
    if (!trimmedName) return;
    if (ingredientSource !== "manual") return;
    if (searchIngredients.isPending) return;
    if (lastSearchedGenerationRef.current === backProcessingGeneration) return;
    lastSearchedGenerationRef.current = backProcessingGeneration;
    runSearch(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    backDone,
    ingredients.length,
    trimmedName,
    ingredientSource,
    backProcessingGeneration,
  ]);

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
  const searching = searchIngredients.isPending;
  const stillProcessing = frontPending || backPending || searching;

  const showSourceCaption =
    (ingredientSource === "openbeautyfacts" || ingredientSource === "gemini") &&
    ingredients.length > 0;
  const showSearchButton =
    backDone &&
    ingredients.length === 0 &&
    trimmedName.length > 0 &&
    !searching;

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
          <>
            <IngredientList
              ingredients={ingredients}
              onChange={setIngredients}
              disabled={createProduct.isPending}
            />
            {searching && (
              <p aria-busy="true">searching online for ingredients...</p>
            )}
            {showSearchButton && (
              <p>
                <button
                  type="button"
                  onClick={() => runSearch(true)}
                  disabled={createProduct.isPending}
                >
                  search online
                </button>
              </p>
            )}
            {showSourceCaption && (
              <p>
                <small>
                  source:{" "}
                  {ingredientSource === "openbeautyfacts"
                    ? "openbeautyfacts.org"
                    : "web search"}
                  {ingredientSourceUrl && (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={ingredientSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        verify
                      </a>
                    </>
                  )}
                  {ingredientSource === "gemini" && (
                    <>
                      {" "}
                      · verify against your product — web sources can be
                      outdated
                    </>
                  )}
                </small>
              </p>
            )}
          </>
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
