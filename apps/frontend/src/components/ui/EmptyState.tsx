import Link from "next/link";
import { SearchX } from "lucide-react";

const SUGGESTIONS = [
  "laptop gaming budget 10 juta",
  "laptop ringan untuk kuliah",
  "laptop second terbaik",
];

export function EmptyState({ query }: { query: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-base-300 text-base-content/60">
        <SearchX className="size-8" />
      </div>
      <h1 className="text-2xl font-bold">Hmm, kami tidak menemukan yang cocok</h1>
      <p className="mt-2 text-base-content/70">
        Coba perluas kriteria pencarianmu atau gunakan kata yang berbeda agar AI kami dapat
        memberikan rekomendasi terbaik.
      </p>

      {query && (
        <span className="mt-5 rounded-field bg-base-200 px-3 py-1.5 text-sm italic text-base-content/60">
          &ldquo;{query}&rdquo;
        </span>
      )}

      <div className="mt-8 w-full rounded-box border border-base-300 bg-base-100 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Coba salah satu ini
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <Link
              key={s}
              href={`/search?q=${encodeURIComponent(s)}`}
              className="focus-ring rounded-field border border-base-300 px-3 py-1.5 text-sm transition-colors duration-200 hover:border-primary hover:text-primary"
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      <Link href="/" className="btn btn-primary mt-8">
        Mulai Pencarian Baru
      </Link>
    </div>
  );
}
