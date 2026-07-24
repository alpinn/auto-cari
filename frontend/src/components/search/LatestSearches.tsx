"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { clearLatestSearches, getLatestSearches } from "@/lib/utils";

export function LatestSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    // localStorage is client-only, so read it after mount (avoids SSR hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearches(getLatestSearches());
  }, []);

  if (searches.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-base-content/70">
          <Clock className="size-4" /> Latest Searches
        </h2>
        <button
          type="button"
          onClick={() => {
            clearLatestSearches();
            setSearches([]);
          }}
          className="focus-ring rounded px-1 text-sm text-primary transition-colors duration-200 hover:underline"
        >
          Clear history
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((q) => (
          <Link
            key={q}
            href={`/search?q=${encodeURIComponent(q)}`}
            className="focus-ring rounded-field border border-base-300 bg-base-100 px-3 py-1.5 text-sm text-base-content/80 transition-colors duration-200 hover:border-primary hover:text-primary"
          >
            {q}
          </Link>
        ))}
      </div>
    </section>
  );
}
