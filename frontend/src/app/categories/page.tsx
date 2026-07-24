import { api } from "@/lib/api";
import { CategoryCard } from "@/components/category/CategoryCard";

export default async function CategoriesPage() {
  const { categories } = await api.getCategories();
  const electronics = categories.find((c) => c.id === "electronics");
  const comingSoon = categories.filter((c) => c.coming_soon);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Jelajahi Berdasarkan Kategori</h1>
        <p className="mt-1 text-base-content/60">
          Pilih kategori untuk mendapatkan rekomendasi AI yang lebih spesifik.
        </p>
      </div>

      {electronics && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">{electronics.label}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(electronics.subcategories ?? []).map((sc) => (
              <CategoryCard key={sc.id} id={sc.id} label={sc.label} />
            ))}
          </div>
        </section>
      )}

      {comingSoon.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-base-content/70">Kategori Lainnya</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comingSoon.map((c) => (
              <CategoryCard key={c.id} id={c.id} label={c.label} comingSoon />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
