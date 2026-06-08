import { Skeleton } from "../ui/skeleton";

export function ProfileSkeleton() {
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
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-5 pt-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <Skeleton className="h-9 w-28 self-start rounded-full md:ml-auto md:self-center" />
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
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12 w-full">
        <div className="flex gap-1">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        <div className="mt-6 space-y-4">
          {["row-1", "row-2", "row-3"].map((key) => (
            <div
              key={key}
              className="flex gap-3 rounded-lg border border-border p-4"
            >
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
