"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hammer, Compass, MapPin, LayoutGrid } from "lucide-react";

const NAV = [
  { href: "/tools/enchantments", label: "Enchantments", icon: Hammer },
  { href: "/tools/coordinates", label: "Coordinates", icon: Compass },
  { href: "/tools/locator-color", label: "Locator Color", icon: MapPin },
  { href: "/tools", label: "All Tools", icon: LayoutGrid },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md border border-[var(--color-border-bright)] bg-[var(--color-green-950)] text-[var(--color-green-400)] transition-colors group-hover:border-[var(--color-green-500)]">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="pixelated">
              <path d="M3 13V9L8 3L13 9V13H10V10H6V13H3Z" fill="currentColor" />
            </svg>
          </span>
          <span className="font-mono text-[15px] font-bold tracking-tight text-[var(--color-ink-50)]">
            GROVUS<span className="text-[var(--color-green-400)]">.</span>TOOLS
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/tools" && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
                  active
                    ? "bg-[var(--color-green-950)] text-[var(--color-green-400)]"
                    : "text-[var(--color-ink-400)] hover:bg-white/5 hover:text-[var(--color-ink-50)]"
                }`}
              >
                <Icon size={15} strokeWidth={2} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
