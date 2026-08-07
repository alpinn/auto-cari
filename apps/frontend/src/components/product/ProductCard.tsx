import Image from "next/image";
import Link from "next/link";
import { Check, X, Star, ExternalLink } from "lucide-react";
import type { ProductResult } from "@/lib/types";
import { cn, marketplaceBadge, storeBadgeLabel } from "@/lib/utils";

export function ProductCard({ product, fromQuery }: { product: ProductResult; fromQuery?: string }) {
  const mp = marketplaceBadge(product.marketplace);
  const store = storeBadgeLabel(product.store_badge);
  const href = fromQuery
    ? `/product/${product.id}?from=${encodeURIComponent(fromQuery)}`
    : `/product/${product.id}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link href={href} className="focus-ring relative block aspect-4/3 bg-base-200">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain p-4"
        />
        {/* Category-browsing products are never AI-ranked (score always 0) — hide the badge instead of showing a misleading "0.0/10". */}
        {product.score > 0 && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-field bg-neutral/90 px-2 py-1 text-xs font-semibold text-neutral-content">
            <Star className="size-3 fill-warning text-warning" />
            {product.score.toFixed(1)}/10
          </span>
        )}
        {product.is_editor_choice && (
          <span className="absolute left-2 top-2 rounded-field bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-content">
            Pilihan Editor
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded px-2 py-0.5 text-[11px] font-semibold", mp.className)}>
            {mp.label}
          </span>
          {store && (
            <span className="rounded bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/70">
              {store}
            </span>
          )}
        </div>

        <Link
          href={href}
          className="focus-ring line-clamp-2 min-h-11 rounded font-semibold leading-snug transition-colors duration-200 hover:text-primary"
        >
          {product.name}
        </Link>

        <p className="text-lg font-bold text-primary tabular-nums">{product.price_formatted}</p>

        <div className="space-y-1 text-sm">
          {product.pros.slice(0, 2).map((p, i) => (
            <div key={`pro-${i}`} className="flex items-start gap-1.5">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              <span className="text-base-content/80">{p}</span>
            </div>
          ))}
          {product.cons.slice(0, 1).map((c, i) => (
            <div key={`con-${i}`} className="flex items-start gap-1.5">
              <X className="mt-0.5 size-4 shrink-0 text-error" />
              <span className="text-base-content/60">{c}</span>
            </div>
          ))}
        </div>

        {product.ai_reasoning && (
          <p className="line-clamp-3 border-l-2 border-primary pl-3 text-sm italic text-primary/90">
            {product.ai_reasoning}
          </p>
        )}

        <a
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-sm mt-auto"
        >
          Lihat di {mp.label}
          <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  );
}
