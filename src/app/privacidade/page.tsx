import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidade | UniTeto",
  description: "Quais dados o UniTeto guarda, quem vê cada um e como excluir.",
};

// Texto simples, para quem usa o site entender o que acontece com os dados
// (LGPD). Descreve o que o sistema faz de fato: ao mudar o que guardamos ou
// quem vê, atualize aqui.

const UPDATED_AT = "29 de setembro de 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-10 text-sm leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Política de privacidade
        </h1>
        <p className="text-muted-foreground">
          O UniTeto é um projeto de TCC que ajuda universitários a encontrar
          moradia perto do campus. Aqui explicamos quais dados guardamos, quem
          vê cada um e como apagar tudo. Atualizada em {UPDATED_AT}.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">O que guardamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Conta:</strong> nome, e-mail, tipo de conta (estudante ou
            anunciante) e, para estudantes, a universidade (descoberta pelo
            domínio do e-mail). A senha é guardada só de forma criptografada
            (hash): nem nós conseguimos lê-la.
          </li>
          <li>
            <strong>Opcionais do perfil:</strong> WhatsApp e foto.
          </li>
          <li>
            <strong>Anúncios:</strong> título, descrição, preço, vagas, endereço
            completo, fotos e a localização no mapa.
          </li>
          <li>
            <strong>Sessão:</strong> enquanto você está logado, guardamos o
            endereço IP e o navegador usados no login, para manter a sessão
            segura. A sessão vence em 7 dias sem uso.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Quem vê cada dado</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Anúncios são públicos</strong>, inclusive o endereço
            completo e o mapa: qualquer pessoa, mesmo sem conta, pode vê-los.
          </li>
          <li>
            <strong>O contato de quem anuncia</strong> (nome, WhatsApp e e-mail)
            aparece <strong>só para estudantes logados</strong>, com e-mail
            institucional confirmado. Visitantes e anunciantes não recebem esses
            dados, nem no código da página.
          </li>
          <li>
            O e-mail e a universidade de estudantes não aparecem para ninguém.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Serviços que usamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Cloudinary:</strong> guarda as fotos dos anúncios e de
            perfil.
          </li>
          <li>
            <strong>OpenStreetMap (Nominatim):</strong> recebe o endereço do
            anúncio para achar a localização no mapa. Os mapas também são
            carregados do OpenStreetMap, que recebe o endereço IP de quem vê.
          </li>
          <li>
            <strong>ViaCEP:</strong> recebe o CEP digitado no formulário de
            anúncio, para preencher o endereço.
          </li>
          <li>
            <strong>E-mail:</strong> mandamos só mensagens da sua conta
            (confirmação de e-mail e redefinição de senha).
          </li>
        </ul>
        <p>
          Não usamos ferramentas de análise nem de publicidade, e não vendemos
          nem compartilhamos dados com mais ninguém. O único cookie é o da
          sessão, que mantém você logado.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Seus direitos</h2>
        <p>
          Pela Lei Geral de Proteção de Dados (LGPD), você pode ver, corrigir e
          apagar seus dados:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Ver e corrigir: em{" "}
            <Link href="/perfil" className="underline">
              Meu perfil
            </Link>{" "}
            e em{" "}
            <Link href="/meus-anuncios" className="underline">
              Meus anúncios
            </Link>
            .
          </li>
          <li>
            Apagar tudo: em Meu perfil, <strong>Excluir minha conta</strong>. A
            conta, os anúncios, as fotos e as sessões são apagados na hora.
          </li>
        </ul>
      </section>
    </main>
  );
}
