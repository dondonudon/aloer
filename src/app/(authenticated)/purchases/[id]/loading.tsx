import {
  LoadingShell,
  SkeletonBlock,
  SkeletonCard,
  SkeletonTable,
} from "@/components/ui/loading-skeletons";

export default function PurchaseOrderDetailLoading() {
  return (
    <LoadingShell
      className="max-w-3xl space-y-6"
      label="Loading purchase order…"
    >
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        <SkeletonBlock className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <SkeletonBlock className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700" />

      <SkeletonCard className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["status", "supplier", "payment", "total"] as const).map((key) => (
            <div key={key} className="space-y-2">
              <SkeletonBlock className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
              <SkeletonBlock className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <SkeletonTable rows={5} titleWidth="w-24" />
    </LoadingShell>
  );
}
