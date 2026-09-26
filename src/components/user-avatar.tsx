import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarThumbnailUrl } from "@/lib/cloudinary/avatar-url";
import { initials } from "@/lib/profile/name";

/** Foto do usuário (via Cloudinary) ou as iniciais do nome. */
export function UserAvatar({
  name,
  image,
  size,
  className,
}: {
  name: string;
  image: string | null | undefined;
  /** Tamanho em pixels: define a largura/altura e a imagem pedida ao Cloudinary */
  size: number;
  className?: string;
}) {
  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {image && (
        // Pede o dobro do tamanho para ficar nítido em telas de alta densidade
        <AvatarImage src={avatarThumbnailUrl(image, size * 2)} alt={name} />
      )}
      <AvatarFallback style={{ fontSize: size * 0.4 }}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
