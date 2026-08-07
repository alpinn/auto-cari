// Label for known sentiment keys the backend may send; unknown keys fall back to a titlecased version of the key itself.
const LABELS: Record<string, string> = {
  overall_quality: "Kualitas Keseluruhan",
  display_quality: "Kualitas Layar",
  build_design: "Desain & Build",
  value_for_money: "Value for Money",
};

function labelFor(key: string): string {
  return LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ScoreBarProps {
  label: string;
  score: number;
  reviewCount?: number;
}

export function ScoreBar({ label, score, reviewCount }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-base-content/60">
          {score.toFixed(1)}/10
          {reviewCount ? ` · ${reviewCount} ulasan` : ""}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-base-300">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function sentimentLabel(key: string): string {
  return labelFor(key);
}
