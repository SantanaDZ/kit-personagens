import { Skeleton } from '@/components/ui/skeleton'

export default function CatalogLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-5 py-12 max-w-6xl">
        <Skeleton className="h-6 w-20 mb-4" />
        <div className="mb-10 text-center space-y-3">
          <Skeleton className="mx-auto h-8 w-72 max-w-full" />
          <Skeleton className="mx-auto h-5 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-xl border">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="flex-1 space-y-2 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="p-4 pt-0">
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
