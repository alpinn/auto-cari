import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import type { Category, ProductResult } from "@/lib/types";
import { SearchBox } from "@/components/search/SearchBox";
import { LatestSearches } from "@/components/search/LatestSearches";
import { ProductCard } from "@/components/product/ProductCard";

// ponytail: no trending/curated endpoint exists — static Phase-1 sample.
// Replace with a real endpoint when the backend exposes one.
const CURATED: ProductResult[] = [
  {
    id: "ipad-pro-m4",
    name: "iPad Pro M4 (2024)",
    image_url: "https://placehold.co/600x450/e8f0fe/1a56db?text=iPad+Pro",
    price: 16999000,
    price_formatted: "Rp16.999.000",
    marketplace: "tokopedia",
    store_name: "iBox Official",
    store_badge: "official",
    rating: 4.9,
    score: 9.2,
    pros: ["Layar OLED Tandem menawan", "Performa chip M4 kelas laptop"],
    cons: ["Aksesori mahal"],
    ai_reasoning: "Tablet paling powerful untuk kreator digital di Indonesia.",
    product_url: "https://www.tokopedia.com",
    is_editor_choice: true,
  },
  {
    id: "sony-wh1000xm5",
    name: "Sony WH-1000XM5",
    image_url: "https://placehold.co/600x450/e8f0fe/1a56db?text=WH-1000XM5",
    price: 4499000,
    price_formatted: "Rp4.499.000",
    marketplace: "shopee",
    store_name: "Sony Center",
    store_badge: "official",
    rating: 4.8,
    score: 9.0,
    pros: ["Noise cancelling terbaik di kelasnya", "Baterai 30 jam"],
    cons: ["Tidak bisa dilipat"],
    ai_reasoning: "Pilihan utama untuk pekerja hybrid yang butuh fokus.",
    product_url: "https://shopee.co.id",
    is_editor_choice: false,
  },
  {
    id: "sony-zv-e10-ii",
    name: "Sony ZV-E10 II",
    image_url: "https://placehold.co/600x450/e8f0fe/1a56db?text=ZV-E10+II",
    price: 14999000,
    price_formatted: "Rp14.999.000",
    marketplace: "blibli",
    store_name: "Sony Store",
    store_badge: "official",
    rating: 4.7,
    score: 8.8,
    pros: ["Autofokus real-time cepat", "Lensa bisa diganti"],
    cons: ["Tanpa stabilisasi bodi"],
    ai_reasoning: "Kamera terbaik untuk konten YouTube & TikTok.",
    product_url: "https://www.blibli.com",
    is_editor_choice: false,
  },
];

async function getCategories(): Promise<Category[]> {
  try {
    const { categories } = await api.getCategories();
    return categories;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const categories = await getCategories();
  const trending = categories.filter((c) => c.available).slice(0, 3);
  const comingSoon = categories.filter((c) => c.coming_soon).slice(0, 3);

  return (
    <div className="space-y-16 py-10">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          What are you looking for today?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base-content/60">
          AI advisor siap mencari deal & spesifikasi produk terbaik di Indonesia untukmu.
        </p>
        <div className="mt-8">
          <SearchBox autoFocus />
        </div>
      </section>

      <LatestSearches />

      {/* Trending Categories */}
      <section className="mx-auto max-w-6xl px-4">
        <h2 className="mb-4 text-xl font-bold">Trending Categories</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.id}`}
              className="focus-ring flex min-h-40 flex-col justify-end rounded-box bg-linear-to-br from-primary to-accent p-5 text-primary-content shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <h3 className="text-lg font-bold">{c.label}</h3>
              <p className="text-sm text-primary-content/80">
                {c.subcategories?.length
                  ? `${c.subcategories.length} subkategori`
                  : "Jelajahi produk"}
              </p>
            </Link>
          ))}

          {comingSoon.map((c) => (
            <div
              key={c.id}
              className="flex min-h-40 flex-col justify-end rounded-box border border-base-300 bg-base-100 p-5 opacity-70"
            >
              <span className="mb-1 w-fit rounded bg-base-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-base-content/50">
                Segera Hadir
              </span>
              <h3 className="text-lg font-bold text-base-content/70">{c.label}</h3>
            </div>
          ))}

          <Link
            href="/categories"
            className="focus-ring flex min-h-40 flex-col items-center justify-center gap-2 rounded-box border-2 border-dashed border-base-300 p-5 text-base-content/70 transition-colors duration-200 hover:border-primary hover:text-primary"
          >
            <LayoutGrid className="size-7" />
            <span className="font-semibold">All Categories</span>
          </Link>
        </div>
      </section>

      {/* Curated For You */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Curated For You</h2>
          <Link
            href="/categories"
            className="focus-ring flex items-center gap-1 rounded px-1 text-sm font-medium text-primary transition-colors duration-200 hover:underline"
          >
            Lihat semua <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {CURATED.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
