import { SalesReportClient } from "@/components/reports/sales-report-client";
import { PageHeader } from "@/components/ui/page-header";
import { getSalesSummary } from "@/lib/actions/reports";

export default async function SalesReportPage() {
  const summary = await getSalesSummary();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sales Summary"
        backHref="/reports"
        backLabel="Reports"
      />

      <SalesReportClient summary={summary} />
    </div>
  );
}
