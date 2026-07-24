import type {
  SearchRequest,
  SearchResponse,
  ProductDetail,
  CategoriesResponse,
  CategoryDetail,
  SearchComingSoonResponse,
} from "./types";

const BASE_URL =
  typeof window === "undefined"
    ? process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://backend:8000"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (body && typeof body === "object" && "message" in body) {
      throw new ApiError(String(body.code ?? "UNKNOWN"), String(body.message));
    }
    throw new ApiError(
      "UNKNOWN",
      `Permintaan API gagal (status ${response.status})`,
    );
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
    apiFetch<CategoryDetail | SearchComingSoonResponse>(
      `/api/categories/${id}`,
    ),
};
