import { useState, type FormEvent } from "react";
import { Link } from "react-router";

import { useProducts } from "@/features/products/api/useProducts";
import {
  useGenerateLookMutation,
  type GeneratedLook,
} from "@/features/looks/api/useGenerateLookMutation";
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

export default function Look() {
  const [prompt, setPrompt] = useState("");
  const [latest, setLatest] = useState<GeneratedLook | null>(null);
  const generate = useGenerateLookMutation();
  const looks = useLooks();
  const products = useProducts();
  const lookUrls = useLookSignedUrls(looks.data);

  const productsById: Record<string, Product> = {};
  for (const product of products.data ?? []) productsById[product.id] = product;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    generate.mutate(prompt.trim(), { onSuccess: (look) => setLatest(look) });
  };

  const pickSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <main>
      <p>
        <Link to="/dashboard">← back to dashboard</Link>
      </p>
      <h1>build a look</h1>

      <form onSubmit={onSubmit}>
        <p>
          <label>
            describe the look{" "}
            <input
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={280}
              disabled={generate.isPending}
              placeholder="e.g. clean girl"
            />
          </label>
        </p>
        <p>
          suggestions:{" "}
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => pickSuggestion(suggestion)}
              disabled={generate.isPending}
            >
              {suggestion}
            </button>
          ))}
        </p>
        <p>
          <button type="submit" disabled={generate.isPending || !prompt.trim()}>
            {generate.isPending ? "generating your look…" : "generate"}
          </button>
        </p>
      </form>

      {generate.isPending && (
        <p>
          rendering with Perfect Corp Makeup VTO — this can take 20–40 seconds.
        </p>
      )}

      {generate.error && !generate.isPending && (
        <p role="alert">error: {generate.error.message}</p>
      )}

      {latest && !generate.isPending && (
        <LookResult look={latest} productsById={productsById} />
      )}

      <h2>previous looks</h2>
      {looks.isPending && <p>loading…</p>}
      {looks.data && looks.data.length === 0 && <p>none yet.</p>}
      {looks.data && looks.data.length > 0 && (
        <ul>
          {looks.data.map((look) => (
            <li key={look.id}>
              <LookHistoryRow
                look={look}
                signedUrl={
                  look.result_image_url
                    ? lookUrls.data?.[look.result_image_url]
                    : undefined
                }
                productsById={productsById}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

interface LookResultProps {
  look: GeneratedLook;
  productsById: Record<string, Product>;
}

function LookResult({ look, productsById }: LookResultProps) {
  return (
    <section>
      <h2>your look</h2>
      <p>"{look.prompt}"</p>
      {look.result_image_url ? (
        <p>preview image saved. see in history below.</p>
      ) : (
        <p>(VTO render unavailable — showing breakdown only)</p>
      )}
      {look.gemini_reasoning && <p>{look.gemini_reasoning}</p>}
      {look.products_used.length > 0 && (
        <>
          <h3>products used</h3>
          <ul>
            {look.products_used.map(({ product_id, slot }) => {
              const product = productsById[product_id];
              return (
                <li key={`${product_id}-${slot}`}>
                  <strong>{slot}</strong>:{" "}
                  {product ? product.name : `(unknown product ${product_id})`}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {look.gaps.length > 0 && (
        <>
          <h3>gaps in your collection</h3>
          <ul>
            {look.gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

interface LookHistoryRowProps {
  look: LookRow;
  signedUrl: string | undefined;
  productsById: Record<string, Product>;
}

function LookHistoryRow({ look, signedUrl, productsById }: LookHistoryRowProps) {
  return (
    <article>
      <p>
        <strong>"{look.prompt}"</strong>{" "}
        <small>({new Date(look.created_at).toLocaleString()})</small>
      </p>
      {signedUrl && <img src={signedUrl} alt={`look: ${look.prompt}`} />}
      {!signedUrl && look.result_image_url && <p>(loading image)</p>}
      {!look.result_image_url && <p>(no VTO image)</p>}
      <ul>
        {look.products_used.map(({ product_id, slot }) => {
          const product = productsById[product_id];
          return (
            <li key={`${product_id}-${slot}`}>
              {slot}: {product ? product.name : `(unknown ${product_id})`}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
