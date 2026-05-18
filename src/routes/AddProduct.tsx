import { useNavigate } from "react-router";

import { useAuth } from "@/features/auth/api/useAuth";
import BackStep from "@/features/products/components/BackStep";
import CategoryStep from "@/features/products/components/CategoryStep";
import DetailsStep from "@/features/products/components/DetailsStep";
import FrontStep from "@/features/products/components/FrontStep";
import { useDraftProductStore } from "@/stores/useDraftProductStore";

const STEPS = ["category", "front", "back", "details"] as const;

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { step, reset } = useDraftProductStore();

  if (!user) return null;

  const stepIndex = STEPS.indexOf(step as typeof STEPS[number]);
  const stepLabel = stepIndex >= 0 ? `step ${stepIndex + 1} of 4 · add product` : "add product";

  const stepTitles: Record<string, string> = {
    category: "what kind of product?",
    front: "snap the front",
    back: "now the back",
    details: "ingredients caught",
  };

  const stepSubs: Record<string, string> = {
    category: "skincare, makeup, or both?",
    front: "we'll cut out the background and turn it into a sticker. hold steady.",
    back: "we read the ingredient list so verdict knows what's in there.",
    details: "let's verify what we found.",
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
        {step === "front" && <FrontStep userId={user.id} />}
        {step === "back" && <BackStep userId={user.id} />}
        {step === "details" && <DetailsStep userId={user.id} onSaved={onSaved} />}

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
