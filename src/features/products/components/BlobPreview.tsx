import { useEffect, useState } from "react";

interface BlobPreviewProps {
  blob: Blob;
  alt: string;
  className?: string;
}

// Creates a blob URL inside useEffect (not useMemo) so the URL is always
// created and revoked within the same effect lifecycle.
//
// The original useMemo + useEffect cleanup caused ERR_FILE_NOT_FOUND in
// React Strict Mode: Strict Mode fires the cleanup immediately after mount
// (unmount-remount cycle), revoking the URL before the image could load it.
// Moving creation into useEffect means a fresh URL is produced each time the
// effect re-runs, so the image always gets a live URL.
export default function BlobPreview({ blob, alt, className }: BlobPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  if (!url) return null;
  return <img src={url} alt={alt} className={className} />;
}
