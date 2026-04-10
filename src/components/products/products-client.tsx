"use client";

import { Download, Loader2, Pencil, Plus, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Toast } from "@/components/ui/toast";
import {
  createProduct,
  deleteProductUnit,
  getProductPriceHistory,
  getProductUnits,
  updateProduct,
  upsertProductUnit,
} from "@/lib/actions/products";
import { useI18n } from "@/lib/i18n/context";
import type { Product, ProductPrice, ProductUnit } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const ProductEditorModal = dynamic(
  () => import("./product-editor-modal").then((mod) => mod.ProductEditorModal),
  { ssr: false },
);

interface ProductsClientProps {
  products: Product[];
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

export function ProductsClient({
  products,
  total,
  page,
  pageSize,
  search: initialSearch,
}: ProductsClientProps) {
  const { t } = useI18n();
  const unitOptions = [
    { value: "pcs", label: t.products.unitPcs },
    { value: "kg", label: t.products.unitKg },
    { value: "pack", label: t.products.unitPack },
    { value: "box", label: t.products.unitBox },
    { value: "liter", label: t.products.unitLiter },
  ];
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<ProductPrice[]>([]);
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [newUnit, setNewUnit] = useState({
    unit_name: "",
    conversion_to_base: "",
    is_base: false,
  });
  const [unitLoading, setUnitLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const editorLabels = {
    productName: t.products.name,
    sku: t.products.sku,
    manageCategories: t.products.manageCategories,
    category: t.products.categoryName,
    categoryPlaceholder: t.products.categoryPlaceholder,
    unit: t.products.unit,
    sellingPrice: t.products.sellingPrice,
    bulkPriceOptional: t.products.bulkPriceOptional,
    bulkPricePlaceholder: t.products.bulkPricePlaceholder,
    bulkMinQty: t.products.bulkMinQty,
    bulkMinQtyPlaceholder: t.products.bulkMinQtyPlaceholder,
    priceHistory: t.products.priceHistory,
    noPriceHistory: t.products.noPriceHistory,
    unitsConversions: t.products.unitsConversions,
    noUnitsYet: t.products.noUnitsYet,
    unitName: t.products.unitName,
    conversionToBase: t.products.conversionToBase,
    isBaseUnit: t.products.isBaseUnit,
    baseLabel: t.products.baseLabel,
    deleteUnit: t.products.deleteUnit,
    addUnit: t.products.addUnit,
    productImage: t.products.productImage,
    status: t.products.status,
    active: t.products.active,
    inactive: t.products.inactive,
    cancel: t.common.cancel,
    saving: t.common.saving,
    create: t.common.create,
    update: t.common.update,
  };

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
    if (pageSize !== 10) params.set("limit", String(pageSize));
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function buildLimitHref(limit: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (limit !== 10) params.set("limit", String(limit));
    // page intentionally omitted — resets to 1
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const totalPages = Math.ceil(total / pageSize);

  function openCreate() {
    setEditing(null);
    setImageUrl("");
    setPriceHistory([]);
    setProductUnits([]);
    setNewUnit({ unit_name: "", conversion_to_base: "", is_base: false });
    setModalOpen(true);
  }

  async function downloadShareImage(product: Product) {
    if (downloadingId) return;
    setDownloadingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}/share`);
      if (!res.ok) throw new Error("Failed to generate image");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      a.href = url;
      a.download = `${slug}-${ts}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ message: "Failed to download image", type: "error" });
    } finally {
      setDownloadingId(null);
    }
  }

  async function openEdit(product: Product) {
    setEditing(product);
    setImageUrl(product.image_url ?? "");
    setPriceHistory([]);
    setProductUnits([]);
    setNewUnit({ unit_name: "", conversion_to_base: "", is_base: false });
    setModalOpen(true);
    const [history, units] = await Promise.all([
      getProductPriceHistory(product.id),
      getProductUnits(product.id),
    ]);
    setPriceHistory(history);
    setProductUnits(units);
  }

  async function handleAddUnit() {
    if (!editing) return;
    const convNum = parseFloat(newUnit.conversion_to_base);
    if (!newUnit.unit_name.trim() || Number.isNaN(convNum) || convNum <= 0) {
      setToast({
        message: "Unit name and a positive conversion value are required",
        type: "error",
      });
      return;
    }
    setUnitLoading(true);
    const result = await upsertProductUnit(editing.id, {
      unit_name: newUnit.unit_name.trim(),
      conversion_to_base: convNum,
      is_base: newUnit.is_base,
    });
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: t.products.unitAdded, type: "success" });
      setNewUnit({ unit_name: "", conversion_to_base: "", is_base: false });
      const units = await getProductUnits(editing.id);
      setProductUnits(units);
    }
    setUnitLoading(false);
  }

  async function handleDeleteUnit(unitId: string) {
    if (!editing) return;
    setUnitLoading(true);
    const result = await deleteProductUnit(unitId);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: t.products.unitDeleted, type: "success" });
      const units = await getProductUnits(editing.id);
      setProductUnits(units);
    }
    setUnitLoading(false);
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
        message: editing ? t.products.updated : t.products.created,
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
          {t.products.title}
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.products.addProduct}
        </Button>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          aria-hidden="true"
        />
        <Input
          placeholder={t.products.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          aria-label={t.products.searchPlaceholder}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  {t.products.sku}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  {t.products.name}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  {t.products.category}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  {t.products.unit}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.products.price}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.products.bulkPrice}
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  {t.products.margin}
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">
                  {t.products.status}
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">
                  {t.products.actions}
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
                        {t.products.noCostData}
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
                      {product.is_active
                        ? t.products.active
                        : t.products.inactive}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
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
                      <button
                        type="button"
                        onClick={() => downloadShareImage(product)}
                        disabled={downloadingId === product.id}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Download image for ${product.name}`}
                      >
                        {downloadingId === product.id ? (
                          <Loader2
                            className="h-4 w-4 text-gray-500 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Download
                            className="h-4 w-4 text-gray-500"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 text-center text-gray-400 dark:text-gray-500"
                  >
                    {t.products.noProductsFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={buildHref}
        pageSize={pageSize}
        buildLimitHref={buildLimitHref}
      />

      <ProductEditorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t.products.editProduct : t.products.newProduct}
        onSubmit={handleSubmit}
        editing={editing}
        unitOptions={unitOptions}
        imageUrl={imageUrl}
        onImageUrlChange={setImageUrl}
        loading={loading}
        priceHistory={priceHistory}
        productUnits={productUnits}
        newUnit={newUnit}
        onNewUnitChange={setNewUnit}
        unitLoading={unitLoading}
        onAddUnit={handleAddUnit}
        onDeleteUnit={handleDeleteUnit}
        labels={editorLabels}
      />

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
