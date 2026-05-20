import { create } from "zustand";

import type { ProductCategory } from "@/types/database";

export type DraftStep = "category" | "front" | "back" | "details";

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
  name: string;
  brand: string;
  subcategory: string;
  setStep: (step: DraftStep) => void;
  setCategory: (category: ProductCategory) => void;
  setOriginalBlob: (blob: Blob | null) => void;
  setBackBlob: (blob: Blob | null) => void;
  setFrontPaths: (paths: { originalStoragePath: string; stickerStoragePath: string }) => void;
  setBackStoragePath: (path: string | null) => void;
  setIngredients: (ingredients: string[]) => void;
  setName: (name: string) => void;
  setBrand: (brand: string) => void;
  setSubcategory: (subcategory: string) => void;
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
  name: "",
  brand: "",
  subcategory: "",
};

export const useDraftProductStore = create<DraftProductState>((set, get) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setCategory: (category) => set({ category }),
  setOriginalBlob: (originalBlob) => set({ originalBlob }),
  setBackBlob: (backBlob) => set({ backBlob }),
  setFrontPaths: ({ originalStoragePath, stickerStoragePath }) =>
    set({ originalStoragePath, stickerStoragePath }),
  setBackStoragePath: (backStoragePath) => set({ backStoragePath }),
  setIngredients: (ingredients) => set({ ingredients }),
  setName: (name) => set({ name }),
  setBrand: (brand) => set({ brand }),
  setSubcategory: (subcategory) => set({ subcategory }),
  ensureProductId: () => {
    const current = get().productId;
    if (current) return current;
    const id = crypto.randomUUID();
    set({ productId: id });
    return id;
  },
  reset: () => set(initialState),
}));
