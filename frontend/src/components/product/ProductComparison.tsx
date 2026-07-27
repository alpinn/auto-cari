import { Check, X as XIcon, ExternalLink, Star } from "lucide-react";
import type { ProductResult } from "@/lib/types";
import { marketplaceBadge } from "@/lib/utils";

export function ProductComparison({ products }: { products: ProductResult[] }) {
  if (products.length < 2) return null;

  return (
    <div className="overflow-x-auto rounded-box border border-base-300">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-32 border-b border-base-300 bg-base-200 p-3 text-left align-bottom text-xs font-semibold uppercase text-base-content/50">
              Produk
            </th>
            {products.map((p) => (
              <th
                key={p.id}
                className="border-b border-base-300 bg-base-200 p-3 text-left align-bottom"
              >
                <div className="mb-2 aspect-4/3 w-full overflow-hidden rounded-field bg-base-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnail inside a table cell, next/image fill needs a positioned wrapper we don't need here */}
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="size-full object-contain p-2"
                  />
                </div>
                <p className="line-clamp-2 font-semibold leading-snug">{p.name}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row label="Harga">
            {products.map((p) => (
              <td key={p.id} className="p-3 font-bold text-primary tabular-nums">
                {p.price_formatted}
              </td>
            ))}
          </Row>

          <Row label="Marketplace">
            {products.map((p) => {
              const mp = marketplaceBadge(p.marketplace);
              return (
                <td key={p.id} className="p-3">
                  <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${mp.className}`}>
                    {mp.label}
                  </span>
                </td>
              );
            })}
          </Row>

          {products.some((p) => p.score > 0) && (
            <Row label="Skor AI">
              {products.map((p) => (
                <td key={p.id} className="p-3">
                  {p.score > 0 ? (
                    <span className="flex items-center gap-1 font-semibold">
                      <Star className="size-3.5 fill-warning text-warning" />
                      {p.score.toFixed(1)}/10
                    </span>
                  ) : (
                    <span className="text-base-content/40">—</span>
                  )}
                </td>
              ))}
            </Row>
          )}

          <Row label="Kelebihan" align="top">
            {products.map((p) => (
              <td key={p.id} className="p-3">
                {p.pros.length > 0 ? (
                  <ul className="space-y-1">
                    {p.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-base-content/40">—</span>
                )}
              </td>
            ))}
          </Row>

          <Row label="Kekurangan" align="top">
            {products.map((p) => (
              <td key={p.id} className="p-3">
                {p.cons.length > 0 ? (
                  <ul className="space-y-1">
                    {p.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <XIcon className="mt-0.5 size-3.5 shrink-0 text-error" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-base-content/40">—</span>
                )}
              </td>
            ))}
          </Row>

          <tr>
            <td className="p-3 text-xs font-semibold uppercase text-base-content/50">Beli</td>
            {products.map((p) => {
              const mp = marketplaceBadge(p.marketplace);
              return (
                <td key={p.id} className="p-3">
                  <a
                    href={p.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    Beli di {mp.label}
                    <ExternalLink className="size-4" />
                  </a>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Row({
  label,
  align = "middle",
  children,
}: {
  label: string;
  align?: "top" | "middle";
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b border-base-200 last:border-b-0">
      <td
        className={`p-3 text-xs font-semibold uppercase text-base-content/50 ${
          align === "top" ? "align-top" : "align-middle"
        }`}
      >
        {label}
      </td>
      {children}
    </tr>
  );
}
