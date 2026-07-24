"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { addLatestSearch, cn } from "@/lib/utils";

interface SearchBoxProps {
  initialValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  size?: "md" | "lg";
  className?: string;
}

export function SearchBox({
  initialValue = "",
  placeholder = "Tanya AI, contoh: laptop buat coding budget 8 juta",
  autoFocus = false,
  size = "lg",
  className,
}: SearchBoxProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    addLatestSearch(q);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full items-center gap-2 rounded-box border border-base-300 bg-base-100 p-2 shadow-sm transition-colors duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30",
        size === "lg" ? "pl-4" : "pl-3",
        className,
      )}
    >
      <Sparkles
        className={cn(
          "shrink-0 text-primary",
          size === "lg" ? "size-5" : "size-4",
        )}
      />
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Kotak pencarian"
        className={cn(
          "min-w-0 flex-1 bg-transparent outline-none placeholder:text-base-content/40",
          size === "lg" ? "text-base" : "text-sm",
        )}
      />
      <button
        type="submit"
        className={cn(
          "btn btn-primary shrink-0",
          size === "lg" ? "" : "btn-sm",
        )}
      >
        Tanya AI
      </button>
    </form>
  );
}
