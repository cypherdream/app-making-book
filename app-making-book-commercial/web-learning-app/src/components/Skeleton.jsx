export default function Skeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex">
      <div className="w-72 border-r border-[var(--border)] p-4 space-y-3">
        <div className="h-4 w-32 bg-[var(--bg-hover)] rounded animate-pulse" />
        <div className="h-8 bg-[var(--bg-input)] rounded animate-pulse" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-7 bg-[var(--bg-input)] rounded animate-pulse" />
        ))}
      </div>
      <div className="flex-1 p-10 space-y-4 max-w-2xl">
        <div className="h-6 w-2/3 bg-[var(--bg-hover)] rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-[var(--bg-input)] rounded animate-pulse" />
        <div className="h-24 bg-[var(--bg-input)] rounded animate-pulse" />
        <div className="h-40 bg-[var(--bg-input)] rounded animate-pulse" />
      </div>
    </div>
  );
}
