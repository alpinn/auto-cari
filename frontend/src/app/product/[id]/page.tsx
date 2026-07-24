import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ErrorState } from "@/components/ui/ErrorState";

interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref = from ? `/search?q=${encodeURIComponent(from)}` : "/";
  const backLabel = from ? "Kembali ke Rekomendasi" : "Kembali ke Beranda";

  let product;
  try {
    product = await api.getProduct(id);
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "Produk tidak ditemukan atau sudah kedaluwarsa.";
    return (
      <div>
        <div className="mx-auto max-w-4xl px-4 pt-6">
          <Link
            href={backHref}
            className="focus-ring flex w-fit items-center gap-1 rounded text-sm text-base-content/70 hover:text-primary"
          >
            <ChevronLeft className="size-4" /> {backLabel}
          </Link>
        </div>
        <ErrorState message={message} />
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <Link
          href={backHref}
          className="focus-ring flex w-fit items-center gap-1 rounded text-sm text-base-content/70 hover:text-primary"
        >
          <ChevronLeft className="size-4" /> {backLabel}
        </Link>
      </div>
      <ProductDetail product={product} />
    </div>
  );
}
