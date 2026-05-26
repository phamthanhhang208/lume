import { useCallback } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "@/features/auth/api/useAuth";
import BackStep from "@/features/products/components/BackStep";
import CategoryStep from "@/features/products/components/CategoryStep";
import FrontStep from "@/features/products/components/FrontStep";
import PreviewStep from "@/features/products/components/PreviewStep";
import { useProcessBackPhotoMutation } from "@/features/products/api/useProcessBackPhotoMutation";
import { useProcessFrontPhotoMutation } from "@/features/products/api/useProcessFrontPhotoMutation";
import { useDraftProductStore } from "@/stores/useDraftProductStore";

const STEPS = ["category", "front", "back", "preview"] as const;

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const step = useDraftProductStore((s) => s.step);
  const reset = useDraftProductStore((s) => s.reset);

  const processFront = useProcessFrontPhotoMutation();
  const processBack = useProcessBackPhotoMutation();

  const onFrontConfirmed = useCallback(
    (blob: Blob) => {
      if (!user) return;
      const state = useDraftProductStore.getState();
      if (!state.category) return;
      const productId = state.ensureProductId();
      const generation = state.frontProcessingGeneration + 1;
      useDraftProductStore.setState({
        frontProcessingStatus: "pending",
        frontProcessingGeneration: generation,
      });
      // Advance immediately so the user can move on while processing runs.
      useDraftProductStore.getState().setStep("back");
      processFront.mutate(
        { userId: user.id, productId, category: state.category, blob },
        {
          onSuccess: (result) => {
            if (
              useDraftProductStore.getState().frontProcessingGeneration !==
              generation
            ) {
              return;
            }
            useDraftProductStore.setState((s) => ({
              originalStoragePath: result.originalStoragePath,
              stickerStoragePath: result.stickerStoragePath,
              // Don't clobber anything the user has already typed in preview
              // while we were still extracting.
              name: s.name === "" && result.name ? result.name : s.name,
              brand: s.brand === "" && result.brand ? result.brand : s.brand,
              subcategory:
                s.subcategory === "" && result.subcategory
                  ? result.subcategory
                  : s.subcategory,
              shade: s.shade === "" && result.shade ? result.shade : s.shade,
              frontProcessingStatus: "done",
            }));
          },
          onError: () => {
            if (
              useDraftProductStore.getState().frontProcessingGeneration !==
              generation
            ) {
              return;
            }
            useDraftProductStore.setState({ frontProcessingStatus: "error" });
          },
        },
      );
    },
    [user, processFront],
  );

  const onBackConfirmed = useCallback(
    (blob: Blob) => {
      if (!user) return;
      const state = useDraftProductStore.getState();
      const productId = state.ensureProductId();
      const generation = state.backProcessingGeneration + 1;
      useDraftProductStore.setState({
        backProcessingStatus: "pending",
        backProcessingGeneration: generation,
      });
      useDraftProductStore.getState().setStep("preview");
      processBack.mutate(
        { userId: user.id, productId, blob },
        {
          onSuccess: (result) => {
            if (
              useDraftProductStore.getState().backProcessingGeneration !==
              generation
            ) {
              return;
            }
            useDraftProductStore.setState((s) => {
              const wroteFromOcr =
                s.ingredients.length === 0 && result.ingredients.length > 0;
              return {
                backStoragePath: result.backStoragePath,
                // If user has already edited ingredients in preview while OCR ran,
                // keep their list.
                ingredients: wroteFromOcr ? result.ingredients : s.ingredients,
                ingredientSource: wroteFromOcr ? "ocr" : s.ingredientSource,
                ingredientSourceUrl: wroteFromOcr ? null : s.ingredientSourceUrl,
                backProcessingStatus: "done",
              };
            });
          },
          onError: () => {
            if (
              useDraftProductStore.getState().backProcessingGeneration !==
              generation
            ) {
              return;
            }
            useDraftProductStore.setState({ backProcessingStatus: "error" });
          },
        },
      );
    },
    [user, processBack],
  );

  const onBackSkip = useCallback(() => {
    useDraftProductStore.setState((s) => ({
      backStoragePath: null,
      ingredients: s.ingredients.length === 0 ? [] : s.ingredients,
      backProcessingStatus: "done",
      backProcessingGeneration: s.backProcessingGeneration + 1,
    }));
    useDraftProductStore.getState().setStep("preview");
  }, []);

  if (!user) return null;

  const stepIndex = STEPS.indexOf(step as (typeof STEPS)[number]);
  const stepLabel =
    stepIndex >= 0 ? `step ${stepIndex + 1} of 4 · add product` : "add product";

  const stepTitles: Record<string, string> = {
    category: "what kind of product?",
    front: "snap the front",
    back: "now the back",
    preview: "preview & edit",
  };

  const stepSubs: Record<string, string> = {
    category: "skincare, makeup, or both?",
    front:
      "we'll cut out the background and read the name + brand off the package.",
    back: "we read the ingredient list so verdict knows what's in there. skip if you don't have it.",
    preview: "we filled in what we read. edit anything that looks off.",
  };

  const onCancel = () => {
    reset();
    navigate("/dashboard");
  };

  const onSaved = () => {
    reset();
    navigate("/dashboard");
  };

  return (
    <main className="flex min-h-svh flex-col overflow-y-auto bg-cream pb-8">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-3 lg:mx-auto lg:w-full lg:max-w-2xl lg:pt-8">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-14 flex h-8 w-8 items-center justify-center rounded-full lg:hidden"
          style={{ background: "rgba(60,40,20,.7)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          {stepLabel}
        </div>
        <h1 className="mt-0.5 font-hand text-4xl font-bold leading-tight text-ink">
          {stepTitles[step] ?? "add product"}
        </h1>
        <svg width="64" height="8" viewBox="0 0 64 8" style={{ display: "block", marginTop: 2 }}>
          <path d="M2,5 Q13,2 26,4.5 T45,4 T62,5" fill="none" stroke="#FBC9A5" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        {stepSubs[step] && (
          <p className="mt-1.5 font-sans text-xs leading-relaxed text-ink-soft">
            {stepSubs[step]}
          </p>
        )}

        {/* Step progress dots */}
        {stepIndex >= 0 && (
          <div className="mt-3 flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className="h-1 rounded-full transition-all"
                style={{
                  flex: i === stepIndex ? 2 : 1,
                  background: i <= stepIndex ? "#E37B8C" : "rgba(20,18,14,.10)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 lg:mx-auto lg:w-full lg:max-w-2xl lg:px-5">
        {step === "category" && <CategoryStep />}
        {step === "front" && <FrontStep onConfirm={onFrontConfirmed} />}
        {step === "back" && (
          <BackStep onConfirm={onBackConfirmed} onSkip={onBackSkip} />
        )}
        {step === "preview" && <PreviewStep userId={user.id} onSaved={onSaved} />}

        <div className="mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-full border border-black/25 bg-transparent py-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink"
          >
            cancel
          </button>
        </div>
      </div>
    </main>
  );
}
