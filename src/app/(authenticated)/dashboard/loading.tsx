// Streamed while dashboard data fetches. Next.js wraps this in a Suspense boundary automatically.
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-live="polite">
      <span className="sr-only">Loading dashboard…</span>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(["a", "b", "c", "d"] as const).map((k) => (
          <div
            key={k}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-20"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        </div>
        <div className="p-4 space-y-3">
          {(["r1", "r2", "r3", "r4", "r5", "r6", "r7"] as const).map((k) => (
            <div key={k} className="h-8 bg-gray-100 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
