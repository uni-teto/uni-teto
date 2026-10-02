"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SEARCH_PATH } from "@/lib/auth/routes";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Início" },
  { href: SEARCH_PATH, label: "Buscar" },
];

/** Links principais do cabeçalho, com a página atual sublinhada. */
export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal" className={cn("items-center gap-6", className)}>
      {LINKS.map(({ href, label }) => {
        const current =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "relative py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              current &&
                "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
