import { useEffect, useState } from "react";

import { AuthRequiredError, tryFromWeb } from "@/shared/api";
import type {
  Classification,
  SidePanelMessage,
  TryFromWebResult,
} from "@/shared/types";

type State =
  | { kind: "idle" }
  | { kind: "loading"; imageUrl: string }
  | { kind: "result"; imageUrl: string; result: TryFromWebResult }
  | { kind: "error"; message: string; needsAuth: boolean };

export default function App() {
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    const onMessage = async (raw: unknown) => {
      const msg = raw as SidePanelMessage | undefined;
      if (!msg || msg.type !== "TRY_PRODUCT") return;
      setState({ kind: "loading", imageUrl: msg.imageUrl });
      try {
        const result = await tryFromWeb({
          image_url: msg.imageUrl,
          page_title: msg.pageTitle,
          page_url: msg.pageUrl,
        });
        setState({ kind: "result", imageUrl: msg.imageUrl, result });
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
          Right-click any product image on a beauty site and choose{" "}
          <strong>Try with Lume</strong>.
        </p>
      )}

      {state.kind === "loading" && (
        <>
          <p>
            Analyzing product… Skin Simulation can take 15–30 seconds.
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
    </main>
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
