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
    <section>
      <h2>step 3: back of product (ingredients label)</h2>
      <p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onChange}
        />
      </p>
      {backBlob && (
        <>
          <BlobPreview blob={backBlob} alt="back of product" />
          <p>
            <button type="button" onClick={() => setBackBlob(null)}>
              retake
            </button>{" "}
            <button type="button" onClick={onUseThis}>
              use this
            </button>
          </p>
        </>
      )}
      <p>
        <button type="button" onClick={onSkip}>
          skip — no ingredient list
        </button>
      </p>
      <p>
        <button type="button" onClick={() => setStep("front")}>
          back
        </button>
      </p>
    </section>
  );
}
