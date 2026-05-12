import { Skeleton } from "../ui/skeleton";

export function CompanySkeleton() {
  return (
    <div className="w-full">
      {/* Hero */}
      <Skeleton className="h-[180px] w-full rounded-xl md:h-[220px]" />

      {/* Avatar + Header */}
      <div className="relative z-10 mt-4 flex flex-col gap-4 pb-2 md:mt-5 md:flex-row md:items-center md:gap-6">
        <Skeleton className="size-20 rounded-full md:size-24" />

        <div className="flex min-w-0 flex-1 flex-col gap-2 md:pb-1">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 md:h-10" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <Skeleton className="mb-3 h-3 w-12" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        <div className="md:col-span-4">
          <Skeleton className="mb-3 h-3 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      {/* Jobs */}
      <div className="mt-12 border-t border-border pt-6">
        <Skeleton className="mb-4 h-3 w-10" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-border p-4"
            >
              <Skeleton className="size-10 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
