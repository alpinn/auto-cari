import { Sparkles } from "lucide-react";
import type { SearchSuccessResponse } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";

interface SearchResultsProps {
  data: SearchSuccessResponse;
  query: string;
}

export function SearchResults({ data, query }: SearchResultsProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
        Hasil Pencarian AI
      </p>
      <h1 className="mt-1 text-2xl font-bold">
        Menampilkan rekomendasi untuk:{" "}
        <span className="italic text-primary">&ldquo;{query}&rdquo;</span>
      </h1>

      {data.summary && (
        <div className="mt-4 flex gap-3 rounded-box border border-primary/20 bg-primary/5 p-4">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm text-base-content/80">{data.summary}</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.products.map((p) => (
          <ProductCard key={p.id} product={p} fromQuery={query} />
        ))}
      </div>

      <div className="mt-10 border-t border-base-300 pt-6 text-sm text-base-content/60">
        {data.sources.length > 0 && (
          <p className="mb-2">
            <span className="font-semibold text-base-content/70">Sumber data analisis:</span>{" "}
            {data.sources.join(" · ")}
          </p>
        )}
        <p className="text-xs">
          Disclaimer: Harga & ketersediaan produk dapat berubah sewaktu-waktu di masing-masing
          marketplace. Rekomendasi AI bersifat membantu, keputusan akhir ada di tangan Anda.
        </p>
      </div>
    </div>
  );
}
