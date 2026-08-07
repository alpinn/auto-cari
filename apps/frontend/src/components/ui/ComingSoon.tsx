"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Rocket, ArrowRight, Check } from "lucide-react";
import type { SearchComingSoonResponse } from "@/lib/types";

// No backend waitlist route exists yet — persist to localStorage only (per doc + backend notes).
function saveWaitlist(category: string, email: string) {
  if (typeof window === "undefined") return;
  try {
    const key = "autocari:waitlist";
    const list = JSON.parse(window.localStorage.getItem(key) || "[]") as unknown[];
    list.push({ category, email, at: Date.now() });
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function ComingSoon({ data }: { data: SearchComingSoonResponse }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    saveWaitlist(data.detected_category, email.trim());
    setDone(true);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <span className="mb-6 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
        Segera Hadir
      </span>
      <div className="mb-6 flex size-20 items-center justify-center rounded-box bg-base-200 text-primary">
        <Rocket className="size-9" />
      </div>
      <h1 className="text-2xl font-bold">Kategori ini sedang kami siapkan!</h1>
      <p className="mt-2 text-base-content/70">{data.message}</p>

      {done ? (
        <div className="mt-8 flex items-center gap-2 rounded-box bg-success/10 px-4 py-3 text-success">
          <Check className="size-5" />
          <span className="text-sm font-medium">Terima kasih! Kami akan mengabarimu saat tersedia.</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 flex w-full max-w-sm items-center gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Anda"
            aria-label="Email untuk notifikasi"
            autoComplete="email"
            className="input input-bordered flex-1 focus:border-primary"
          />
          <button type="submit" className="btn btn-primary">
            Ingatkan Saya
          </button>
        </form>
      )}

      <Link
        href="/categories/electronics"
        className="focus-ring mt-8 flex items-center gap-1 rounded px-1 font-medium text-primary transition-colors duration-200 hover:underline"
      >
        Sementara itu, cari produk elektronik
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
