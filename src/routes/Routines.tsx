import { useState, type FormEvent } from "react";
import { Link } from "react-router";

import { useAuth } from "@/features/auth/api/useAuth";
import { useProducts } from "@/features/products/api/useProducts";
import { useRoutines } from "@/features/routines/api/useRoutines";
import {
  useCreateRoutineMutation,
  useDeleteRoutineMutation,
  useSetActiveRoutineMutation,
  useToggleRoutineProductMutation,
} from "@/features/routines/api/useRoutineMutations";
import type { Product, RoutineWithProducts } from "@/types/database";

export default function Routines() {
  const { user } = useAuth();
  const routines = useRoutines();
  const products = useProducts();
  const createRoutine = useCreateRoutineMutation();
  const [name, setName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!user) return null;

  const onCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createRoutine.mutate(
      { userId: user.id, name: trimmed },
      {
        onSuccess: (routine) => {
          setName("");
          setExpandedId(routine.id);
        },
      },
    );
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
          routines
        </div>
        <h1 className="mt-0.5 font-hand text-4xl font-bold leading-tight text-ink">
          what you actually use
        </h1>
        <svg width="64" height="8" viewBox="0 0 64 8" style={{ display: "block", marginTop: 2 }}>
          <path d="M2,5 Q13,2 26,4.5 T45,4 T62,5" fill="none" stroke="#C5DDC9" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="mt-1.5 font-sans text-xs leading-relaxed text-ink-soft">
          group products into routines. the <strong>active</strong> routine is
          what verdict grades — no active routine means we grade your whole
          shelf.
        </p>
      </div>

      <div className="px-4 lg:mx-auto lg:w-full lg:max-w-3xl lg:px-5">
        {/* Create */}
        <form
          onSubmit={onCreate}
          className="flex items-center gap-2 rounded-2xl border border-black/[0.08] bg-white p-3"
        >
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            disabled={createRoutine.isPending}
            placeholder="new routine name… (e.g. everyday, barrier repair)"
            className="h-9 flex-1 min-w-0 rounded-full border border-black/[0.18] bg-white px-3.5 font-sans text-sm text-ink outline-none placeholder:text-ink-faint disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={createRoutine.isPending || !name.trim()}
            className="rounded-full px-4 py-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-40"
            style={{ background: "#7CB89C" }}
          >
            {createRoutine.isPending ? "creating…" : "create"}
          </button>
        </form>
        {createRoutine.error && (
          <p role="alert" className="mt-2 font-sans text-xs text-rose-deep">
            {createRoutine.error.message}
          </p>
        )}

        {/* List */}
        <div className="mt-4 flex flex-col gap-3">
          {routines.isPending && (
            <p className="font-mono text-[11px] text-ink-faint">loading…</p>
          )}
          {routines.data && routines.data.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#B59B7C] bg-white px-5 py-8 text-center">
              <p className="font-hand text-xl font-semibold text-ink">no routines yet</p>
              <p className="mt-2 font-sans text-xs text-ink-soft">
                create one above and pick the products you actually use.
              </p>
            </div>
          )}
          {(routines.data ?? []).map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              userId={user.id}
              products={products.data ?? []}
              expanded={expandedId === routine.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === routine.id ? null : routine.id)
              }
            />
          ))}
        </div>
      </div>
    </main>
  );
}

interface RoutineCardProps {
  routine: RoutineWithProducts;
  userId: string;
  products: Product[];
  expanded: boolean;
  onToggleExpand: () => void;
}

function RoutineCard({
  routine,
  userId,
  products,
  expanded,
  onToggleExpand,
}: RoutineCardProps) {
  const setActive = useSetActiveRoutineMutation();
  const deleteRoutine = useDeleteRoutineMutation();
  const toggleProduct = useToggleRoutineProductMutation();
  const memberIds = new Set(routine.product_ids);
  const busy =
    setActive.isPending || deleteRoutine.isPending || toggleProduct.isPending;

  const onDelete = () => {
    const confirmed = window.confirm(
      `delete routine "${routine.name}"? products stay on your shelf.`,
    );
    if (confirmed) deleteRoutine.mutate(routine.id);
  };

  return (
    <div className="rounded-2xl border border-black/[0.10] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onToggleExpand}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="font-hand text-2xl font-bold leading-tight text-ink">
              {routine.name}
            </span>
            {routine.is_active && (
              <span
                className="rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em]"
                style={{
                  background: "rgba(168,184,156,.22)",
                  borderColor: "#7CB89C",
                  color: "#7CB89C",
                }}
              >
                active
              </span>
            )}
          </div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft">
            {routine.product_ids.length} product
            {routine.product_ids.length === 1 ? "" : "s"} ·{" "}
            {expanded ? "tap to collapse" : "tap to edit"}
          </div>
        </button>
        <div className="flex shrink-0 gap-1.5">
          {!routine.is_active ? (
            <button
              type="button"
              onClick={() =>
                setActive.mutate({ userId, routineId: routine.id })
              }
              disabled={busy}
              className="rounded-full border border-black/25 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink disabled:opacity-40"
            >
              make active
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActive.mutate({ userId, routineId: null })}
              disabled={busy}
              className="rounded-full border border-black/25 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-soft disabled:opacity-40"
            >
              deactivate
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="rounded-full border px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-rose-deep disabled:opacity-40"
            style={{ borderColor: "rgba(178,107,74,.4)" }}
          >
            delete
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-black/[0.06] pt-3">
          {products.length === 0 ? (
            <p className="font-sans text-xs text-ink-soft">
              your shelf is empty —{" "}
              <Link to="/products/new" className="underline">
                add a product
              </Link>{" "}
              first.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {products.map((product) => {
                const inRoutine = memberIds.has(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      toggleProduct.mutate({
                        routineId: routine.id,
                        productId: product.id,
                        inRoutine,
                      })
                    }
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left disabled:opacity-40"
                    style={{
                      background: inRoutine ? "rgba(168,184,156,.16)" : "transparent",
                    }}
                  >
                    <span
                      className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border"
                      style={{
                        width: 18,
                        height: 18,
                        borderColor: inRoutine ? "#7CB89C" : "rgba(20,18,14,.25)",
                        background: inRoutine ? "#7CB89C" : "transparent",
                      }}
                    >
                      {inRoutine && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M2 5.5l2 2 4-5" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-hand text-base font-semibold leading-tight text-ink">
                        {product.name}
                      </span>
                      <span className="block font-mono text-[9px] uppercase tracking-[0.06em] text-ink-soft">
                        {product.category}
                        {product.subcategory && ` · ${product.subcategory}`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {toggleProduct.error && (
            <p role="alert" className="mt-2 font-sans text-xs text-rose-deep">
              {toggleProduct.error.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
