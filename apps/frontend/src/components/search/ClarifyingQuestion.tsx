"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import type { SearchClarifyingResponse } from "@/lib/types";

interface ClarifyingQuestionProps {
  data: SearchClarifyingResponse;
  // Backend concatenates `query + clarification` as raw text, so we must pass the
  // option's human-readable label/description — NOT its id (which has no meaning server-side).
  onAnswer: (clarification: string) => void;
}

export function ClarifyingQuestion({ data, onAnswer }: ClarifyingQuestionProps) {
  const [text, setText] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (t) onAnswer(t);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {data.context && (
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          Konteks Pencarian: <span className="italic normal-case">{data.context}</span>
        </p>
      )}

      <div className="mb-6 flex gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content">
          <Sparkles className="size-5" />
        </div>
        <div className="rounded-box rounded-tl-none border border-base-300 bg-base-100 p-4">
          <p className="font-medium">{data.question}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onAnswer(opt.label)}
            className="focus-ring group flex flex-col items-start gap-1 rounded-box border border-base-300 bg-base-100 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          >
            <span className="font-semibold group-hover:text-primary">{opt.label}</span>
            <span className="text-sm text-base-content/70">{opt.description}</span>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Atau jelaskan lebih detail…"
          aria-label="Jawaban detail"
          className="input input-bordered flex-1 focus:border-primary"
        />
        <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
          Lanjutkan
          <ArrowRight className="size-4" />
        </button>
      </form>
    </div>
  );
}
