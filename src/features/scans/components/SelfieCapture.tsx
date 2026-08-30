import { useState, type ChangeEvent } from "react";

import BlobPreview from "@/features/products/components/BlobPreview";

interface SelfieCaptureProps {
  onConfirm: (blob: Blob) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export default function SelfieCapture({
  onConfirm,
  onCancel,
  disabled = false,
}: SelfieCaptureProps) {
  const [blob, setBlob] = useState<Blob | null>(null);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setBlob(file);
  };

  return (
    <section className="flex flex-col gap-4">
      {!blob ? (
        <label
          className={`flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-sage-deep bg-white px-6 text-center transition-colors hover:bg-cream-deep ${
            disabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
          />
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7CB89C"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1-5 6-7 8-7s7 2 8 7" />
          </svg>
          <div>
            <div className="font-hand text-2xl font-semibold leading-tight text-ink">
              take a selfie
            </div>
            <p className="mt-1 font-sans text-xs leading-relaxed text-ink-soft">
              natural light · no makeup · face the camera straight on
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
              blob={blob}
              alt="selfie preview"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {blob && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBlob(null)}
            disabled={disabled}
            className="flex-1 rounded-full border border-black/25 bg-transparent py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink disabled:opacity-40"
          >
            retake
          </button>
          <button
            type="button"
            onClick={() => onConfirm(blob)}
            disabled={disabled}
            className="flex-1 rounded-full bg-sage-deep py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_4px_14px_rgba(124,184,156,0.4)] disabled:opacity-40"
          >
            use this
          </button>
        </div>
      )}

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="self-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft disabled:opacity-40"
        >
          cancel
        </button>
      )}
    </section>
  );
}
