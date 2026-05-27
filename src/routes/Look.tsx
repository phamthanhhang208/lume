import { useState, type FormEvent } from "react";
import { Link } from "react-router";

import { useProducts } from "@/features/products/api/useProducts";
import {
  useGenerateLookMutation,
  type GeneratedLook,
} from "@/features/looks/api/useGenerateLookMutation";
import { useDeleteLookMutation } from "@/features/looks/api/useDeleteLookMutation";
import { useLooks } from "@/features/looks/api/useLooks";
import { useLookSignedUrls } from "@/features/looks/api/useLookSignedUrls";
import type { Look as LookRow, Product } from "@/types/database";

const SUGGESTIONS = [
  "clean girl",
  "soft glam",
  "office natural",
  "bold evening",
  "no-makeup makeup",
];

type Step = 1 | 2 | 3;

export default function Look() {
  const [step, setStep] = useState<Step>(1);
  const [prompt, setPrompt] = useState("");
  const [latest, setLatest] = useState<GeneratedLook | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const generate = useGenerateLookMutation();
  const looks = useLooks();
  const products = useProducts();
  // Include `latest` in the signed-URL query immediately — before `looks.data`
  // refetches — so the VTO image shows on step 3 without waiting.
  const allLooksForUrls = [
    ...(looks.data ?? []),
    ...(latest && !looks.data?.find((l) => l.id === latest.id) ? [latest] : []),
  ];
  const lookUrls = useLookSignedUrls(allLooksForUrls);
  const deleteLook = useDeleteLookMutation();

  const productsById: Record<string, Product> = {};
  for (const product of products.data ?? []) productsById[product.id] = product;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    setGenerateError(null);
    setStep(2);
    generate.mutate(prompt.trim(), {
      onSuccess: (look) => {
        setLatest(look);
        setStep(3);
      },
      onError: (err) => {
        setGenerateError(err instanceof Error ? err.message : "something went wrong");
        setStep(1);
      },
    });
  };

  const onReset = () => {
    setStep(1);
    setPrompt("");
    setLatest(null);
    setGenerateError(null);
  };

  const STEP_LABELS: Record<Step, string> = {
    1: "what's the vibe?",
    2: "casting your look…",
    3: "your look",
  };

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
          build me a look · step {step}/3
        </div>
        <h1 className="mt-0.5 font-hand text-4xl font-bold leading-tight text-ink">
          {STEP_LABELS[step]}
        </h1>
        <svg width="70" height="8" viewBox="0 0 70 8" style={{ display: "block", marginTop: 2 }}>
          <path d="M2,5 Q14,2 28,4.5 T49,4 T68,5" fill="none" stroke="#FBC9A5" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
        {step === 1 && (
          <p className="mt-1.5 font-sans text-xs leading-relaxed text-ink-soft">
            say it like you'd tell a friend. we'll cast products you already own.
          </p>
        )}
      </div>

      <div className="px-4 lg:mx-auto lg:w-full lg:max-w-3xl lg:px-5">

        {/* ── Step 1: Prompt input ── */}
        {step === 1 && (
          <>
            {/* Error from previous attempt */}
            {generateError && (
              <div className="mb-3 rounded-xl border border-rose bg-rose-pale px-4 py-3">
                <p className="font-sans text-xs text-rose-deep">{generateError}</p>
              </div>
            )}

            {/* iMessage-style chat input */}
            <div
              className="rounded-[22px] border border-black/[0.08] bg-white p-3.5"
              style={{ boxShadow: "0 1px 3px rgba(40,35,28,.05)" }}
            >
              <div className="mb-2.5 text-center">
                <span className="font-sans text-[11px] font-bold text-ink-soft">Lume</span>
                <div className="font-sans text-[11px] text-ink-faint">Today</div>
              </div>

              <div className="flex flex-col gap-1.5 mb-3.5">
                <ReceivedBubble>What do you want to look like today?</ReceivedBubble>
                <ReceivedBubble>use anything in your shelf · I'll cast it</ReceivedBubble>
                {prompt && <SentBubble>{prompt}</SentBubble>}
              </div>

              <form onSubmit={onSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={280}
                  placeholder="Umm, let me think…"
                  autoFocus
                  className="h-8 flex-1 min-w-0 rounded-full border border-black/[0.18] bg-white px-3.5 font-sans text-sm text-ink outline-none placeholder:text-ink-faint"
                />
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-none text-white transition-colors disabled:opacity-40"
                  style={{ background: prompt.trim().length > 1 ? "#E37B8C" : "#FBF6F4" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={prompt.trim().length > 1 ? "#fff" : "#B0B0B5"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 12V2M2 7l5-5 5 5" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Suggestion chips */}
            <div className="mt-4">
              <p className="mb-2 ml-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                or try a vibe
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setPrompt(suggestion)}
                    className="rounded-full border px-3 py-1.5 font-sans text-xs font-medium"
                    style={{
                      background: prompt === suggestion ? "#F8D5DC" : "#FFFFFF",
                      color: prompt === suggestion ? "#7A3E48" : "#1A1A1A",
                      borderColor: prompt === suggestion ? "#E37B8C" : "rgba(40,35,28,.12)",
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* History */}
            <div className="mt-8">
              <h2 className="mb-0.5 font-hand text-xl font-semibold text-ink">previous looks</h2>
              <svg width="80" height="8" viewBox="0 0 80 8" style={{ display: "block", marginBottom: 10 }}>
                <path d="M2,5 Q16,2 32,4.5 T56,4 T78,5" fill="none" stroke="#C5DDC9" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              {looks.isPending && (
                <p className="font-mono text-[11px] text-ink-faint">loading…</p>
              )}
              {looks.data && looks.data.length === 0 && (
                <p className="font-sans text-xs text-ink-soft">none yet.</p>
              )}
              {looks.data && looks.data.length > 0 && (
                <div className="flex flex-col gap-3">
                  {looks.data.map((look) => (
                    <LookHistoryRow
                      key={look.id}
                      look={look}
                      signedUrl={
                        look.result_image_url
                          ? lookUrls.data?.[look.result_image_url]
                          : undefined
                      }
                      productsById={productsById}
                      onDelete={() => deleteLook.mutate(look)}
                      deleting={deleteLook.isPending && deleteLook.variables?.id === look.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Step 2: Generating ── */}
        {step === 2 && (
          <div className="mt-4 rounded-2xl border border-black/[0.08] bg-white px-5 py-8 text-center">
            {/* Animated dots */}
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-2.5 w-2.5 rounded-full bg-terracotta-deep"
                  style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
            <div className="font-hand text-2xl font-semibold text-ink mb-1">
              "{prompt}"
            </div>
            <p className="font-sans text-xs text-ink-soft mt-2">
              Gemini is casting your look from your shelf,<br />
              then Perfect Corp is rendering the VTO image.
            </p>
            <p className="font-mono text-[10px] text-ink-faint mt-2">
              this takes 20–40 seconds
            </p>
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-black/[0.06]">
              <div className="h-full rounded-full bg-terracotta-deep animate-[shimmer_2s_linear_infinite]"
                style={{ width: "40%", animation: "pulse 2s ease-in-out infinite" }} />
            </div>
          </div>
        )}

        {/* ── Step 3: Result ── */}
        {step === 3 && latest && (
          <>
            <LookResult look={latest} productsById={productsById} lookUrls={lookUrls.data} />

            {/* Actions */}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={onReset}
                className="flex-1 rounded-full border border-black/25 bg-transparent py-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink"
              >
                ← try another vibe
              </button>
            </div>

            {/* History below the result */}
            <div className="mt-8">
              <h2 className="mb-0.5 font-hand text-xl font-semibold text-ink">previous looks</h2>
              <svg width="80" height="8" viewBox="0 0 80 8" style={{ display: "block", marginBottom: 10 }}>
                <path d="M2,5 Q16,2 32,4.5 T56,4 T78,5" fill="none" stroke="#C5DDC9" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              {looks.data && looks.data.length > 0 && (
                <div className="flex flex-col gap-3">
                  {looks.data.map((look) => (
                    <LookHistoryRow
                      key={look.id}
                      look={look}
                      signedUrl={
                        look.result_image_url
                          ? lookUrls.data?.[look.result_image_url]
                          : undefined
                      }
                      productsById={productsById}
                      onDelete={() => deleteLook.mutate(look)}
                      deleting={deleteLook.isPending && deleteLook.variables?.id === look.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </main>
  );
}

function ReceivedBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="max-w-[78%] self-start rounded-[20px] rounded-bl px-3.5 py-2 font-sans text-sm leading-snug text-ink"
      style={{ background: "#E5E5EA" }}
    >
      {children}
    </div>
  );
}

function SentBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="max-w-[78%] self-end rounded-[20px] rounded-br px-3.5 py-2 font-sans text-sm leading-snug text-white"
      style={{ background: "#E37B8C" }}
    >
      {children}
    </div>
  );
}

interface LookResultProps {
  look: GeneratedLook;
  productsById: Record<string, Product>;
  lookUrls: Record<string, string> | undefined;
}

function LookResult({ look, productsById, lookUrls }: LookResultProps) {
  const signedUrl = look.result_image_url ? lookUrls?.[look.result_image_url] : undefined;

  return (
    <div className="mt-4 rounded-2xl border border-black/[0.10] bg-white overflow-hidden" style={{ boxShadow: "0 2px 6px rgba(20,18,14,.08), 0 12px 28px rgba(60,40,20,.14)" }}>
      {/* VTO image */}
      {signedUrl ? (
        <img
          src={signedUrl}
          alt={`look: ${look.prompt}`}
          className="w-full object-cover"
          style={{ maxHeight: 420 }}
        />
      ) : (
        <div className="flex items-center justify-center bg-cream-deep py-10">
          <p className="font-mono text-[10px] text-ink-faint">(VTO render unavailable)</p>
        </div>
      )}

      <div className="p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <div className="font-serif italic text-[22px] leading-none text-ink">The Lume</div>
          <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink-soft">
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>
        <div className="mb-3 border-t-[1.5px] border-b-[0.5px] h-[4px]" style={{ borderColor: "rgba(60,40,20,.4)" }} />

        <p className="mb-3 font-hand text-xl font-semibold text-ink">"{look.prompt}"</p>

        {look.gemini_reasoning && (
          <p className="mb-3 font-sans text-xs leading-relaxed text-ink-soft">
            {look.gemini_reasoning}
          </p>
        )}

        {look.products_used.length > 0 && (
          <div>
            <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
              the cast · {look.products_used.length}
            </div>
            <div className="flex flex-col gap-1.5">
              {look.products_used.map(({ product_id, slot }) => {
                const product = productsById[product_id];
                return (
                  <div key={`${product_id}-${slot}`} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-terracotta-deep w-[54px] shrink-0">
                      {slot}
                    </span>
                    <span className="font-hand text-base font-semibold leading-none text-ink">
                      {product ? product.name : `unknown product`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {look.gaps.length > 0 && (
          <div className="mt-3 rounded-lg bg-ochre/30 px-3 py-2.5 border border-ochre-deep/40">
            <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft mb-1">
              gaps in your shelf
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {look.gaps.map((gap) => (
                <span key={gap} className="font-sans text-xs text-ink">{gap}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface LookHistoryRowProps {
  look: LookRow;
  signedUrl: string | undefined;
  productsById: Record<string, Product>;
  onDelete: () => void;
  deleting: boolean;
}

function LookHistoryRow({ look, signedUrl, productsById, onDelete, deleting }: LookHistoryRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border border-black/[0.10] bg-white overflow-hidden"
      style={{ boxShadow: "0 1px 2px rgba(20,18,14,.05)" }}
    >
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        disabled={deleting}
        className="w-full text-left p-3.5 disabled:opacity-50"
      >
        <div className="flex items-start gap-3">
          {signedUrl && (
            <img
              src={signedUrl}
              alt={`look: ${look.prompt}`}
              className="h-16 w-12 shrink-0 rounded-md object-cover border border-black/[0.08]"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-hand text-lg font-semibold leading-tight text-ink">
              "{look.prompt}"
            </div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.04em] text-ink-faint">
              {new Date(look.created_at).toLocaleDateString()}
            </div>
            {look.products_used.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
                {look.products_used.map(({ product_id, slot }) => {
                  const product = productsById[product_id];
                  return (
                    <span key={`${product_id}-${slot}`} className="font-mono text-[9px] text-ink-soft">
                      {slot}: {product ? product.name : "?"}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          {/* Chevron */}
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            className="shrink-0 mt-1.5 text-ink-faint transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <path d="M2 4l4 4 4-4" />
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-black/[0.07] px-3.5 pb-3.5 pt-3">
          {signedUrl && (
            <img
              src={signedUrl}
              alt={`look result: ${look.prompt}`}
              className="mb-3 w-full rounded-lg object-cover border border-black/[0.08]"
              style={{ maxHeight: 320 }}
            />
          )}
          {!signedUrl && (
            <p className="mb-3 font-mono text-[10px] text-ink-faint">(no preview image)</p>
          )}

          {look.gemini_reasoning && (
            <p className="mb-3 font-sans text-xs leading-relaxed text-ink-soft">
              {look.gemini_reasoning}
            </p>
          )}

          {look.products_used.length > 0 && (
            <div className="mb-3">
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
                the cast · {look.products_used.length}
              </div>
              <div className="flex flex-col gap-1">
                {look.products_used.map(({ product_id, slot }) => {
                  const product = productsById[product_id];
                  return (
                    <div key={`${product_id}-${slot}`} className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-terracotta-deep w-[54px] shrink-0">
                        {slot}
                      </span>
                      <span className="font-hand text-base font-semibold leading-none text-ink">
                        {product ? product.name : "unknown product"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`delete "${look.prompt}"? this can't be undone.`)) onDelete();
            }}
            disabled={deleting}
            className="mt-1 rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-rose-deep disabled:opacity-40"
            style={{ borderColor: "rgba(178,107,74,.4)" }}
          >
            {deleting ? "deleting…" : "delete look"}
          </button>
        </div>
      )}
    </div>
  );
}
