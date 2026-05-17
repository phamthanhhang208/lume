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
    <section>
      <p>
        <input
          type="file"
          accept="image/*"
          capture="user"
          onChange={onChange}
          disabled={disabled}
        />
      </p>
      {blob && (
        <>
          <BlobPreview blob={blob} alt="selfie preview" />
          <p>
            <button type="button" onClick={() => setBlob(null)} disabled={disabled}>
              retake
            </button>{" "}
            <button type="button" onClick={() => onConfirm(blob)} disabled={disabled}>
              use this
            </button>
          </p>
        </>
      )}
      {onCancel && (
        <p>
          <button type="button" onClick={onCancel} disabled={disabled}>
            cancel
          </button>
        </p>
      )}
    </section>
  );
}
