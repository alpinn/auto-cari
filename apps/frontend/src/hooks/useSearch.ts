"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { SearchRequest, SearchResponse } from "@/lib/types";

export type SearchStatus = "idle" | "loading" | "done";

export function useSearch() {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [data, setData] = useState<SearchResponse | null>(null);

  const run = useCallback(async (body: SearchRequest) => {
    setStatus("loading");
    setData(null);
    try {
      const res = await api.search(body);
      setData(res);
    } catch {
      // Network / unexpected failure — synthesize the error contract shape.
      setData({
        type: "error",
        code: "NETWORK",
        message: "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
      });
    } finally {
      setStatus("done");
    }
  }, []);

  return { status, data, run };
}
