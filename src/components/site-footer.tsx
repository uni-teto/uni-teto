import Link from "next/link";
import { NEW_LISTING_PATH, PRIVACY_PATH, SEARCH_PATH } from "@/lib/auth/routes";
import { Logo } from "./logo";

const links = [
  { href: SEARCH_PATH, label: "Ver anúncios" },
  { href: NEW_LISTING_PATH, label: "Publicar anúncio" },
  { href: PRIVACY_PATH, label: "Privacidade" },
];

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-gold bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Logo variant="symbol" inverted className="h-12" />
          <div>
            <p className="font-heading text-lg font-semibold">UniTeto</p>
            <p className="text-sm text-primary-foreground/70">
              Moradia estudantil perto do campus
            </p>
          </div>
        </div>

        <nav aria-label="Rodapé">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-primary-foreground/80 underline-offset-4 hover:text-primary-foreground hover:underline"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-primary-foreground/15">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-primary-foreground/60">
          Projeto de TCC de Sistemas para Internet
        </p>
      </div>
    </footer>
  );
}
