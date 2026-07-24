import Link from "next/link";
import { Sparkles } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/about-ai", label: "Privacy Policy" },
  { href: "/about-ai", label: "Terms of Service" },
  { href: "/about-ai", label: "AI Transparency" },
  { href: "/about-ai", label: "Contact Support" },
];

export function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="size-4 text-primary" />
            <span>Autocari</span>
          </div>
          <p className="mt-1 text-sm text-base-content/60">
            © 2024 Autocari. Smart Shopping for Indonesia.
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-base-content/70">
          {FOOTER_LINKS.map((l, i) => (
            <li key={i}>
              <Link
                href={l.href}
                className="focus-ring rounded transition-colors duration-200 hover:text-primary"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
