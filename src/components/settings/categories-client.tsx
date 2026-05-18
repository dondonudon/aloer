"use client";

import { Pencil, Plus, Search, SlidersHorizontal, X } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const visibleCategories = categories.filter((c) => {
    if (activeFilter === "true" && !c.is_active) return false;
    if (activeFilter === "false" && c.is_active) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()))
      return false;
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

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              aria-hidden="true"
            />
            <Input
              placeholder={t.filter.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label={t.filter.search}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              filtersOpen || activeFilter
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300"
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {t.filter.filters}
            {activeFilter && (
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold">
                1
              </span>
            )}
          </button>
        </div>
        {activeFilter && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
              {activeFilter === "true" ? t.common.active : t.common.inactive}
              <button
                type="button"
                onClick={() => setActiveFilter("")}
                className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-700"
                aria-label="Remove status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
        {filtersOpen && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <ActiveFilter value={activeFilter} onChange={setActiveFilter} />
              {activeFilter && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("")}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 ml-auto"
                >
                  {t.filter.clear}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

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
            onInput={(e) => {
              const el = e.currentTarget as HTMLInputElement;
              el.value = el.value.toUpperCase();
            }}
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
