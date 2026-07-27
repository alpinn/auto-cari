"use client";

import { useEffect, useState } from "react";
import { Sparkles, X, Scale } from "lucide-react";
import type { SearchSuccessResponse } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductComparison } from "@/components/product/ProductComparison";

interface SearchResultsProps {
  data: SearchSuccessResponse;
  query: string;
}

const MAX_COMPARE = 3;

export function SearchResults({ data, query }: SearchResultsProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    if (!compareOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCompareOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compareOpen]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX_COMPARE
          ? [...prev, id]
          : prev,
    );
  }

  const selectedProducts = data.products.filter((p) => selected.includes(p.id));
  const canCompare = data.products.length >= 2;

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

      {canCompare && (
        <p className="mt-4 text-sm text-base-content/60">
          Pilih hingga {MAX_COMPARE} produk untuk dibandingkan berdampingan.
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.products.map((p) => (
          <div key={p.id} className="relative">
            {canCompare && (
              <label className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-field bg-base-100/95 px-2 py-1 text-xs font-medium shadow-sm">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={selected.includes(p.id)}
                  onChange={() => toggle(p.id)}
                  disabled={!selected.includes(p.id) && selected.length >= MAX_COMPARE}
                  aria-label={`Bandingkan ${p.name}`}
                />
                Bandingkan
              </label>
            )}
            <ProductCard product={p} fromQuery={query} />
          </div>
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

      {selected.length >= 2 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="btn btn-primary shadow-lg"
          >
            <Scale className="size-4" />
            Bandingkan {selected.length} Produk
          </button>
        </div>
      )}

      {compareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Perbandingan produk"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setCompareOpen(false)}
        >
          <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-box bg-base-100 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Perbandingan Produk</h2>
              <button
                type="button"
                onClick={() => setCompareOpen(false)}
                aria-label="Tutup perbandingan"
                className="btn btn-ghost btn-circle btn-sm"
              >
                <X className="size-4" />
              </button>
            </div>
            <ProductComparison products={selectedProducts} />
          </div>
        </div>
      )}
    </div>
  );
}
