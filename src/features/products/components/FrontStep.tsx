import type { ChangeEvent } from "react";

import BlobPreview from "@/features/products/components/BlobPreview";
import { useProcessFrontPhotoMutation } from "@/features/products/api/useProcessFrontPhotoMutation";
import { useDraftProductStore } from "@/stores/useDraftProductStore";

interface FrontStepProps {
  userId: string;
}

export default function FrontStep({ userId }: FrontStepProps) {
  const { originalBlob, setOriginalBlob, setFrontPaths, setStep, ensureProductId } =
    useDraftProductStore();
  const processFront = useProcessFrontPhotoMutation();

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setOriginalBlob(file);
    processFront.reset();
  };

  const onUseThis = () => {
    if (!originalBlob) return;
    const productId = ensureProductId();
    processFront.mutate(
      { userId, productId, blob: originalBlob },
      {
        onSuccess: ({ originalStoragePath, stickerStoragePath }) => {
          setFrontPaths({ originalStoragePath, stickerStoragePath });
          setStep("back");
        },
      },
    );
  };

  const busy = processFront.isPending;

  return (
    <section>
      <h2>step 2: front of product</h2>
      <p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onChange}
          disabled={busy}
        />
      </p>
      {originalBlob && (
        <>
          <BlobPreview blob={originalBlob} alt="front of product" />
          <p>
            <button
              type="button"
              onClick={() => setOriginalBlob(null)}
              disabled={busy}
            >
              retake
            </button>{" "}
            <button type="button" onClick={onUseThis} disabled={busy}>
              {busy ? "removing background..." : "use this"}
            </button>
          </p>
        </>
      )}
      {processFront.error && (
        <p role="alert">error: {processFront.error.message}</p>
      )}
      <p>
        <button type="button" onClick={() => setStep("category")} disabled={busy}>
          back
        </button>
      </p>
    </section>
  );
}
