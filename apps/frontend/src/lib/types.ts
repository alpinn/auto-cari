export type SearchResponseType = "success" | "clarifying" | "coming_soon" | "error";

export interface SearchRequest {
  query: string;
  clarification?: string | null;
  session_id?: string | null;
}

export type Marketplace = "tokopedia" | "shopee" | "lazada" | "blibli";

export interface ProductResult {
  id: string;
  name: string;
  image_url: string;
  price: number;
  price_formatted: string;
  marketplace: Marketplace;
  store_name: string;
  store_badge: "official" | "top_seller" | null;
  rating: number;
  score: number;
  pros: string[];
  cons: string[];
  ai_reasoning: string;
  product_url: string;
  is_editor_choice: boolean;
}

export interface SearchSuccessResponse {
  type: "success";
  summary: string;
  products: ProductResult[];
  sources: string[];
  cached: boolean;
  // Backend never wires this up — always null in practice (see memory: autocari-backend-integration).
  query_id: string | null;
}

export interface ClarifyingOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface SearchClarifyingResponse {
  type: "clarifying";
  context: string;
  question: string;
  options: ClarifyingOption[];
}

export interface SearchComingSoonResponse {
  type: "coming_soon";
  detected_category: string;
  message: string;
}

export interface SearchErrorResponse {
  type: "error";
  code: string;
  message: string;
}

export type SearchResponse =
  | SearchSuccessResponse
  | SearchClarifyingResponse
  | SearchComingSoonResponse
  | SearchErrorResponse;

export interface PriceInfo {
  marketplace: string;
  price: number;
  price_formatted: string;
  url: string;
  is_lowest: boolean;
  note: string | null;
}

export interface SentimentScore {
  score: number;
  review_count: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  images: string[];
  badges: string[];
  prices: PriceInfo[];
  why_this_fits: string;
  fit_reasons: { icon: string; title: string; description: string }[];
  // Backend key set varies (often just "overall_quality", sometimes empty) — see memory: autocari-backend-integration.
  sentiment: Record<string, SentimentScore>;
  pros: string[];
  cons: string[];
  specifications: Record<string, string>;
  sources: string[];
}

export interface Subcategory {
  id: string;
  label: string;
}

export interface Category {
  id: string;
  label: string;
  available: boolean;
  coming_soon?: boolean;
  subcategories?: Subcategory[];
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface CategoryDetail {
  id: string;
  label: string;
  match_count: number;
  location: string;
  market_intelligence: {
    summary: string;
    trends: string[];
    price_alerts: string[];
  };
  products: ProductResult[];
}
