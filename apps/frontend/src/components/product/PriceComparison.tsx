import { ExternalLink } from "lucide-react";
import type { PriceInfo } from "@/lib/types";
import { marketplaceBadge } from "@/lib/utils";
import type { Marketplace } from "@/lib/types";

export function PriceComparison({ prices }: { prices: PriceInfo[] }) {
  if (prices.length === 0) return null;

  // Only meaningful once there's more than one listing to compare — with a
  // single entry, "lowest price" is trivially true and not worth a badge.
  const showLowestBadge = prices.length > 1;

  return (
    <div className="space-y-2">
      {prices.map((p, i) => {
        const mp = marketplaceBadge(p.marketplace as Marketplace);
        return (
          <a
            key={`${p.marketplace}-${i}`}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring flex items-center justify-between gap-3 rounded-box border border-base-300 bg-base-100 p-3 transition-colors duration-200 hover:border-primary"
          >
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${mp.className}`}>
                {mp.label}
              </span>
              {showLowestBadge && p.is_lowest && (
                <span className="rounded bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                  Harga Terendah
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary tabular-nums">{p.price_formatted}</span>
              <ExternalLink className="size-4 text-base-content/50" />
            </div>
          </a>
        );
      })}
    </div>
  );
}
