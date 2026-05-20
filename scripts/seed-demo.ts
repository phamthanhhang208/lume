// scripts/seed-demo.ts
//
// Inserts a small demo product set + one mocked skin scan for the
// currently-signed-in Supabase user. Use to demo the verdict and
// look flows without taking real photos.
//
// Run with: pnpm dlx tsx scripts/seed-demo.ts
//
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the
// environment, plus SUPABASE_SERVICE_ROLE_KEY (server-side) and
// DEMO_USER_ID (the auth.users.id to seed for).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_USER_ID = process.env.DEMO_USER_ID;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DEMO_USER_ID) {
  console.error(
    "missing env: need VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_USER_ID",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PRODUCTS = [
  {
    name: "Glow Drops",
    brand: "Lume Botanica",
    category: "skincare" as const,
    subcategory: "serum",
    ingredients: ["Niacinamide", "Zinc PCA", "Hyaluronic Acid", "Glycerin"],
  },
  {
    name: "Daily Wash",
    brand: "Petal & Co.",
    category: "skincare" as const,
    subcategory: "cleanser",
    ingredients: ["Cocamidopropyl Betaine", "Glycerin", "Panthenol"],
  },
  {
    name: "Cream Blush",
    brand: "Halfmoon",
    category: "makeup" as const,
    subcategory: "blush",
    ingredients: ["Caprylic/Capric Triglyceride", "Mica", "Iron Oxides"],
  },
  {
    name: "Brick Lip",
    brand: "Halfmoon",
    category: "makeup" as const,
    subcategory: "lipstick",
    ingredients: ["Ricinus Communis Oil", "Beeswax", "Iron Oxides"],
  },
  {
    name: "Lash Vol.",
    brand: "Halfmoon",
    category: "makeup" as const,
    subcategory: "eyelash",
    ingredients: ["Aqua", "Beeswax", "Carnauba Wax"],
  },
];

const MOCK_METRICS = {
  wrinkle: 88,
  pore: 58,
  acne: 89,
  redness: 65,
  oiliness: 54,
  moisture: 78,
  dark_circle: 62,
  eye_bag: 70,
  firmness: 81,
  radiance: 82,
  age_spot: 71,
  texture: 74,
  droopy_eyelid: 75,
};

async function main(): Promise<void> {
  const productRows = PRODUCTS.map((p) => ({
    ...p,
    user_id: DEMO_USER_ID,
    sticker_image_url: `${DEMO_USER_ID}/seeded/${p.name}.png`,
    original_image_url: `${DEMO_USER_ID}/seeded/${p.name}.jpg`,
  }));
  const { error: pErr } = await supabase.from("products").insert(productRows);
  if (pErr) throw pErr;
  console.log(`inserted ${productRows.length} products`);

  const { error: sErr } = await supabase.from("scans").insert({
    user_id: DEMO_USER_ID,
    image_url: `${DEMO_USER_ID}/seeded/selfie.jpg`,
    metrics: MOCK_METRICS,
    skin_age: 28,
    overall_score: 76,
    raw_response: { seeded: true },
  });
  if (sErr) throw sErr;
  console.log("inserted 1 scan");

  console.log("done. note: sticker URLs are placeholder paths — UI will show 'loading image'.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
