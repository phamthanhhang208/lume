export type Classification = "makeup" | "skincare" | "unknown";

export interface Clash {
  with_product: string;
  pair: string;
  severity: "info" | "caution" | "avoid";
  note: string;
}

export interface TryFromWebResult {
  classification: Classification;
  slot?: string | null;
  concerns?: string[];
  color?: string | null;
  product_name?: string | null;
  result_image_url: string | null;
  selfie_signed_url?: string | null;
  personalized?: boolean;
  concerns_matched?: string[];
  concerns_not_needed?: string[];
  clashes?: Clash[];
  reasoning: string;
}

export interface TryFromWebInput {
  image_url: string;
  page_title?: string;
  page_url?: string;
}

export interface TransferLookInput {
  image_url: string;
  page_title?: string;
}

export interface TransferLookResult {
  look: {
    id: string;
    prompt: string;
    result_image_url: string | null;
    reference_image_url: string | null;
    products_used: Array<{
      product_id: string;
      slot: string;
      name?: string | null;
      brand?: string | null;
    }>;
    gemini_reasoning: string | null;
    gaps: string[];
  };
  signed: {
    result: string | null;
    reference: string | null;
  };
}

export type SidePanelMessage =
  | {
      type: "TRY_PRODUCT";
      imageUrl: string;
      pageUrl?: string;
      pageTitle?: string;
    }
  | {
      type: "STEAL_LOOK";
      imageUrl: string;
      pageTitle?: string;
    };
