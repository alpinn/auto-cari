"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Jelajahi" },
  { href: "/how-it-works", label: "Cara Kerja" },
  { href: "/about-ai", label: "Tentang AI" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Close the mobile menu whenever the route changes (adjust state during
  // render on prop change, per React's guidance, instead of an effect).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

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
            aria-label="Notifikasi"
            className="btn btn-ghost btn-circle"
          >
            <Bell className="size-5" />
          </button>
          <button
            type="button"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="btn btn-ghost btn-circle md:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <ul className="border-t border-base-300 bg-base-100 px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={cn(
                  "focus-ring block rounded-field px-3 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-base-200",
                  isActive(l.href) ? "text-primary" : "text-base-content/70",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
