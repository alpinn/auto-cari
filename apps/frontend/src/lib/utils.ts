import type { Marketplace } from "./types";

/** Tiny classNames joiner. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const MARKETPLACE_STYLES: Record<Marketplace, { label: string; className: string }> = {
  tokopedia: { label: "Tokopedia", className: "bg-green-500 text-white" },
  shopee: { label: "Shopee", className: "bg-orange-500 text-white" },
  lazada: { label: "Lazada", className: "bg-blue-600 text-white" },
  blibli: { label: "Blibli", className: "bg-blue-400 text-white" },
};

export function marketplaceBadge(marketplace: Marketplace) {
  return MARKETPLACE_STYLES[marketplace] ?? { label: marketplace, className: "bg-neutral text-white" };
}

export function storeBadgeLabel(badge: "official" | "top_seller" | null): string | null {
  if (badge === "official") return "Official Store";
  if (badge === "top_seller") return "Top Seller";
  return null;
}

const SEARCH_KEY = "autocari:searches";
const MAX_SEARCHES = 5;

export function getLatestSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEARCH_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addLatestSearch(query: string): string[] {
  const q = query.trim();
  if (!q || typeof window === "undefined") return getLatestSearches();
  const next = [q, ...getLatestSearches().filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(
    0,
    MAX_SEARCHES,
  );
  window.localStorage.setItem(SEARCH_KEY, JSON.stringify(next));
  return next;
}

export function clearLatestSearches(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SEARCH_KEY);
}
