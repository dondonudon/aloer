"use client";

import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { createProduct, updateProduct } from "@/lib/actions/products";
import type { Category, Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ProductsClientProps {
  products: Product[];
  categories: Category[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
}

function MarginBadge({
  sellingPrice,
  costPrice,
}: {
  sellingPrice: number;
  costPrice: number;
}) {
  const margin =
    sellingPrice > 0
      ? (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1)
      : "0.0";
  const marginNum = parseFloat(margin);
  const color =
    marginNum < 10
      ? "bg-red-50 text-red-700"
      : marginNum < 25
        ? "bg-yellow-50 text-yellow-700"
        : "bg-green-50 text-green-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
      title={`Cost: ${formatCurrency(costPrice)}`}
    >
      {margin}%
    </span>
  );
}

const unitOptions = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "pack", label: "Pack" },
  { value: "box", label: "Box" },
  { value: "liter", label: "Liter" },
];

export function ProductsClient({
  products,
  categories,
  total,
  page,
  pageSize,
  search: initialSearch,
}: ProductsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Debounce search → URL (skip first render)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 400);
    return () => clearTimeout(t);
  }, [search, router, pathname]);

  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const totalPages = Math.ceil(total / pageSize);

  function openCreate() {
    setEditing(null);
    setImageUrl("");
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setImageUrl(product.image_url ?? "");
    setModalOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    let result: { error?: string; success?: boolean };
    if (editing) {
      result = await updateProduct(editing.id, formData);
    } else {
      result = await createProduct(formData);
    }

    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({
        message: editing ? "Product updated" : "Product created",
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Products
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Product
        </Button>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          aria-hidden="true"
        />
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          aria-label="Search products"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  SKU
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  Category
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  Unit
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  Price
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  Bulk Price
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  Margin
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">
                  Status
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-3 px-4 font-mono text-gray-700 dark:text-gray-300">
                    {product.sku}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">
                    {product.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {product.category || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {product.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(product.selling_price)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                    {product.bulk_price
                      ? `${formatCurrency(product.bulk_price)} (≥${product.bulk_min_qty})`
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {product.latest_cost_price ? (
                      <MarginBadge
                        sellingPrice={product.selling_price}
                        costPrice={product.latest_cost_price}
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">
                        No cost data
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        product.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil
                        className="h-4 w-4 text-gray-500"
                        aria-hidden="true"
                      />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 text-center text-gray-400 dark:text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Product" : "New Product"}
      >
        <form action={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            required
            defaultValue={editing?.name}
          />
          <Input label="SKU" name="sku" required defaultValue={editing?.sku} />
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Category
              </label>
              <Link
                href="/catalog/categories"
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Manage →
              </Link>
            </div>
            <Select
              id="category"
              name="category"
              options={[
                { value: "", label: "— No Category —" },
                ...categories.map((c) => ({ value: c.name, label: c.name })),
              ]}
              defaultValue={editing?.category ?? ""}
            />
          </div>
          <Select
            label="Unit"
            name="unit"
            options={unitOptions}
            defaultValue={editing?.unit ?? "pcs"}
          />
          <Input
            label="Selling Price"
            name="selling_price"
            type="number"
            min="0"
            step="100"
            required
            defaultValue={editing?.selling_price}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bulk Price (optional)"
              name="bulk_price"
              type="number"
              min="0"
              step="100"
              defaultValue={editing?.bulk_price ?? ""}
              placeholder="e.g. 18000"
            />
            <Input
              label="Bulk Min Qty"
              name="bulk_min_qty"
              type="number"
              min="2"
              step="1"
              defaultValue={editing?.bulk_min_qty ?? ""}
              placeholder="e.g. 10"
            />
          </div>
          {editing?.latest_cost_price != null && (
            <p className="text-xs text-gray-500">
              Latest cost: {formatCurrency(editing.latest_cost_price)} · Margin:{" "}
              {(
                ((editing.selling_price - editing.latest_cost_price) /
                  editing.selling_price) *
                100
              ).toFixed(1)}
              %
            </p>
          )}
          <ImageUpload
            label="Product Image"
            value={imageUrl}
            onChange={setImageUrl}
            folder="products"
          />
          <input type="hidden" name="image_url" value={imageUrl} />
          {editing && (
            <Select
              label="Status"
              name="is_active"
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
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
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editing ? "Update" : "Create"}
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
