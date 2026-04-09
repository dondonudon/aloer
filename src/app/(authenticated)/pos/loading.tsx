// Streamed while POS product/campaign data loads.
export default function POSLoading() {
  return (
    <div
      className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)] animate-pulse"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading POS…</span>
      {/* Product grid skeleton */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-3" />
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg w-full" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(
              [
                "p1",
                "p2",
                "p3",
                "p4",
                "p5",
                "p6",
                "p7",
                "p8",
                "p9",
                "p10",
                "p11",
                "p12",
              ] as const
            ).map((k) => (
              <div
                key={k}
                className="h-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            ))}
          </div>
        </div>
      </div>
      {/* Cart skeleton */}
      <div className="w-full lg:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl h-64 lg:h-auto" />
    </div>
  );
}
