import type {
  SearchRequest,
  SearchResponse,
  ProductDetail,
  CategoriesResponse,
  CategoryDetail,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  search: async (body: SearchRequest): Promise<SearchResponse> => {
    const response = await fetch(`${BASE_URL}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(body),
    });
    const json = (await response
      .json()
      .catch(() => null)) as SearchResponse | null;
    if (json && typeof json === "object" && "type" in json) return json;
    return {
      type: "error",
      code: "INTERNAL_ERROR",
      message: "Terjadi gangguan sementara. Coba lagi.",
    };
  },
  getProduct: (id: string) => apiFetch<ProductDetail>(`/api/product/${id}`),
  getCategories: () => apiFetch<CategoriesResponse>("/api/categories"),
  getCategoryDetail: (id: string) =>
    apiFetch<CategoryDetail>(`/api/categories/${id}`),
};
