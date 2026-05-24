import type { ChangeEvent } from "react";

import BlobPreview from "@/features/products/components/BlobPreview";
import { useDraftProductStore } from "@/stores/useDraftProductStore";

interface BackStepProps {
  onConfirm: (blob: Blob) => void;
  onSkip: () => void;
}

export default function BackStep({ onConfirm, onSkip }: BackStepProps) {
  const { backBlob, setBackBlob, setStep } = useDraftProductStore();

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setBackBlob(file);
  };

  const onUseThis = () => {
    if (!backBlob) return;
    onConfirm(backBlob);
  };

  return (
    <section className="flex flex-col gap-4">
      {!backBlob ? (
        <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#B59B7C] bg-white px-6 text-center transition-colors hover:bg-cream-deep">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onChange}
            className="sr-only"
          />
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B59B7C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7h3l2-3h8l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <div>
            <div className="font-hand text-2xl font-semibold leading-tight text-ink">
              tap to capture
            </div>
            <p className="mt-1 font-sans text-xs leading-relaxed text-ink-soft">
              point at the ingredient list on the back of the package
            </p>
          </div>
        </label>
      ) : (
        <div
          className="overflow-hidden rounded-2xl border border-black/[0.10] bg-white"
          style={{
            boxShadow:
              "0 2px 6px rgba(20,18,14,.08), 0 12px 28px rgba(20,18,14,.10)",
          }}
        >
          <div className="aspect-[3/4] w-full overflow-hidden bg-[#1A1410]">
            <BlobPreview
              blob={backBlob}
              alt="back of product"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {backBlob && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBackBlob(null)}
            className="flex-1 rounded-full border border-black/25 bg-transparent py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink"
          >
            retake
          </button>
          <button
            type="button"
            onClick={onUseThis}
            className="flex-1 rounded-full bg-terracotta-deep py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_4px_14px_rgba(227,123,140,0.4)]"
          >
            use this
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setStep("front")}
          className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft"
        >
          ← back
        </button>
        <span className="font-mono text-[10px] text-ink-faint">·</span>
        <button
          type="button"
          onClick={onSkip}
          className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft underline decoration-ink-faint underline-offset-4"
        >
          skip — no ingredient list
        </button>
      </div>
    </section>
  );
}
