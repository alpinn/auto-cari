import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface CategoryCardProps {
  id: string;
  label: string;
  description?: string;
  comingSoon?: boolean;
}

export function CategoryCard({ id, label, description, comingSoon }: CategoryCardProps) {
  if (comingSoon) {
    return (
      <div className="flex min-h-28 flex-col justify-between rounded-box border border-base-300 bg-base-100 p-4 opacity-60">
        <div>
          <span className="mb-1 inline-block w-fit rounded bg-base-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-base-content/50">
            Segera Hadir
          </span>
          <h3 className="font-semibold text-base-content/70">{label}</h3>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/categories/${id}`}
      className="focus-ring group flex min-h-28 flex-col justify-between rounded-box border border-base-300 bg-base-100 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
    >
      <div>
        <h3 className="font-semibold group-hover:text-primary">{label}</h3>
        {description && <p className="mt-1 text-sm text-base-content/60">{description}</p>}
      </div>
      <ChevronRight className="mt-2 size-4 text-base-content/40 group-hover:text-primary" />
    </Link>
  );
}
