import { useEffect, useRef, useState } from "react";
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
  // Lets the user opt out of the in-flight ingredient search without cancelling
  // the network request — they can save with empty ingredients if they prefer.
  const [searchSkipped, setSearchSkipped] = useState(false);

  const trimmedName = name.trim();
  const trimmedBrand = brand.trim();
  const backDone = backProcessingStatus === "done";

  const runSearch = (force: boolean) => {
    if (!trimmedName) return;
    if (searchIngredients.isPending) return;
    setSearchSkipped(false);
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

  // ── Guard: category / productId are set at step 1 — if missing, something
  //    is genuinely broken and the user needs to restart.
  if (!category || !productId) {
    return (
      <section className="rounded-2xl border border-dashed border-rose bg-rose-pale/40 px-5 py-6 text-center">
        <p className="font-hand text-xl font-semibold text-ink">missing data</p>
        <p className="mt-1 font-sans text-xs text-ink-soft">
          something dropped along the way. start over from the top.
        </p>
        <button
          type="button"
          onClick={() => setStep("category")}
          className="mt-4 rounded-full border border-black/25 bg-transparent px-5 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink"
        >
          back to start
        </button>
      </section>
    );
  }

  // ── Front paths: null while processFront is still running. Show a spinner
  //    instead of the "missing data" error so the user knows to wait.
  if (!originalStoragePath || !stickerStoragePath) {
    if (frontProcessingStatus === "pending") {
      return (
        <div
          className="flex items-center gap-3 rounded-xl border border-black/[0.08] bg-white px-4 py-5"
          style={{ boxShadow: "0 1px 3px rgba(20,18,14,.05)" }}
        >
          <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta-deep opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-terracotta-deep" />
          </span>
          <div>
            <div className="font-hand text-lg font-semibold leading-tight text-ink">
              reading the front of the product…
            </div>
            <p className="font-sans text-[11px] text-ink-soft">
              the form will appear as soon as we're done
            </p>
          </div>
        </div>
      );
    }
    // Front processing errored or never ran — genuine missing data.
    return (
      <section className="rounded-2xl border border-dashed border-rose bg-rose-pale/40 px-5 py-6 text-center">
        <p className="font-hand text-xl font-semibold text-ink">missing data</p>
        <p className="mt-1 font-sans text-xs text-ink-soft">
          something dropped along the way. start over from the top.
        </p>
        <button
          type="button"
          onClick={() => setStep("category")}
          className="mt-4 rounded-full border border-black/25 bg-transparent px-5 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink"
        >
          back to start
        </button>
      </section>
    );
  }

  const options = subcategoriesFor(category);
  const frontPending = frontProcessingStatus === "pending";
  const backPending = backProcessingStatus === "pending";
  const frontError = frontProcessingStatus === "error";
  const backError = backProcessingStatus === "error";
  const searching = searchIngredients.isPending && !searchSkipped;
  // Ingredient search is intentionally excluded from stillProcessing — the user
  // can save with no ingredients if they want to skip.
  const stillProcessing = frontPending || backPending;
  const saveDisabled = createProduct.isPending || !name || stillProcessing;

  const processingLabel = frontPending
    ? "reading the front of the product…"
    : backPending
      ? "reading the ingredients on the back…"
      : null;

  const showSourceCaption =
    (ingredientSource === "openbeautyfacts" || ingredientSource === "gemini") &&
    ingredients.length > 0;
  const showSearchButton =
    backDone &&
    !searchIngredients.isPending &&
    ingredients.length === 0 &&
    trimmedName.length > 0;

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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Status banner */}
      {processingLabel && (
        <div
          className="flex items-center gap-3 rounded-xl border border-black/[0.08] bg-white px-4 py-3"
          style={{ boxShadow: "0 1px 3px rgba(20,18,14,.05)" }}
        >
          <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta-deep opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-terracotta-deep" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-hand text-lg font-semibold leading-tight text-ink">
              {processingLabel}
            </div>
            <p className="font-sans text-[11px] text-ink-soft">
              fields will auto-fill when done · you can edit anything below
            </p>
          </div>
        </div>
      )}

      {(frontError || backError) && (
        <div
          role="alert"
          className="rounded-xl border border-rose bg-rose-pale px-4 py-3"
        >
          <div className="font-hand text-base font-semibold text-rose-deep">
            {frontError && backError
              ? "we couldn't read either photo"
              : frontError
                ? "we couldn't read the front of the product"
                : "we couldn't read the ingredients on the back"}
          </div>
          <p className="mt-0.5 font-sans text-[11px] leading-relaxed text-ink-soft">
            no worries — type the fields below by hand and tap save.
          </p>
        </div>
      )}

      {/* Product card with fields */}
      <div
        className="rounded-2xl border border-black/[0.10] bg-white p-4"
        style={{
          boxShadow:
            "0 1px 3px rgba(20,18,14,.06), 0 4px 14px rgba(20,18,14,.06)",
        }}
      >
        <Field
          label="name"
          required
          pending={frontPending}
          value={name}
          onChange={setName}
          placeholder={frontPending ? "reading…" : "product name"}
          disabled={createProduct.isPending}
        />
        <Field
          label="brand"
          pending={frontPending}
          value={brand}
          onChange={setBrand}
          placeholder={frontPending ? "reading…" : "brand name"}
          disabled={createProduct.isPending}
        />
        <SelectField
          label="subcategory"
          pending={frontPending}
          value={subcategory}
          onChange={setSubcategory}
          options={options}
          disabled={createProduct.isPending}
        />
        <Field
          label="shade"
          pending={frontPending}
          value={shade}
          onChange={setShade}
          placeholder={frontPending ? "reading…" : "(optional) color or shade"}
          disabled={createProduct.isPending}
          last
        />
      </div>

      {/* Ingredients */}
      <div
        className="rounded-2xl border border-black/[0.10] bg-white p-4"
        style={{
          boxShadow:
            "0 1px 3px rgba(20,18,14,.06), 0 4px 14px rgba(20,18,14,.06)",
        }}
      >
        {backPending ? (
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-terracotta-deep" />
            <p className="font-sans text-xs text-ink-soft" aria-busy="true">
              reading ingredients from the back…
            </p>
          </div>
        ) : (
          <>
            <IngredientList
              ingredients={ingredients}
              onChange={setIngredients}
              disabled={createProduct.isPending}
            />
            {searching && (
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-terracotta-deep" />
                <p className="font-sans text-xs text-ink-soft" aria-busy="true">
                  searching online for ingredients…
                </p>
                <button
                  type="button"
                  onClick={() => setSearchSkipped(true)}
                  className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-ink-faint underline decoration-ink-faint underline-offset-2"
                >
                  skip
                </button>
              </div>
            )}
            {showSearchButton && (
              <button
                type="button"
                onClick={() => runSearch(true)}
                disabled={createProduct.isPending}
                className="mt-3 rounded-full border border-black/25 bg-transparent px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink disabled:opacity-40"
              >
                search online
              </button>
            )}
            {showSourceCaption && (
              <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-faint">
                source:{" "}
                {ingredientSource === "openbeautyfacts"
                  ? "openbeautyfacts.org"
                  : "web search"}
                {ingredientSourceUrl && (
                  <>
                    {" · "}
                    <a
                      href={ingredientSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-ink-faint underline-offset-2"
                    >
                      verify
                    </a>
                  </>
                )}
                {ingredientSource === "gemini" && (
                  <> · verify against your product — web sources can be outdated</>
                )}
              </p>
            )}
          </>
        )}
      </div>

      {/* Error */}
      {createProduct.error && (
        <div
          role="alert"
          className="rounded-xl border border-rose bg-rose-pale px-4 py-3"
        >
          <p className="font-sans text-xs text-rose-deep">
            {createProduct.error.message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStep("back")}
          disabled={createProduct.isPending}
          className="flex-1 rounded-full border border-black/25 bg-transparent py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink disabled:opacity-40"
        >
          ← back
        </button>
        <button
          type="submit"
          disabled={saveDisabled}
          className="flex-[2] rounded-full bg-terracotta-deep py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_4px_14px_rgba(227,123,140,0.4)] disabled:opacity-40"
        >
          {createProduct.isPending
            ? "saving…"
            : stillProcessing
              ? "still processing…"
              : "save to shelf ✓"}
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  pending?: boolean;
  required?: boolean;
  last?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  pending,
  required,
  last,
}: FieldProps) {
  return (
    <label
      className={`flex items-baseline gap-3 py-2.5 ${last ? "" : "border-b border-black/[0.07]"}`}
    >
      <span className="w-[88px] shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
        {label}
        {required && <span className="text-terracotta-deep"> *</span>}
      </span>
      <input
        type="text"
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent font-hand text-lg font-semibold text-ink outline-none placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-ink-faint disabled:opacity-50"
      />
      {pending && (
        <span
          className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-faint"
          aria-busy="true"
        >
          reading…
        </span>
      )}
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  disabled?: boolean;
  pending?: boolean;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
  pending,
}: SelectFieldProps) {
  return (
    <label className="flex items-baseline gap-3 border-b border-black/[0.07] py-2.5">
      <span className="w-[88px] shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent font-hand text-lg font-semibold text-ink outline-none disabled:opacity-50"
      >
        <option value="">— pick one —</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {pending && (
        <span
          className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-faint"
          aria-busy="true"
        >
          reading…
        </span>
      )}
    </label>
  );
}
