"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import { useI18n } from "@/lib/i18n/context";
import type { Category } from "@/lib/types";

interface CategoriesClientProps {
  categories: Category[];
}

/**
 * Category management component for the settings page.
 */
export function CategoriesClient({ categories }: CategoriesClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setModalOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    let result: { error?: string; success?: boolean };
    if (editing) {
      result = await updateCategory(editing.id, formData);
    } else {
      result = await createCategory(formData);
    }

    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({
        message: editing
          ? t.settings.categoryUpdated
          : t.settings.categoryCreated,
        type: "success",
      });
      setModalOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.settings.categories}
        </h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.settings.newCategory}
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-gray-400">{t.settings.noCategoriesYet}</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                  {t.common.name}
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
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">
                    {cat.name}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        cat.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {cat.is_active ? t.common.active : t.common.inactive}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="text-blue-600 hover:text-blue-700"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t.settings.editCategory : t.settings.newCategory}
      >
        <form action={handleSubmit} className="space-y-4">
          <Input
            label={t.settings.categoryName}
            name="name"
            required
            maxLength={50}
            defaultValue={editing?.name ?? ""}
            placeholder={t.settings.categoryPlaceholder}
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
    </section>
  );
}
