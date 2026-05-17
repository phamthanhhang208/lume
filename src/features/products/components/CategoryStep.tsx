import { useDraftProductStore } from "@/stores/useDraftProductStore";
import type { ProductCategory } from "@/types/database";

export default function CategoryStep() {
  const { setCategory, setStep } = useDraftProductStore();
  const pick = (category: ProductCategory) => {
    setCategory(category);
    setStep("front");
  };
  return (
    <section>
      <h2>step 1: category</h2>
      <button type="button" onClick={() => pick("makeup")}>
        makeup
      </button>{" "}
      <button type="button" onClick={() => pick("skincare")}>
        skincare
      </button>
    </section>
  );
}
