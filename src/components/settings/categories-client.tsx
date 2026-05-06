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
  const [activeFilter, setActiveFilter] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const visibleCategories = categories.filter((c) => {
    if (activeFilter === "true") return c.is_active;
    if (activeFilter === "false") return !c.is_active;
    return true;
  });

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

      <ActiveFilter value={activeFilter} onChange={setActiveFilter} />

      {(() => {
        const columns: DataTableColumn<Category>[] = [
          {
            id: "name",
            header: t.common.name,
            cellClassName: "text-gray-900 dark:text-gray-100 font-medium",
            cell: (c) => c.name,
          },
          {
            id: "status",
            header: t.common.status,
            align: "center",
            cell: (c) => <StatusBadge active={c.is_active} />,
          },
          {
            id: "actions",
            header: t.common.actions,
            align: "center",
            cell: (c) => (
              <button
                type="button"
                onClick={() => openEdit(c)}
                className="text-blue-600 hover:text-blue-700"
                aria-label={`Edit ${c.name}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
            ),
          },
        ];
        return (
          <DataTable
            columns={columns}
            rows={visibleCategories}
            rowKey={(c) => c.id}
            emptyMessage={t.settings.noCategoriesYet}
          />
        );
      })()}

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
