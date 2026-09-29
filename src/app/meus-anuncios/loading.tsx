import { Skeleton } from "@/components/ui/skeleton";

// Mesmo formato da lista de Meus anúncios, enquanto busca no banco
export default function MyListingsLoading() {
  return (
    <main
      className="mx-auto w-full max-w-4xl flex-1 px-4 py-10"
      aria-busy="true"
      aria-label="Carregando meus anúncios"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row"
          >
            <Skeleton className="aspect-[4/3] w-full shrink-0 rounded-lg sm:w-40" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full max-w-sm" />
              <Skeleton className="h-3 w-40" />
              <div className="mt-auto flex gap-2 pt-2">
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
