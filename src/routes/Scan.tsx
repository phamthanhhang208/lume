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
    <main className="flex min-h-svh flex-col overflow-y-auto bg-cream pb-8">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-3 lg:mx-auto lg:w-full lg:max-w-3xl lg:pt-8">
        <Link
          to="/dashboard"
          className="absolute right-4 top-14 flex h-8 w-8 items-center justify-center rounded-full lg:hidden"
          style={{ background: "rgba(60,40,20,.7)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </Link>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          skin check · today
        </div>
        <h1 className="mt-0.5 font-hand text-4xl font-bold leading-tight text-ink">
          {busy ? "reading…" : mode === "capture" ? "hold still" : "here's the read"}
        </h1>
        <svg width="56" height="8" viewBox="0 0 56 8" style={{ display: "block", marginTop: 2 }}>
          <path d="M2,5 Q11,2 22,4.5 T39,4 T54,5" fill="none" stroke="#7CB89C" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        {mode === "capture" && (
          <p className="mt-1.5 font-sans text-xs leading-relaxed text-ink-soft">
            natural light · no makeup · face the camera straight on.
          </p>
        )}
      </div>

      <div className="px-4 lg:mx-auto lg:w-full lg:max-w-3xl lg:px-5">
        {/* Busy state */}
        {busy && (
          <div className="mb-4 rounded-2xl border border-black/[0.08] bg-white px-4 py-5">
            <div className="font-hand text-xl font-semibold text-ink">analyzing your skin…</div>
            <p className="mt-1 font-sans text-xs text-ink-soft">
              this can take 20–30 seconds. reading 14 metrics.
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
              <div className="h-full w-2/3 rounded-full bg-sage-deep animate-pulse" />
            </div>
          </div>
        )}

        {/* Error */}
        {analyze.error && !busy && (
          <div className="mb-3 rounded-xl border border-rose bg-rose-pale px-4 py-3">
            <p className="font-sans text-xs text-rose-deep">{analyze.error.message}</p>
          </div>
        )}

        {/* View mode */}
        {!busy && mode === "view" && (
          <>
            {latestScan.isPending && (
              <p className="font-mono text-[11px] text-ink-faint">loading…</p>
            )}
            {latestScan.data && <ScanResults scan={latestScan.data} />}
            {!latestScan.isPending && !latestScan.data && (
              <div className="rounded-2xl border border-dashed border-[#B59B7C] bg-white px-5 py-8 text-center">
                <p className="font-hand text-xl font-semibold text-ink">no scans yet</p>
                <p className="mt-2 font-sans text-xs text-ink-soft">
                  start your first skin check.
                </p>
              </div>
            )}
            <div className="mt-4">
              <button
                type="button"
                onClick={startScan}
                disabled={profile.isPending}
                className="w-full rounded-full py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-40"
                style={{ background: "#7CB89C", boxShadow: "0 4px 14px rgba(124,184,156,.4)" }}
              >
                {latestScan.data ? "re-analyze" : "start scan"}
              </button>
            </div>
          </>
        )}

        {/* Choose mode */}
        {!busy && mode === "choose" && (
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <h2 className="font-hand text-2xl font-semibold text-ink">use your saved selfie or take a new one?</h2>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={onUseSaved}
                className="w-full rounded-full py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
                style={{ background: "#E37B8C", boxShadow: "0 4px 14px rgba(178,107,74,.4)" }}
              >
                use saved photo
              </button>
              <button
                type="button"
                onClick={() => setMode("capture")}
                className="w-full rounded-full border border-black/25 bg-transparent py-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink"
              >
                take new one
              </button>
              <button
                type="button"
                onClick={() => setMode("view")}
                className="w-full py-2 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-soft"
              >
                cancel
              </button>
            </div>
          </div>
        )}

        {/* Capture mode */}
        {!busy && mode === "capture" && (
          <div>
            <SelfieCapture
              onConfirm={onCaptureConfirm}
              onCancel={() => setMode("view")}
            />
          </div>
        )}
      </div>
    </main>
  );
}
