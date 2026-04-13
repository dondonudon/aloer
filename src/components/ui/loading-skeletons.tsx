type LoadingShellProps = {
  children: React.ReactNode;
  className?: string;
  role?: string;
  label?: string;
};

function joinClassNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function LoadingShell({
  children,
  className,
  role = "status",
  label = "Loading",
}: LoadingShellProps) {
  return (
    <div
      className={joinClassNames("animate-pulse", className)}
      role={role}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function SkeletonBlock({ className }: { className: string }) {
  return <div className={className} aria-hidden="true" />;
}

export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={joinClassNames(
        "rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        className,
      )}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

function createSkeletonKeys(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`);
}

export function SkeletonSection({
  className,
  titleWidth = "w-40",
  contentRows = 3,
}: {
  className?: string;
  titleWidth?: string;
  contentRows?: number;
}) {
  return (
    <div className={joinClassNames("space-y-3", className)} aria-hidden="true">
      <SkeletonBlock
        className={`h-5 rounded bg-gray-200 dark:bg-gray-700 ${titleWidth}`}
      />
      <div className="space-y-3">
        {createSkeletonKeys("section-row", contentRows).map((key) => (
          <SkeletonBlock
            key={key}
            className="h-8 rounded bg-gray-100 dark:bg-gray-700"
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 8,
  titleWidth = "w-40",
}: {
  rows?: number;
  titleWidth?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-5 dark:border-gray-700">
        <SkeletonBlock
          className={`h-5 rounded bg-gray-200 dark:bg-gray-700 ${titleWidth}`}
        />
      </div>
      <div className="space-y-3 p-4">
        {createSkeletonKeys("table-row", rows).map((key) => (
          <SkeletonBlock
            key={key}
            className="h-8 rounded bg-gray-100 dark:bg-gray-700"
          />
        ))}
      </div>
    </div>
  );
}

export function TablePageLoading({ rows = 8 }: { rows?: number }) {
  return (
    <LoadingShell className="space-y-4" label="Loading">
      <SkeletonBlock className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-700" />
      <SkeletonBlock className="h-10 w-full rounded-lg bg-gray-100 dark:bg-gray-800" />
      <SkeletonTable rows={rows} titleWidth="w-full" />
    </LoadingShell>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <LoadingShell className="space-y-6" label="Loading dashboard…">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-40 rounded bg-gray-200 dark:bg-gray-700" />
        <SkeletonBlock className="h-4 w-56 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {createSkeletonKeys("stat", 4).map((key) => (
          <SkeletonCard key={key} className="h-20 p-5">
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
            <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          </SkeletonCard>
        ))}
      </div>

      <SkeletonTable rows={7} titleWidth="w-48" />

      <SkeletonCard className="h-28 border-orange-200 bg-orange-50 dark:border-orange-700/50 dark:bg-orange-900/20" />
    </LoadingShell>
  );
}

export function PosLoadingSkeleton() {
  return (
    <LoadingShell
      className="flex h-[calc(100vh-6rem)] flex-col gap-4 lg:flex-row"
      label="Loading POS…"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-4 space-y-3">
          <SkeletonBlock className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-700" />
          <SkeletonBlock className="h-10 w-full rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-hidden sm:grid-cols-3 md:grid-cols-4">
          {createSkeletonKeys("product", 12).map((key) => (
            <SkeletonCard key={key} className="h-24" />
          ))}
        </div>
      </div>
      <SkeletonCard className="h-64 w-full lg:h-auto lg:w-96" />
    </LoadingShell>
  );
}
