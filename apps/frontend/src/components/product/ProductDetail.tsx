import Image from "next/image";
import { Check, X, Sparkles, ImageOff } from "lucide-react";
import type { ProductDetail as ProductDetailType } from "@/lib/types";
import { PriceComparison } from "./PriceComparison";
import { ScoreBar, sentimentLabel } from "./ScoreBar";

const BADGE_LABELS: Record<string, string> = {
  official_store: "Toko Resmi",
  high_performance: "Performa Tinggi",
};

function badgeLabel(code: string): string {
  return BADGE_LABELS[code] ?? code.replace(/_/g, " ");
}

export function ProductDetail({ product }: { product: ProductDetailType }) {
  const sentimentEntries = Object.entries(product.sentiment);
  const hasSpecs = Object.keys(product.specifications).length > 0;
  const hasFitReasons = product.fit_reasons.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Hero */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="relative aspect-4/3 overflow-hidden rounded-box bg-base-200">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-4"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-base-content/30">
              <ImageOff className="size-10" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {product.badges.map((b) => (
              <span
                key={b}
                className="rounded-field bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
              >
                {badgeLabel(b)}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-bold leading-snug">{product.name}</h1>
          {product.description && (
            <p className="text-sm text-base-content/70">{product.description}</p>
          )}
          <div className="mt-2">
            <PriceComparison prices={product.prices} />
          </div>
        </div>
      </div>

      {/* Why this fits */}
      {product.why_this_fits && (
        <section className="rounded-box border border-primary/20 bg-primary/5 p-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" /> Kenapa produk ini cocok untukmu
          </h2>
          <p className="text-sm text-base-content/80">{product.why_this_fits}</p>

          {hasFitReasons && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {product.fit_reasons.map((r, i) => (
                <div key={i} className="rounded-box bg-base-100 p-3 text-sm">
                  <p className="font-medium">{r.title}</p>
                  {r.description !== r.title && (
                    <p className="mt-1 text-base-content/60">{r.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sentiment + Pros&Cons */}
      {(sentimentEntries.length > 0 || product.pros.length > 0 || product.cons.length > 0) && (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {sentimentEntries.length > 0 && (
            <div className="space-y-4 rounded-box border border-base-300 bg-base-100 p-5">
              <h2 className="font-semibold">Ringkasan Sentimen AI</h2>
              {sentimentEntries.map(([key, s]) => (
                <ScoreBar
                  key={key}
                  label={sentimentLabel(key)}
                  score={s.score}
                  reviewCount={s.review_count}
                />
              ))}
            </div>
          )}

          {(product.pros.length > 0 || product.cons.length > 0) && (
            <div className="space-y-3 rounded-box border border-base-300 bg-base-100 p-5">
              <h2 className="font-semibold">Kelebihan &amp; Kekurangan</h2>
              {product.pros.map((p, i) => (
                <div key={`pro-${i}`} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{p}</span>
                </div>
              ))}
              {product.cons.map((c, i) => (
                <div key={`con-${i}`} className="flex items-start gap-2 text-sm">
                  <X className="mt-0.5 size-4 shrink-0 text-error" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Specifications */}
      {hasSpecs && (
        <section className="rounded-box border border-base-300 bg-base-100 p-5">
          <h2 className="mb-3 font-semibold">Spesifikasi Lengkap</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {Object.entries(product.specifications).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-base-200 py-1 text-sm">
                <dt className="text-base-content/60">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {product.sources.length > 0 && (
        <p className="text-xs text-base-content/50">
          Sumber: {product.sources.join(" · ")}
        </p>
      )}
    </div>
  );
}
