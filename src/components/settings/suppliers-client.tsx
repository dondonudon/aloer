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
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";
import { useI18n } from "@/lib/i18n/context";
import type { Supplier } from "@/lib/types";

interface Props {
  suppliers: Supplier[];
}

export function SuppliersClient({ suppliers }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const visibleSuppliers = suppliers.filter((s) => {
    if (activeFilter === "true") return s.is_active;
    if (activeFilter === "false") return !s.is_active;
    return true;
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setModalOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = editing
      ? await updateSupplier(editing.id, formData)
      : await createSupplier(formData);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({
        message: editing
          ? t.settings.supplierUpdated
          : t.settings.supplierCreated,
        type: "success",
      });
      setModalOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.settings.suppliers}
        </h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3 w-3" aria-hidden="true" />
          {t.settings.addSupplier}
        </Button>
      </div>

      <ActiveFilter value={activeFilter} onChange={setActiveFilter} />

      {(() => {
        const columns: DataTableColumn<Supplier>[] = [
          {
            id: "name",
            header: t.common.name,
            cellClassName: "text-gray-900 dark:text-gray-100 font-medium",
            cell: (s) => s.name,
          },
          {
            id: "phone",
            header: t.common.phone,
            cellClassName: "text-gray-600 dark:text-gray-400",
            cell: (s) => s.phone || "—",
          },
          {
            id: "address",
            header: t.common.address,
            cellClassName: "text-gray-600 dark:text-gray-400",
            cell: (s) => s.address || "—",
          },
          {
            id: "status",
            header: t.common.status,
            align: "center",
            cell: (s) => <StatusBadge active={s.is_active} />,
          },
          {
            id: "actions",
            header: t.common.actions,
            align: "center",
            cell: (s) => (
              <button
                type="button"
                onClick={() => openEdit(s)}
                className="text-blue-600 hover:text-blue-700"
                aria-label={`Edit ${s.name}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
            ),
          },
        ];
        return (
          <DataTable
            columns={columns}
            rows={visibleSuppliers}
            rowKey={(s) => s.id}
            emptyMessage={t.settings.noSuppliersYet}
          />
        );
      })()}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t.settings.editSupplier : t.settings.addSupplier}
      >
        <form action={handleSubmit} className="space-y-4">
          <Input
            label={t.common.name}
            name="name"
            required
            defaultValue={editing?.name ?? ""}
          />
          <Input
            label={t.common.phone}
            name="phone"
            type="tel"
            defaultValue={editing?.phone ?? ""}
          />
          <Input
            label={t.common.address}
            name="address"
            defaultValue={editing?.address ?? ""}
          />
          {editing && (
            <Select
              label={t.common.status}
              name="is_active"
              options={[
                { value: "true", label: t.common.active },
                { value: "false", label: t.common.inactive },
              ]}
              defaultValue={String(editing.is_active)}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={loading}>
              {loading
                ? t.common.saving
                : editing
                  ? t.common.update
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
