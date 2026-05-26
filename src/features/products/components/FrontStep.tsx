import type { ChangeEvent } from "react";

import BlobPreview from "@/features/products/components/BlobPreview";
import { useDraftProductStore } from "@/stores/useDraftProductStore";

interface FrontStepProps {
  onConfirm: (blob: Blob) => void;
}

export default function FrontStep({ onConfirm }: FrontStepProps) {
  const { originalBlob, setOriginalBlob, setStep } = useDraftProductStore();

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setOriginalBlob(file);
  };

  const onUseThis = () => {
    if (!originalBlob) return;
    onConfirm(originalBlob);
  };

  return (
    <section>
      <h2>step 2: front of product</h2>
      <p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onChange}
        />
      </p>
      {originalBlob && (
        <>
          <BlobPreview blob={originalBlob} alt="front of product" />
          <p>
            <button type="button" onClick={() => setOriginalBlob(null)}>
              retake
            </button>{" "}
            <button type="button" onClick={onUseThis}>
              use this
            </button>
          </p>
        </>
      )}
      <p>
        <button type="button" onClick={() => setStep("category")}>
          back
        </button>
      </p>
    </section>
  );
}
