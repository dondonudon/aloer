export default function TablePageLoading({ rows = 8 }: { rows?: number }) {
  return (
    <div
      className="space-y-4 animate-pulse"
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40" />
      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg w-full" />
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 h-11" />
        <div className="p-4 space-y-3">
          {Array.from({ length: rows }, (_, i) => `row-${i}`).map((key) => (
            <div
              key={key}
              className="h-8 bg-gray-100 dark:bg-gray-700 rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
