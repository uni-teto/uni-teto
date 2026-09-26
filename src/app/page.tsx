import {
  MapPinIcon,
  MessageCircleIcon,
  RulerIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const steps = [
  {
    icon: ShieldCheckIcon,
    title: "Só estudantes",
    text: "O cadastro exige o e-mail institucional da sua universidade.",
  },
  {
    icon: RulerIcon,
    title: "Distância real",
    text: "Os anúncios mostram a distância de verdade até o seu campus, não só o bairro.",
  },
  {
    icon: MessageCircleIcon,
    title: "Contato direto",
    text: "Achou um lugar? Fale com quem anunciou pelo WhatsApp ou e-mail.",
  },
];

export default async function Home() {
  const [session, campuses] = await Promise.all([
    getSession(),
    prisma.campus.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        university: { select: { acronym: true } },
      },
      orderBy: [{ university: { acronym: "asc" } }, { name: "asc" }],
    }),
  ]);

  return (
    <main className="flex-1">
      <section className="border-b bg-muted/40">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Encontre moradia perto do seu campus
          </h1>
          <p className="max-w-xl text-lg text-balance text-muted-foreground">
            Quartos, vagas em repúblicas e quitinetes para universitários,
            ordenados pela distância real até a sua universidade.
          </p>
          {session ? (
            <Link href="/perfil" className={buttonVariants({ size: "lg" })}>
              Completar meu perfil
            </Link>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/cadastro" className={buttonVariants({ size: "lg" })}>
                Criar conta grátis
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Já tenho conta
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold">Como funciona</h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border p-5">
              <Icon className="mb-3 size-5 text-primary" aria-hidden />
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Quando a busca existir (Frente B), cada campus pode levar à listagem */}
      {campuses.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <h2 className="mb-6 text-xl font-semibold">Campi atendidos</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {campuses.map((campus) => (
              <li
                key={campus.id}
                className="flex items-start gap-3 rounded-xl border p-4"
              >
                <MapPinIcon
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div>
                  <p className="font-medium">
                    {campus.university.acronym} · {campus.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {campus.city}, {campus.state}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
