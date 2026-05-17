import type { ChangeEvent } from "react";

import BlobPreview from "@/features/products/components/BlobPreview";
import { useProcessBackPhotoMutation } from "@/features/products/api/useProcessBackPhotoMutation";
import { useDraftProductStore } from "@/stores/useDraftProductStore";

interface BackStepProps {
  userId: string;
}

export default function BackStep({ userId }: BackStepProps) {
  const {
    backBlob,
    productId,
    setBackBlob,
    setBackStoragePath,
    setIngredients,
    setStep,
  } = useDraftProductStore();
  const processBack = useProcessBackPhotoMutation();

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setBackBlob(file);
    processBack.reset();
  };

  const onUseThis = () => {
    if (!backBlob || !productId) return;
    processBack.mutate(
      { userId, productId, blob: backBlob },
      {
        onSuccess: ({ backStoragePath, ingredients }) => {
          setBackStoragePath(backStoragePath);
          setIngredients(ingredients);
          setStep("details");
        },
      },
    );
  };

  const busy = processBack.isPending;

  return (
    <section>
      <h2>step 3: back of product (ingredients label)</h2>
      <p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onChange}
          disabled={busy}
        />
      </p>
      {backBlob && (
        <>
          <BlobPreview blob={backBlob} alt="back of product" />
          <p>
            <button type="button" onClick={() => setBackBlob(null)} disabled={busy}>
              retake
            </button>{" "}
            <button type="button" onClick={onUseThis} disabled={busy}>
              {busy ? "reading ingredients..." : "use this"}
            </button>
          </p>
        </>
      )}
      {processBack.error && (
        <p role="alert">error: {processBack.error.message}</p>
      )}
      <p>
        <button type="button" onClick={() => setStep("front")} disabled={busy}>
          back
        </button>
      </p>
    </section>
  );
}
