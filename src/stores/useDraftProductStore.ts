import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { IngredientSource } from "@/features/products/api/useSearchIngredientsMutation";
import type { ProductCategory } from "@/types/database";

export type DraftStep = "category" | "front" | "back" | "preview";
export type ProcessingStatus = "idle" | "pending" | "done" | "error";

interface DraftProductState {
  step: DraftStep;
  category: ProductCategory | null;
  productId: string | null;
  originalBlob: Blob | null;
  backBlob: Blob | null;
  originalStoragePath: string | null;
  stickerStoragePath: string | null;
  backStoragePath: string | null;
  ingredients: string[];
  // Tracks where the current ingredient list came from so the preview screen
  // can show provenance and decide whether to trigger an online search.
  // User edits via the IngredientList UI snap this back to "manual".
  ingredientSource: IngredientSource;
  ingredientSourceUrl: string | null;
  name: string;
  brand: string;
  subcategory: string;
  shade: string;
  // Status of background mutations kicked off after photo confirm. The steps
  // advance immediately and the preview screen reads these to show progressive
  // loading and gate save.
  frontProcessingStatus: ProcessingStatus;
  backProcessingStatus: ProcessingStatus;
  // Each kickoff bumps the generation. Async mutation callbacks check that
  // their generation still matches before writing — guards against a stale
  // result from an earlier kickoff (retake + re-confirm) overwriting fresh data.
  frontProcessingGeneration: number;
  backProcessingGeneration: number;
  setStep: (step: DraftStep) => void;
  setCategory: (category: ProductCategory) => void;
  setOriginalBlob: (blob: Blob | null) => void;
  setBackBlob: (blob: Blob | null) => void;
  setIngredients: (ingredients: string[]) => void;
  setName: (name: string) => void;
  setBrand: (brand: string) => void;
  setSubcategory: (subcategory: string) => void;
  setShade: (shade: string) => void;
  ensureProductId: () => string;
  reset: () => void;
}

const initialState = {
  step: "category" as DraftStep,
  category: null,
  productId: null,
  originalBlob: null,
  backBlob: null,
  originalStoragePath: null,
  stickerStoragePath: null,
  backStoragePath: null,
  ingredients: [],
  ingredientSource: "manual" as IngredientSource,
  ingredientSourceUrl: null,
  name: "",
  brand: "",
  subcategory: "",
  shade: "",
  frontProcessingStatus: "idle" as ProcessingStatus,
  backProcessingStatus: "idle" as ProcessingStatus,
  frontProcessingGeneration: 0,
  backProcessingGeneration: 0,
};

export const useDraftProductStore = create<DraftProductState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setStep: (step) => set({ step }),
      setCategory: (category) => set({ category }),
      setOriginalBlob: (originalBlob) => set({ originalBlob }),
      setBackBlob: (backBlob) => set({ backBlob }),
      setIngredients: (ingredients) =>
        set({
          ingredients,
          ingredientSource: "manual",
          ingredientSourceUrl: null,
        }),
      setName: (name) => set({ name }),
      setBrand: (brand) => set({ brand }),
      setSubcategory: (subcategory) => set({ subcategory }),
      setShade: (shade) => set({ shade }),
      ensureProductId: () => {
        const current = get().productId;
        if (current) return current;
        const id = crypto.randomUUID();
        set({ productId: id });
        return id;
      },
      // Bump generations so any in-flight mutation from this draft is
      // invalidated and cannot write into the next draft.
      reset: () =>
        set((s) => ({
          ...initialState,
          frontProcessingGeneration: s.frontProcessingGeneration + 1,
          backProcessingGeneration: s.backProcessingGeneration + 1,
        })),
    }),
    {
      name: "lume-draft-product",
      // Only persist what survives a reload meaningfully: blobs are not
      // serializable, and in-flight statuses / generations are about the
      // current page session.
      partialize: (state) => ({
        step: state.step,
        category: state.category,
        productId: state.productId,
        originalStoragePath: state.originalStoragePath,
        stickerStoragePath: state.stickerStoragePath,
        backStoragePath: state.backStoragePath,
        ingredients: state.ingredients,
        ingredientSource: state.ingredientSource,
        ingredientSourceUrl: state.ingredientSourceUrl,
        name: state.name,
        brand: state.brand,
        subcategory: state.subcategory,
        shade: state.shade,
      }),
    },
  ),
);
