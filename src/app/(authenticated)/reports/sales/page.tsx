import { SalesReportClient } from "@/components/reports/sales-report-client";
import { PageHeader } from "@/components/ui/page-header";
import { getSalesSummary } from "@/lib/actions/reports";
import { getServerTranslations } from "@/lib/i18n/server";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SalesReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const paymentType = params.paymentType ?? "";

  const [summary, t] = await Promise.all([
    getSalesSummary(undefined, undefined, undefined, paymentType || undefined),
    getServerTranslations(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.reports.salesSummary}
        backHref="/reports"
        backLabel={t.reports.title}
      />

      <SalesReportClient summary={summary} paymentType={paymentType} />
    </div>
  );
}
