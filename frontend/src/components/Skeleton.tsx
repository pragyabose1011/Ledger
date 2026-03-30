export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-skeleton rounded-lg bg-slate-800/60 ${className}`} />
  );
}

export function MeetingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
      <div className="mb-4 flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5">
      <Skeleton className="h-9 w-9 rounded-xl mb-4" />
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-24 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="px-8 py-8 max-w-7xl">
      <Skeleton className="h-7 w-36 mb-2" />
      <Skeleton className="h-4 w-64 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
          <Skeleton className="h-4 w-32 mb-5" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between mb-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
          <Skeleton className="h-4 w-20 mb-5" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MeetingsPageSkeleton() {
  return (
    <div className="px-8 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl mb-6" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => <MeetingCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
