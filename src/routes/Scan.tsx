import { useState } from "react";
import { Link } from "react-router";

import { useAuth } from "@/features/auth/api/useAuth";
import { useProfile } from "@/features/profile/api/useProfile";
import { useAnalyzeSelfieMutation } from "@/features/scans/api/useAnalyzeSelfieMutation";
import { useLatestScan } from "@/features/scans/api/useLatestScan";
import ScanResults from "@/features/scans/components/ScanResults";
import SelfieCapture from "@/features/scans/components/SelfieCapture";

type Mode = "view" | "choose" | "capture";

export default function Scan() {
  const { user } = useAuth();
  const profile = useProfile();
  const latestScan = useLatestScan();
  const analyze = useAnalyzeSelfieMutation();
  const [mode, setMode] = useState<Mode>("view");

  if (!user) return null;

  const startScan = () => {
    if (profile.data?.saved_selfie_url) {
      setMode("choose");
    } else {
      setMode("capture");
    }
  };

  const onUseSaved = () => {
    if (!profile.data?.saved_selfie_url) return;
    analyze.mutate(
      {
        source: "saved",
        userId: user.id,
        storagePath: profile.data.saved_selfie_url,
        needsToneAnalysis: !profile.data.skin_tone_data,
      },
      { onSuccess: () => setMode("view") },
    );
  };

  const onCaptureConfirm = (blob: Blob) => {
    analyze.mutate(
      {
        source: "new",
        userId: user.id,
        blob,
        needsToneAnalysis: !profile.data?.skin_tone_data,
      },
      { onSuccess: () => setMode("view") },
    );
  };

  const busy = analyze.isPending;

  return (
    <main>
      <p>
        <Link to="/dashboard">← back to dashboard</Link>
      </p>
      <h1>skin analysis</h1>

      {busy && <p>analyzing your skin… this can take 20–30 seconds.</p>}

      {analyze.error && !busy && (
        <p role="alert">analysis failed: {analyze.error.message}</p>
      )}

      {!busy && mode === "view" && (
        <>
          {latestScan.isPending && <p>loading…</p>}
          {latestScan.error && (
            <p role="alert">error loading scan: {latestScan.error.message}</p>
          )}
          {latestScan.data && <ScanResults scan={latestScan.data} />}
          {!latestScan.isPending && !latestScan.data && (
            <p>no scans yet. start your first one.</p>
          )}
          <p>
            <button type="button" onClick={startScan} disabled={profile.isPending}>
              {latestScan.data ? "re-analyze" : "start scan"}
            </button>
          </p>
        </>
      )}

      {!busy && mode === "choose" && (
        <section>
          <h2>use your saved selfie or take a new one?</h2>
          <p>
            <button type="button" onClick={onUseSaved}>
              use saved photo
            </button>{" "}
            <button type="button" onClick={() => setMode("capture")}>
              take new one
            </button>{" "}
            <button type="button" onClick={() => setMode("view")}>
              cancel
            </button>
          </p>
        </section>
      )}

      {!busy && mode === "capture" && (
        <section>
          <h2>take a selfie</h2>
          <SelfieCapture
            onConfirm={onCaptureConfirm}
            onCancel={() => setMode("view")}
          />
        </section>
      )}
    </main>
  );
}
