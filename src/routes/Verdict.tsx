import { Link } from "react-router";

import VerdictTag from "@/components/ui/VerdictTag";
import { useProducts } from "@/features/products/api/useProducts";
import { useLatestScan } from "@/features/scans/api/useLatestScan";
import { useLatestVerdicts } from "@/features/verdicts/api/useLatestVerdicts";

export default function Verdict() {
  const scan = useLatestScan();
  const verdicts = useLatestVerdicts();
  const products = useProducts();

  if (verdicts.isPending || products.isPending || scan.isPending) {
    return (
      <main>
        <p>loading…</p>
      </main>
    );
  }

  const rows = (products.data ?? []).map((product) => ({
    product,
    verdict: verdicts.data?.byProductId[product.id],
  }));

  const hasAny = rows.some((row) => !!row.verdict);

  return (
    <main>
      <p>
        <Link to="/dashboard">← back to dashboard</Link>
      </p>
      <h1>routine verdict</h1>
      {scan.data && (
        <p>based on scan from {new Date(scan.data.created_at).toLocaleString()}</p>
      )}
      {!hasAny && (
        <p>no verdicts yet. run analyze my routine on the dashboard.</p>
      )}
      {hasAny && (
        <ul>
          {rows.map(({ product, verdict }) => (
            <li key={product.id}>
              <Link to={`/products/${product.id}`}>
                <strong>{product.name}</strong>
              </Link>{" "}
              — {verdict ? <VerdictTag verdict={verdict.verdict} /> : "(not analyzed)"}
              {verdict && <p>{verdict.reasoning}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
