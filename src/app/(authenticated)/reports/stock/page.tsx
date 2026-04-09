import { StockReportClient } from "@/components/reports/stock-report-client";
import { PageHeader } from "@/components/ui/page-header";
import { getStockReport } from "@/lib/actions/inventory";

export default async function StockReportPage() {
  const stockReport = await getStockReport();
  const stock = Array.isArray(stockReport) ? stockReport : [];

  const categories = [
    ...new Set(
      stock
        .map((s) => ("category" in s ? (s.category as string | null) : null))
        .filter((c): c is string => c != null),
    ),
  ].sort();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Report"
        backHref="/reports"
        backLabel="Reports"
      />
      <StockReportClient stock={stock} categories={categories} />
    </div>
  );
}
