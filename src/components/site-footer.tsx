import Link from "next/link";
import { PRIVACY_PATH } from "@/lib/auth/routes";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>UniTeto · moradia estudantil perto do campus</p>
        <p className="flex flex-wrap gap-x-3">
          <span>Projeto de TCC de Sistemas para Internet</span>
          <Link
            href={PRIVACY_PATH}
            className="underline-offset-4 hover:underline"
          >
            Privacidade
          </Link>
        </p>
      </div>
    </footer>
  );
}
