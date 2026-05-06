import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { RoutePagination } from "@/components/ui/route-pagination";
import { getAdjustments } from "@/lib/actions/inventory";
import { getServerTranslations } from "@/lib/i18n/server";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { formatDateTime } from "@/lib/utils";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdjustmentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.limit);
  const [adjustments, t] = await Promise.all([
    getAdjustments(),
    getServerTranslations(),
  ]);
  const { items, totalPages } = paginate(adjustments, page, pageSize);

  type Adjustment = (typeof items)[number];
  const columns: DataTableColumn<Adjustment>[] = [
    {
      id: "number",
      header: t.inventory.number,
      cellClassName: "font-mono text-gray-700 dark:text-gray-300",
      cell: (adj) => adj.adjustment_number,
    },
    {
      id: "reason",
      header: t.inventory.reason,
      cellClassName: "text-gray-900 dark:text-gray-100 capitalize",
      cell: (adj) => adj.reason,
    },
    {
      id: "notes",
      header: t.inventory.notes,
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (adj) => adj.notes || "—",
    },
    {
      id: "createdBy",
      header: t.common.createdBy,
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (adj) => adj.created_by_name || "—",
    },
    {
      id: "date",
      header: t.common.date,
      cellClassName: "text-gray-600 dark:text-gray-400",
      cell: (adj) => formatDateTime(adj.created_at),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.inventory.adjustmentHistory}
        backHref="/inventory"
        backLabel={t.inventory.title}
      >
        <Link href="/inventory/adjustments/new">
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.inventory.newAdjustment}
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(adj) => adj.id}
        emptyMessage={t.inventory.noAdjustmentsYet}
      />

      <RoutePagination
        pathname="/inventory/adjustments"
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
      />
    </div>
  );
}
