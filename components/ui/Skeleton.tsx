export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-xl bg-gradient-to-r from-canvas-soft via-white to-canvas-soft bg-[length:200%_100%] ${className}`}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-fade-up">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
