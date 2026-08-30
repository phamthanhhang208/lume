interface IngredientListProps {
  ingredients: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export default function IngredientList({
  ingredients,
  onChange,
  disabled = false,
}: IngredientListProps) {
  const editAt = (index: number, value: string) => {
    const next = ingredients.slice();
    next[index] = value;
    onChange(next);
  };
  const removeAt = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };
  const add = () => onChange([...ingredients, ""]);

  return (
    <fieldset
      disabled={disabled}
      className="flex flex-col gap-2 disabled:opacity-60"
    >
      <legend className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
        ingredients · {ingredients.length}
      </legend>

      {ingredients.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/[0.15] bg-white/60 px-3 py-3 text-center font-sans text-xs text-ink-soft">
          no ingredients yet. tap add to type them in.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {ingredients.map((ingredient, index) => (
            <li
              key={index}
              className="flex items-center gap-2 rounded-full border border-black/[0.10] bg-white pl-3 pr-1 py-1"
            >
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-ink-faint w-4 shrink-0">
                {String(index + 1).padStart(2, "0")}
              </span>
              <input
                type="text"
                value={ingredient}
                onChange={(event) => editAt(index, event.target.value)}
                className="min-w-0 flex-1 bg-transparent font-sans text-sm text-ink outline-none placeholder:text-ink-faint"
                placeholder="ingredient name"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="remove ingredient"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-rose-pale hover:text-rose-deep"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M2 2l10 10M12 2L2 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={add}
        className="mt-1 self-start rounded-full border border-dashed border-black/25 bg-transparent px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink-soft"
      >
        + add ingredient
      </button>
    </fieldset>
  );
}
