import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { PRIVACY_PATH, signInUrl } from "@/lib/auth/routes";
import { getSession } from "@/lib/auth/session";
import { getCloudinaryConfig } from "@/lib/cloudinary/sign-upload";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/profile/name";
import { SEX_LABELS } from "@/lib/profile/personal-data";
import { formatWhatsapp } from "@/lib/profile/whatsapp";
import { AvatarUploader } from "./avatar-uploader";
import { DeleteAccount } from "./delete-account";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Meu perfil | UniTeto",
};

export default async function ProfilePage() {
  const session = await getSession();
  // O proxy (src/proxy.ts) já redireciona sem cookie; aqui a sessão é validada
  if (!session) redirect(signInUrl("/perfil"));

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      name: true,
      surname: true,
      socialName: true,
      sex: true,
      email: true,
      image: true,
      whatsapp: true,
      role: true,
      university: { select: { name: true, acronym: true } },
      _count: { select: { listings: true } },
    },
  });
  const shownName = displayName(user);

  // Cartão da esquerda: como a conta está agora (só leitura)
  const details: { label: string; value: string }[] = [
    // Com nome social, o nome civil só aparece aqui, para a própria pessoa
    ...(user.socialName
      ? [
          {
            label: "Nome civil",
            value: displayName({ ...user, socialName: null }),
          },
        ]
      : []),
    { label: "E-mail", value: user.email },
    {
      label: "WhatsApp",
      value: user.whatsapp ? formatWhatsapp(user.whatsapp) : "Não informado",
    },
    { label: "Sexo", value: user.sex ? SEX_LABELS[user.sex] : "Não informado" },
    ...(user.role === "ESTUDANTE"
      ? [
          {
            label: "Universidade",
            value: user.university
              ? `${user.university.name} (${user.university.acronym})`
              : "Não vinculada",
          },
        ]
      : []),
    {
      label: "Anúncios",
      value: String(user._count.listings),
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Meu perfil</h1>

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="lg:sticky lg:top-24">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <UserAvatar name={shownName} image={user.image} size={112} />
            <div className="space-y-1.5">
              <p className="font-heading text-xl font-semibold">{shownName}</p>
              <span className="inline-flex rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground">
                {ROLE_LABELS[user.role]}
              </span>
            </div>

            <Separator />

            <dl className="w-full space-y-3 text-left text-sm">
              {details.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium break-words">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="text-xs text-muted-foreground">
              Nome, foto e WhatsApp aparecem para estudantes interessados nos
              seus anúncios.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Editar dados</h2>
              </CardTitle>
              <CardDescription>
                O tipo de conta e o e-mail não podem ser alterados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AvatarUploader
                name={shownName}
                image={user.image}
                enabled={getCloudinaryConfig() !== null}
              />

              <ProfileForm
                defaultValues={{
                  name: user.name,
                  surname: user.surname ?? "",
                  socialName: user.socialName ?? "",
                  sex: user.sex ?? ("" as "NAO_INFORMADO"),
                  whatsapp: user.whatsapp ? formatWhatsapp(user.whatsapp) : "",
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Excluir conta</h2>
              </CardTitle>
              <CardDescription>
                Apaga sua conta, seus anúncios e as fotos. Veja o que guardamos
                na{" "}
                <Link href={PRIVACY_PATH} className="font-medium underline">
                  política de privacidade
                </Link>
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteAccount listingCount={user._count.listings} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
