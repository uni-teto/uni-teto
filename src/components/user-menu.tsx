"use client";

import { ChevronDownIcon, LogOutIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";
import { firstName } from "@/lib/profile/name";
import { UserAvatar } from "./user-avatar";

/**
 * Menu do usuário logado no cabeçalho: avatar + primeiro nome (o nome some
 * em telas pequenas), com os links da conta e o "Sair".
 */
export function UserMenu({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image: string | null | undefined;
}) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    toast.success("Você saiu da sua conta.");
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu da conta"
        className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted"
      >
        <UserAvatar name={name} image={image} size={28} />
        <span className="hidden max-w-32 truncate sm:inline">
          Olá, {firstName(name)}
        </span>
        <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate font-medium text-foreground">
              {name}
            </span>
            <span className="block truncate font-normal">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/perfil")}>
          <UserIcon />
          Meu perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={signOut}>
          <LogOutIcon />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
