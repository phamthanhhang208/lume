import { useEffect, useState } from "react";

import { AuthRequiredError, transferLook, tryFromWeb } from "@/shared/api";
import type {
  Classification,
  SidePanelMessage,
  TransferLookResult,
  TryFromWebResult,
} from "@/shared/types";

type State =
  | { kind: "idle" }
  | { kind: "loading"; imageUrl: string; mode: "try" | "steal" }
  | { kind: "result"; imageUrl: string; result: TryFromWebResult }
  | { kind: "steal-result"; imageUrl: string; result: TransferLookResult }
  | { kind: "error"; message: string; needsAuth: boolean };

export default function App() {
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    const onMessage = async (raw: unknown) => {
      const msg = raw as SidePanelMessage | undefined;
      if (!msg || (msg.type !== "TRY_PRODUCT" && msg.type !== "STEAL_LOOK")) return;
      const mode = msg.type === "TRY_PRODUCT" ? "try" : "steal";
      setState({ kind: "loading", imageUrl: msg.imageUrl, mode });
      try {
        if (msg.type === "TRY_PRODUCT") {
          const result = await tryFromWeb({
            image_url: msg.imageUrl,
            page_title: msg.pageTitle,
            page_url: msg.pageUrl,
          });
          setState({ kind: "result", imageUrl: msg.imageUrl, result });
        } else {
          const result = await transferLook({
            image_url: msg.imageUrl,
            page_title: msg.pageTitle,
          });
          setState({ kind: "steal-result", imageUrl: msg.imageUrl, result });
        }
      } catch (err) {
        const needsAuth = err instanceof AuthRequiredError;
        const message = err instanceof Error ? err.message : String(err);
        setState({ kind: "error", message, needsAuth });
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  return (
    <main>
      <h1>Lume</h1>
      {state.kind === "idle" && (
        <p className="muted">
          Right-click any image on a beauty site and choose{" "}
          <strong>Try with Lume</strong> (a product) or{" "}
          <strong>Steal this look with Lume</strong> (a makeup look you want).
        </p>
      )}

      {state.kind === "loading" && (
        <>
          <p>
            {state.mode === "steal"
              ? "Transferring that look onto your selfie… 20–40 seconds."
              : "Analyzing product… Skin Simulation can take 15–30 seconds."}
          </p>
          <img src={state.imageUrl} alt="source" style={{ width: "100%" }} />
        </>
      )}

      {state.kind === "error" && (
        <div>
          <div className="alert">{state.message}</div>
          {state.needsAuth && (
            <p className="muted">
              Open the extension toolbar icon → paste a fresh access token.
            </p>
          )}
        </div>
      )}

      {state.kind === "result" && (
        <ResultView imageUrl={state.imageUrl} result={state.result} />
      )}

      {state.kind === "steal-result" && (
        <StealResultView imageUrl={state.imageUrl} result={state.result} />
      )}
    </main>
  );
}

interface StealResultViewProps {
  imageUrl: string;
  result: TransferLookResult;
}

function StealResultView({ imageUrl, result }: StealResultViewProps) {
  const { look, signed } = result;
  return (
    <div className="result">
      <p>
        <span className="badge">Look stolen</span>
      </p>
      {look.gemini_reasoning && <p>{look.gemini_reasoning}</p>}
      {signed.result ? (
        <img src={signed.result} alt="the look on you" />
      ) : (
        <p className="muted">(no preview image — Makeup Transfer unavailable)</p>
      )}
      {look.products_used.length > 0 && (
        <>
          <p className="muted" style={{ marginTop: 8 }}>
            From your shelf:
          </p>
          <ul>
            {look.products_used.map(({ product_id, slot, name, brand }) => (
              <li key={`${product_id}-${slot}`}>
                <strong>{slot}</strong>
                {name ? ` — ${brand ? `${brand} ` : ""}${name}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
      {look.gaps.length > 0 && (
        <p className="muted">Missing from your shelf: {look.gaps.join(", ")}</p>
      )}
      <p className="muted" style={{ marginTop: 8 }}>
        Saved to your looks history in the Lume app. Source:{" "}
        <a href={imageUrl} target="_blank" rel="noreferrer">image</a>
      </p>
    </div>
  );
}

interface ResultViewProps {
  imageUrl: string;
  result: TryFromWebResult;
}

function ResultView({ imageUrl, result }: ResultViewProps) {
  return (
    <div className="result">
      <p>
        <span className="badge">{classificationLabel(result)}</span>
      </p>
      <p>{result.reasoning}</p>
      {result.result_image_url ? (
        <img src={result.result_image_url} alt="try-on result" />
      ) : (
        <p className="muted">
          (no preview image — Perfect Corp render unavailable)
        </p>
      )}
      <p className="muted" style={{ marginTop: 8 }}>
        Source: <a href={imageUrl} target="_blank" rel="noreferrer">image</a>
      </p>
    </div>
  );
}

function classificationLabel(result: TryFromWebResult): string {
  const base: Record<Classification, string> = {
    makeup: "Makeup",
    skincare: "Skincare",
    unknown: "Unknown",
  };
  const head = base[result.classification];
  if (result.classification === "makeup" && result.slot) return `${head} · ${result.slot}`;
  if (result.classification === "skincare" && result.concerns?.length) {
    return `${head} · ${result.concerns.join(", ")}`;
  }
  return head;
}
