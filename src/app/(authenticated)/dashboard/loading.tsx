import { DashboardLoadingSkeleton } from "@/components/ui/loading-skeletons";

// Streamed while dashboard data fetches. Next.js wraps this in a Suspense boundary automatically.
export default function DashboardLoading() {
  return <DashboardLoadingSkeleton />;
}
