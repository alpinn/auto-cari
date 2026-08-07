import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { ProductCard } from "@/components/product/ProductCard";
import { MarketIntelligence } from "@/components/category/MarketIntelligence";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { ErrorState } from "@/components/ui/ErrorState";
import { SearchBox } from "@/components/search/SearchBox";
import type { CategoryDetail, SearchComingSoonResponse } from "@/lib/types";

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

// CategoryDetail never has a "type" field, so its presence uniquely identifies
// the coming_soon variant — TS can't narrow a plain "in" check here on its own.
function isComingSoon(
  result: CategoryDetail | SearchComingSoonResponse,
): result is SearchComingSoonResponse {
  return "type" in result;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;

  let result;
  try {
    result = await api.getCategoryDetail(id);
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Kategori tidak ditemukan.";
    return <ErrorState message={message} />;
  }

  if (isComingSoon(result)) {
    return <ComingSoon data={result} />;
  }

  const category = result;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <nav className="flex items-center gap-1 text-sm text-base-content/60">
        <Link href="/" className="focus-ring rounded hover:text-primary">
          Beranda
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/categories" className="focus-ring rounded hover:text-primary">
          Semua Kategori
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-base-content">{category.label}</span>
      </nav>

      <MarketIntelligence data={category.market_intelligence} />

      <div>
        <h1 className="text-xl font-bold">{category.label}</h1>
        <p className="text-sm text-base-content/60">
          {category.match_count} produk ditemukan di {category.location}
        </p>
      </div>

      <SearchBox
        size="md"
        placeholder={`Perjelas pencarian di ${category.label}, contoh: yang RAM 16GB`}
      />

      {category.products.length === 0 ? (
        <p className="rounded-box border border-base-300 bg-base-100 p-6 text-center text-base-content/60">
          Belum ada produk untuk kategori ini saat ini.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {category.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
