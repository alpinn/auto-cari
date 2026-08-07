"use client";

import { useEffect, useState } from "react";
import { Sparkles, Check } from "lucide-react";

const STEPS = [
  "Memahami kebutuhanmu…",
  "Mencari produk di Tokopedia, Shopee, Lazada…",
  "Menganalisis ulasan & harga…",
  "Menyusun rekomendasi terbaik…",
];

export function ProcessingState({ query }: { query: string }) {
  const [revealed, setRevealed] = useState(1);

  useEffect(() => {
    if (revealed >= STEPS.length) return;
    const t = setTimeout(() => setRevealed((n) => n + 1), 1600);
    return () => clearTimeout(t);
  }, [revealed]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col items-center text-center">
        <p className="mb-6 text-lg font-medium italic text-primary">&ldquo;{query}&rdquo;</p>
        <div className="mb-8 flex size-14 items-center justify-center rounded-full bg-primary text-primary-content shadow-md">
          <Sparkles className="size-6 animate-pulse" />
        </div>
        <ul className="mb-10 space-y-3 text-left" aria-live="polite">
          {STEPS.slice(0, revealed).map((step, i) => {
            const isCurrent = i === revealed - 1 && revealed < STEPS.length;
            return (
              <li key={step} className="flex items-center gap-2 text-base-content/80">
                {isCurrent ? (
                  <span className="loading loading-spinner loading-xs text-primary" />
                ) : (
                  <Check className="size-4 text-success" />
                )}
                <span>{step}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Skeleton cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-box border border-base-300 bg-base-100 p-4">
            <div className="skeleton mb-4 aspect-4/3 w-full" />
            <div className="skeleton mb-2 h-4 w-3/4" />
            <div className="skeleton mb-4 h-6 w-1/2" />
            <div className="skeleton mb-2 h-3 w-full" />
            <div className="skeleton h-3 w-5/6" />
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-base-content/50">
        Biasanya selesai dalam 5–10 detik.
      </p>
    </div>
  );
}
