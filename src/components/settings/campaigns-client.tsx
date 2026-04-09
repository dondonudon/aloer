"use client";

import { Loader2, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import {
  createCampaign,
  deleteCampaign,
  toggleCampaign,
  updateCampaign,
} from "@/lib/actions/campaigns";
import { useI18n } from "@/lib/i18n/context";
import type {
  CampaignTriggerType,
  CampaignWithProducts,
  Product,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CampaignsClientProps {
  campaigns: CampaignWithProducts[];
  products: Product[];
}

interface CampaignFormState {
  name: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  startDate: string;
  endDate: string;
  triggerType: CampaignTriggerType;
  triggerValue: string;
  selectedProducts: string[];
  minQuantities: Record<string, string>;
}

const defaultForm: CampaignFormState = {
  name: "",
  discountType: "percentage",
  discountValue: "",
  startDate: "",
  endDate: "",
  triggerType: "always",
  triggerValue: "",
  selectedProducts: [],
  minQuantities: {},
};

/** Converts a UTC ISO timestamp to a value suitable for datetime-local inputs. */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

/**
 * Campaign management component for the settings page.
 * Allows creating, editing, toggling, and deleting time-limited discount campaigns.
 */
export function CampaignsClient({ campaigns, products }: CampaignsClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const triggerLabel: Record<CampaignTriggerType, string> = {
    always: t.settings.always,
    min_cart_total: t.settings.minCartTotal,
    min_product_qty: t.settings.minProductQty,
  };
  const [modal, setModal] = useState<{
    mode: "create" | "edit";
    campaign?: CampaignWithProducts;
  } | null>(null);
  const [form, setForm] = useState<CampaignFormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  function setF<K extends keyof CampaignFormState>(
    key: K,
    value: CampaignFormState[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setForm(defaultForm);
    setModal({ mode: "create" });
  }

  function openEdit(c: CampaignWithProducts) {
    setForm({
      name: c.name,
      discountType: c.discount_type,
      discountValue: String(c.discount_value),
      startDate: toDatetimeLocal(c.start_date),
      endDate: toDatetimeLocal(c.end_date),
      triggerType: c.trigger_type,
      triggerValue: c.trigger_value != null ? String(c.trigger_value) : "",
      selectedProducts: c.campaign_products.map((cp) => cp.product_id),
      minQuantities: Object.fromEntries(
        c.campaign_products.map((cp) => [
          cp.product_id,
          String(cp.min_quantity),
        ]),
      ),
    });
    setModal({ mode: "edit", campaign: c });
  }

  function toggleProduct(productId: string) {
    setForm((f) => ({
      ...f,
      selectedProducts: f.selectedProducts.includes(productId)
        ? f.selectedProducts.filter((id) => id !== productId)
        : [...f.selectedProducts, productId],
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("discount_type", form.discountType);
    fd.set("discount_value", form.discountValue);
    fd.set("start_date", new Date(form.startDate).toISOString());
    fd.set("end_date", new Date(form.endDate).toISOString());
    fd.set("trigger_type", form.triggerType);
    if (form.triggerType === "min_cart_total" && form.triggerValue) {
      fd.set("trigger_value", form.triggerValue);
    }
    fd.set("product_ids", JSON.stringify(form.selectedProducts));
    fd.set(
      "min_quantities",
      JSON.stringify(
        Object.fromEntries(
          Object.entries(form.minQuantities).map(([k, v]) => [
            k,
            parseFloat(v) || 1,
          ]),
        ),
      ),
    );

    const result =
      modal?.mode === "edit" && modal.campaign
        ? await updateCampaign(modal.campaign.id, fd)
        : await createCampaign(fd);

    setLoading(false);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({
        message:
          modal?.mode === "edit"
            ? t.settings.campaignUpdated
            : t.settings.campaignCreated,
        type: "success",
      });
      setModal(null);
      router.refresh();
    }
  }

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    const result = await toggleCampaign(id, !current);
    setTogglingId(null);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteCampaign(id);
    if (result.error) {
      setToast({ message: result.error, type: "error" });
    } else {
      setToast({ message: t.settings.campaignCreated, type: "success" });
      router.refresh();
    }
  }

  function isNowActive(c: CampaignWithProducts): boolean {
    const now = new Date();
    return (
      c.is_active &&
      new Date(c.start_date) <= now &&
      new Date(c.end_date) >= now
    );
  }

  const showProductSelection = form.triggerType !== "min_cart_total";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.settings.campaigns}
        </h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.settings.newCampaign}
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-gray-400">{t.settings.noCampaignsYet}</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const active = isNowActive(c);
            const productNames = c.campaign_products
              .map((cp) => products.find((p) => p.id === cp.product_id)?.name)
              .filter(Boolean);

            return (
              <div
                key={c.id}
                className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {c.name}
                    </p>
                    {active ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        {t.settings.live}
                      </span>
                    ) : c.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                        {t.settings.scheduled}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        {t.settings.disabled}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                      {triggerLabel[c.trigger_type]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {c.discount_type === "percentage"
                      ? `${c.discount_value}% off`
                      : `${formatCurrency(c.discount_value)} off`}{" "}
                    {c.trigger_type === "min_cart_total" &&
                    c.trigger_value != null
                      ? `· cart ≥ ${formatCurrency(c.trigger_value)}`
                      : null}{" "}
                    · {new Date(c.start_date).toLocaleDateString("id-ID")} →{" "}
                    {new Date(c.end_date).toLocaleDateString("id-ID")}
                  </p>
                  {c.trigger_type === "min_product_qty" &&
                  c.campaign_products.length > 0 ? (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {c.campaign_products
                        .map((cp) => {
                          const name = products.find(
                            (p) => p.id === cp.product_id,
                          )?.name;
                          return name ? `${name} (≥${cp.min_quantity})` : null;
                        })
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ) : productNames.length > 0 ? (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      Products: {productNames.join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-blue-500 mt-1">
                      {c.trigger_type === "min_cart_total"
                        ? "Applies to entire order"
                        : "Applies to all products"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="p-2 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label={`Edit campaign ${c.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(c.id, c.is_active)}
                    disabled={togglingId === c.id}
                    className={`p-2 rounded transition-colors ${
                      togglingId === c.id
                        ? "opacity-50 cursor-not-allowed"
                        : c.is_active
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-100"
                    }`}
                    aria-label={
                      c.is_active ? "Disable campaign" : "Enable campaign"
                    }
                  >
                    {togglingId === c.id ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Power className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="p-2 rounded text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={`Delete campaign ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={
          modal?.mode === "edit"
            ? t.settings.editCampaign
            : t.settings.newCampaign
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="campaign-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t.settings.campaignName}
            </label>
            <Input
              id="campaign-name"
              value={form.name}
              onChange={(e) => setF("name", e.target.value)}
              required
              placeholder={t.settings.campaignNamePlaceholder}
            />
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="campaign-discount-type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t.settings.discountType}
              </label>
              <select
                id="campaign-discount-type"
                value={form.discountType}
                onChange={(e) =>
                  setF("discountType", e.target.value as "percentage" | "fixed")
                }
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="percentage">{t.settings.percentage}</option>
                <option value="fixed">{t.settings.fixedAmount}</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="campaign-discount-value"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t.settings.discountValue}
              </label>
              <Input
                id="campaign-discount-value"
                value={form.discountValue}
                onChange={(e) => setF("discountValue", e.target.value)}
                type="number"
                step="any"
                min="0.01"
                required
                placeholder={form.discountType === "percentage" ? "10" : "5000"}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="campaign-start"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t.settings.startDate}
              </label>
              <Input
                id="campaign-start"
                value={form.startDate}
                onChange={(e) => setF("startDate", e.target.value)}
                type="datetime-local"
                required
              />
            </div>
            <div>
              <label
                htmlFor="campaign-end"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t.settings.endDate}
              </label>
              <Input
                id="campaign-end"
                value={form.endDate}
                onChange={(e) => setF("endDate", e.target.value)}
                type="datetime-local"
                required
              />
            </div>
          </div>

          {/* Trigger rule */}
          <div>
            <label
              htmlFor="campaign-trigger"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t.settings.triggerRule}
            </label>
            <select
              id="campaign-trigger"
              value={form.triggerType}
              onChange={(e) =>
                setF("triggerType", e.target.value as CampaignTriggerType)
              }
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            >
              <option value="always">{t.settings.triggerAlways}</option>
              <option value="min_cart_total">
                {t.settings.triggerMinCart}
              </option>
              <option value="min_product_qty">
                {t.settings.triggerMinQty}
              </option>
            </select>
          </div>

          {/* Min cart total threshold */}
          {form.triggerType === "min_cart_total" && (
            <div>
              <label
                htmlFor="campaign-trigger-value"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t.settings.minimumCartTotal}
              </label>
              <Input
                id="campaign-trigger-value"
                value={form.triggerValue}
                onChange={(e) => setF("triggerValue", e.target.value)}
                type="number"
                min="1"
                required
                placeholder="100000"
              />
            </div>
          )}

          {/* Product selection (hidden for min_cart_total) */}
          {showProductSelection && (
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {form.triggerType === "min_product_qty"
                  ? t.settings.productsMinQty
                  : t.settings.productsOptional}
              </p>
              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2 space-y-1">
                {products
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.selectedProducts.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                        {p.name}
                      </span>
                      <span className="text-xs text-gray-400">{p.sku}</span>
                      {form.triggerType === "min_product_qty" &&
                        form.selectedProducts.includes(p.id) && (
                          <input
                            type="number"
                            min="1"
                            value={form.minQuantities[p.id] ?? "1"}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                minQuantities: {
                                  ...f.minQuantities,
                                  [p.id]: e.target.value,
                                },
                              }))
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-0.5 text-xs"
                            aria-label={`Minimum quantity for ${p.name}`}
                          />
                        )}
                    </label>
                  ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModal(null)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? modal?.mode === "edit"
                  ? t.common.saving
                  : t.common.creating
                : modal?.mode === "edit"
                  ? t.common.save
                  : t.settings.campaignCreated}
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
