"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSearch } from "@/hooks/useSearch";
import { SearchBox } from "@/components/search/SearchBox";
import { ProcessingState } from "@/components/search/ProcessingState";
import { SearchResults } from "@/components/search/SearchResults";
import { ClarifyingQuestion } from "@/components/search/ClarifyingQuestion";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

function ResultsHeader({ query }: { query: string }) {
  return (
    <div className="border-b border-base-300 bg-base-100">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <SearchBox initialValue={query} size="md" />
      </div>
    </div>
  );
}

function SearchView() {
  const params = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const { status, data, run } = useSearch();
  // Guards against React Strict Mode's dev-only double-invoke of effects,
  // which would otherwise fire the same search twice (double API cost + rate-limit usage).
  const lastRunQuery = useRef<string | null>(null);

  useEffect(() => {
    if (!q || lastRunQuery.current === q) return;
    lastRunQuery.current = q;
    run({ query: q });
  }, [q, run]);

  // No query in the URL — invite the user to search.
  if (!q) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="mb-6 text-2xl font-bold">Mau cari apa hari ini?</h1>
        <SearchBox autoFocus />
      </div>
    );
  }

  if (status !== "done" || data === null) {
    return <ProcessingState query={q} />;
  }

  switch (data.type) {
    case "success":
      return (
        <>
          <ResultsHeader query={q} />
          {data.products.length === 0 ? (
            <EmptyState query={q} />
          ) : (
            <SearchResults data={data} query={q} />
          )}
        </>
      );
    case "clarifying":
      return (
        <ClarifyingQuestion
          data={data}
          onAnswer={(clarification) => run({ query: q, clarification })}
        />
      );
    case "coming_soon":
      return <ComingSoon data={data} />;
    case "error":
      return (
        <>
          <ResultsHeader query={q} />
          <ErrorState message={data.message} onRetry={() => run({ query: q })} />
        </>
      );
  }
}

export default function SearchPage() {
  return (
    <Suspense fallback={<ProcessingState query="" />}>
      <SearchView />
    </Suspense>
  );
}
