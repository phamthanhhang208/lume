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

const CONCERN_LABELS: Record<string, string> = {
  dark_spot: "dark spots",
  dark_circle: "dark circles",
};
const labelize = (c: string) => CONCERN_LABELS[c] ?? c.replace(/_/g, " ");

function ResultView({ imageUrl, result }: ResultViewProps) {
  const isSkincare = result.classification === "skincare";
  const matched = result.concerns_matched ?? [];
  const notNeeded = result.concerns_not_needed ?? [];
  const clashes = result.clashes ?? [];
  const nothingToRender =
    isSkincare && !result.result_image_url && matched.length === 0 && notNeeded.length > 0;

  return (
    <div className="result">
      <p>
        <span className="badge">{classificationLabel(result)}</span>
        {result.product_name && (
          <strong style={{ display: "block", marginTop: 6 }}>
            {result.product_name}
          </strong>
        )}
      </p>
      <p>{result.reasoning}</p>

      {result.result_image_url && result.selfie_signed_url ? (
        <div className="grid2">
          <figure>
            <img src={result.selfie_signed_url} alt="you today" />
            <figcaption>you</figcaption>
          </figure>
          <figure>
            <img src={result.result_image_url} alt="try-on result" />
            <figcaption>{isSkincare ? "in 4 weeks" : "with this shade"}</figcaption>
          </figure>
        </div>
      ) : result.result_image_url ? (
        <img src={result.result_image_url} alt="try-on result" />
      ) : nothingToRender ? (
        <p className="alert">
          This product targets {notNeeded.map(labelize).join(", ")} — not among
          your current concerns. Your money might do more elsewhere.
        </p>
      ) : (
        <p className="muted">
          (no preview image — Perfect Corp render unavailable)
        </p>
      )}

      {isSkincare && (matched.length > 0 || notNeeded.length > 0) && (
        <div className="chips">
          {matched.length > 0 && (
            <div>
              <span className="chip-good">helps your:</span>{" "}
              {matched.map(labelize).join(", ")}
            </div>
          )}
          {notNeeded.length > 0 && !nothingToRender && (
            <div>
              <span className="chip-skip">you don't need:</span>{" "}
              {notNeeded.map(labelize).join(", ")}
            </div>
          )}
          {result.personalized === false && (
            <div className="muted">
              generic preview — run a skin scan in Lume to personalize
            </div>
          )}
        </div>
      )}

      {clashes.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {clashes.map((clash, i) => (
            <div key={i} className={`clash clash-${clash.severity}`}>
              <b>
                {clash.severity === "avoid" ? "⛔" : clash.severity === "caution" ? "⚠️" : "ℹ️"}{" "}
                {clash.pair}
              </b>
              clashes with your {clash.with_product} — {clash.note}
            </div>
          ))}
        </div>
      )}
      {isSkincare && clashes.length === 0 && (
        <p className="muted" style={{ marginTop: 8 }}>
          ✓ no clashes with your current routine
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
