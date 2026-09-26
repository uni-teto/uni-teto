import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mostrado enquanto a página do perfil busca os dados no banco
export default function ProfileLoading() {
  return (
    <main
      className="flex flex-1 justify-center px-4 py-12"
      aria-busy="true"
      aria-label="Carregando perfil"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    </main>
  );
}
