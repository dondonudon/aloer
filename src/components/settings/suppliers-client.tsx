"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
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
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.common.name}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.common.phone}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.common.address}
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.common.status}
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.common.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">
                    {supplier.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {supplier.phone || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {supplier.address || "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        supplier.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {supplier.is_active ? t.common.active : t.common.inactive}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => openEdit(supplier)}
                      className="text-blue-600 hover:text-blue-700"
                      aria-label={`Edit ${supplier.name}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-400 dark:text-gray-500"
                  >
                    {t.settings.noSuppliersYet}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
            <Button type="submit" disabled={loading}>
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
