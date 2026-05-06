"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ActiveFilter } from "@/components/ui/filters";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toast } from "@/components/ui/toast";
import { createReseller, updateReseller } from "@/lib/actions/resellers";
import { useI18n } from "@/lib/i18n/context";
import type { Reseller } from "@/lib/types";

interface Props {
  resellers: Reseller[];
}

/**
 * Reseller management UI — create and edit resellers.
 */
export function ResellersClient({ resellers }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const statusOptions = [
    { value: "true", label: t.common.active },
    { value: "false", label: t.common.inactive },
  ];
  const [modal, setModal] = useState<{
    open: boolean;
    reseller?: Reseller;
  }>({ open: false });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const isEdit = !!modal.reseller;

  const visibleResellers = resellers.filter((r) => {
    if (activeFilter === "true") return r.is_active;
    if (activeFilter === "false") return !r.is_active;
    return true;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    const result =
      isEdit && modal.reseller
        ? await updateReseller(modal.reseller.id, formData)
        : await createReseller(formData);
    setLoading(false);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({
        message: isEdit
          ? t.settings.resellerUpdated
          : t.settings.resellerCreated,
        type: "success",
      });
      setModal({ open: false });
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.settings.resellers}
        </h2>
        <Button size="sm" onClick={() => setModal({ open: true })}>
          <Plus className="h-3 w-3" aria-hidden="true" />
          {t.settings.addReseller}
        </Button>
      </div>

      <ActiveFilter value={activeFilter} onChange={setActiveFilter} />

      {(() => {
        const columns: DataTableColumn<Reseller>[] = [
          {
            id: "name",
            header: t.common.name,
            cellClassName: "text-gray-900 dark:text-gray-100 font-medium",
            cell: (r) => r.name,
          },
          {
            id: "phone",
            header: t.common.phone,
            cellClassName: "text-gray-600 dark:text-gray-400",
            cell: (r) => r.phone || "—",
          },
          {
            id: "address",
            header: t.common.address,
            cellClassName: "text-gray-600 dark:text-gray-400",
            cell: (r) => r.address || "—",
          },
          {
            id: "status",
            header: t.common.status,
            align: "center",
            cell: (r) => <StatusBadge active={r.is_active} />,
          },
          {
            id: "actions",
            header: "",
            align: "right",
            cell: (r) => (
              <button
                type="button"
                onClick={() => setModal({ open: true, reseller: r })}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={`Edit ${r.name}`}
              >
                <Pencil
                  className="h-3.5 w-3.5 text-gray-400"
                  aria-hidden="true"
                />
              </button>
            ),
          },
        ];
        return (
          <DataTable
            columns={columns}
            rows={visibleResellers}
            rowKey={(r) => r.id}
            emptyMessage={t.settings.noResellersYet}
          />
        );
      })()}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={isEdit ? t.settings.editReseller : t.settings.newReseller}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t.common.name}
            name="name"
            required
            defaultValue={modal.reseller?.name}
          />
          <Input
            label={t.common.phone}
            name="phone"
            type="tel"
            defaultValue={modal.reseller?.phone ?? ""}
          />
          <Input
            label={t.common.address}
            name="address"
            defaultValue={modal.reseller?.address ?? ""}
          />
          {isEdit && (
            <Select
              label="Status"
              name="is_active"
              options={statusOptions}
              defaultValue={String(modal.reseller?.is_active)}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModal({ open: false })}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={loading}>
              {loading
                ? t.common.saving
                : isEdit
                  ? t.common.save
                  : t.common.create}
            </Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
