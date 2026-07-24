import { TrendingUp, BadgeAlert } from "lucide-react";
import type { CategoryDetail } from "@/lib/types";

export function MarketIntelligence({ data }: { data: CategoryDetail["market_intelligence"] }) {
  return (
    <div className="rounded-box border border-primary/20 bg-primary/5 p-5">
      <h2 className="mb-2 font-semibold">Ringkasan Intelijen Pasar</h2>
      <p className="text-sm text-base-content/80">{data.summary}</p>

      {(data.trends.length > 0 || data.price_alerts.length > 0) && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.trends.length > 0 && (
            <div className="space-y-1">
              {data.trends.map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <TrendingUp className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          )}
          {data.price_alerts.length > 0 && (
            <div className="space-y-1">
              {data.price_alerts.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <BadgeAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
