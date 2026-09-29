import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NEW_LISTING_PATH, signInUrl } from "@/lib/auth/routes";
import { getSession } from "@/lib/auth/session";
import { ListingForm } from "./listing-form";

export const metadata: Metadata = {
  title: "Criar anúncio | UniTeto",
};

// Estudantes e anunciantes podem anunciar (estudante anuncia vaga em república)
export default async function NewListingPage() {
  const session = await getSession();
  // O proxy (src/proxy.ts) já redireciona sem cookie; aqui a sessão é validada
  if (!session) redirect(signInUrl(NEW_LISTING_PATH));

  return (
    <main className="flex flex-1 justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>
            <h1>Criar anúncio</h1>
          </CardTitle>
          <CardDescription>
            Quarto, vaga em república ou quitinete. O anúncio aparece na busca
            com a distância real até cada campus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListingForm />
        </CardContent>
      </Card>
    </main>
  );
}
