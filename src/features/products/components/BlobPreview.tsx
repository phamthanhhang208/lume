import { useEffect, useMemo } from "react";

interface BlobPreviewProps {
  blob: Blob;
  alt: string;
}

export default function BlobPreview({ blob, alt }: BlobPreviewProps) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img src={url} alt={alt} />;
}
