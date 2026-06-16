import { useDraftProductStore } from "@/stores/useDraftProductStore";
import type { ProductCategory } from "@/types/database";

interface TileProps {
  label: string;
  sub: string;
  onClick: () => void;
  accent: string;
  icon: React.ReactNode;
}

function Tile({ label, sub, onClick, accent, icon }: TileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-black/[0.10] bg-white px-4 py-7 text-center transition-transform active:scale-[0.98]"
      style={{
        boxShadow:
          "0 1px 3px rgba(20,18,14,.06), 0 4px 14px rgba(20,18,14,.06)",
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: `${accent}22` }}
      >
        {icon}
      </div>
      <div>
        <div className="font-hand text-2xl font-semibold leading-tight text-ink">
          {label}
        </div>
        <p className="mt-0.5 font-sans text-[11px] leading-snug text-ink-soft">
          {sub}
        </p>
      </div>
    </button>
  );
}

export default function CategoryStep() {
  const { setCategory, setStep } = useDraftProductStore();
  const pick = (category: ProductCategory) => {
    setCategory(category);
    setStep("front");
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Tile
          label="makeup"
          sub="foundation, lip, blush, eye…"
          accent="#E37B8C"
          onClick={() => pick("makeup")}
          icon={
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E37B8C"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 2h6v6H9z" />
              <path d="M8 8h8l-1 13H9z" />
            </svg>
          }
        />
        <Tile
          label="skincare"
          sub="serum, moisturizer, cleanser…"
          accent="#7CB89C"
          onClick={() => pick("skincare")}
          icon={
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7CB89C"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3c2 4 4 6 4 9a4 4 0 0 1-8 0c0-3 2-5 4-9z" />
            </svg>
          }
        />
      </div>
      <p className="text-center font-sans text-[11px] text-ink-faint">
        pick the closest match · you can refine later
      </p>
    </section>
  );
}
