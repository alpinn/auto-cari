"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Explore" },
  { href: "/how-it-works", label: "How it Works" },
  { href: "/about-ai", label: "About AI" },
];

export function Navbar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="focus-ring flex items-center gap-2 rounded-field text-lg font-bold"
        >
          <Sparkles className="size-5 text-primary" />
          <span>Autocari</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={cn(
                  "focus-ring rounded-field px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-base-200",
                  isActive(l.href) ? "text-primary" : "text-base-content/70 hover:text-base-content",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* Bell — non-functional in Phase 1 */}
          <button
            type="button"
            aria-label="Notifications"
            className="btn btn-ghost btn-circle"
          >
            <Bell className="size-5" />
          </button>
        </div>
      </nav>
    </header>
  );
}
