import { useNavigate } from "react-router";

import { useAuth } from "@/features/auth/api/useAuth";
import BackStep from "@/features/products/components/BackStep";
import CategoryStep from "@/features/products/components/CategoryStep";
import DetailsStep from "@/features/products/components/DetailsStep";
import FrontStep from "@/features/products/components/FrontStep";
import { useDraftProductStore } from "@/stores/useDraftProductStore";

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { step, reset } = useDraftProductStore();

  if (!user) return null;

  const onCancel = () => {
    reset();
    navigate("/dashboard");
  };

  const onSaved = () => {
    reset();
    navigate("/dashboard");
  };

  return (
    <main>
      <h1>add product</h1>
      {step === "category" && <CategoryStep />}
      {step === "front" && <FrontStep userId={user.id} />}
      {step === "back" && <BackStep userId={user.id} />}
      {step === "details" && <DetailsStep userId={user.id} onSaved={onSaved} />}
      <p>
        <button type="button" onClick={onCancel}>
          cancel
        </button>
      </p>
    </main>
  );
}
