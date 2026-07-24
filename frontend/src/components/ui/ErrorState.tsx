"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-error/10 text-error">
        <AlertTriangle className="size-8" />
      </div>
      <h1 className="text-xl font-bold">Terjadi gangguan</h1>
      <p className="mt-2 text-base-content/70">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn btn-primary">
            <RotateCcw className="size-4" />
            Coba lagi
          </button>
        )}
        <Link href="/" className="btn btn-ghost">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
