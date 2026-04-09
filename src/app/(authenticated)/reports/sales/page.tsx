import { SalesReportClient } from "@/components/reports/sales-report-client";
import { PageHeader } from "@/components/ui/page-header";
import { getSalesSummary } from "@/lib/actions/reports";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function SalesReportPage() {
  const [summary, t] = await Promise.all([
    getSalesSummary(),
    getServerTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.reports.salesSummary}
        backHref="/reports"
        backLabel={t.reports.title}
      />

      <SalesReportClient summary={summary} />
    </div>
  );
}
