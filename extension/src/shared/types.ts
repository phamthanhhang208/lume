export type Classification = "makeup" | "skincare" | "unknown";

export interface TryFromWebResult {
  classification: Classification;
  slot?: string | null;
  concerns?: string[];
  result_image_url: string | null;
  reasoning: string;
}

export interface TryFromWebInput {
  image_url: string;
  page_title?: string;
  page_url?: string;
}

export type SidePanelMessage =
  | {
      type: "TRY_PRODUCT";
      imageUrl: string;
      pageUrl?: string;
      pageTitle?: string;
    };
