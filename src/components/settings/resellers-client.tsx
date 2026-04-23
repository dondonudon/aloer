"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
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
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const isEdit = !!modal.reseller;

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
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {resellers.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">
                    {r.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {r.phone || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {r.address || "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {r.is_active ? t.common.active : t.common.inactive}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
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
                  </td>
                </tr>
              ))}
              {resellers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-400 dark:text-gray-500"
                  >
                    {t.settings.noResellersYet}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
