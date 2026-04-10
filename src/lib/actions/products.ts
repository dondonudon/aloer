"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { insertAuditLog, ownerAction, validateName } from "./action-utils";

const getCachedActiveProducts = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("products")
      .select(
        "id, name, sku, category, unit, selling_price, bulk_price, bulk_min_qty, latest_cost_price, image_url, is_active, created_at, updated_at",
      )
      .eq("is_active", true)
      .order("name");

    if (error) throw new Error(error.message);
    return data;
  },
  ["active-products"],
  { revalidate: 60, tags: ["active-products"] },
);

export async function getProducts(options?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  const limit = options?.limit ?? 20;
  const page = Math.max(1, options?.page ?? 1);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("products")
    .select(
      "id, name, sku, category, unit, selling_price, bulk_price, bulk_min_qty, latest_cost_price, image_url, is_active, created_at, updated_at",
      { count: "planned" },
    )
    .order("name");

  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,sku.ilike.%${options.search}%`,
    );
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: data ?? [], count: count ?? 0 };
}

export async function getActiveProducts() {
  return getCachedActiveProducts();
}

function parseProductForm(formData: FormData) {
  const name = validateName(formData.get("name"), "Product name");
  const skuErr = validateName(formData.get("sku"), "SKU", 100);
  if (name) return { error: name };
  if (skuErr) return { error: skuErr };

  const sellingPriceStr = formData.get("selling_price") as string;
  const sellingPrice = parseFloat(sellingPriceStr);
  if (!sellingPriceStr || Number.isNaN(sellingPrice) || sellingPrice < 0)
    return { error: "Selling price must be a non-negative number" };

  const bulkPriceStr = formData.get("bulk_price") as string;
  const bulkMinQtyStr = formData.get("bulk_min_qty") as string;
  const bulkPrice = bulkPriceStr ? parseFloat(bulkPriceStr) : null;
  const bulkMinQty = bulkMinQtyStr ? parseFloat(bulkMinQtyStr) : null;

  if (bulkPrice !== null && (Number.isNaN(bulkPrice) || bulkPrice < 0))
    return { error: "Bulk price must be a non-negative number" };
  if (bulkMinQty !== null && (Number.isNaN(bulkMinQty) || bulkMinQty <= 0))
    return { error: "Bulk minimum quantity must be a positive number" };

  return {
    name: (formData.get("name") as string).trim(),
    sku: (formData.get("sku") as string).trim(),
    sellingPrice,
    bulkPrice,
    bulkMinQty,
  };
}

export async function createProduct(formData: FormData) {
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed;
  const { name, sku, sellingPrice, bulkPrice, bulkMinQty } = parsed;

  return ownerAction(async (supabase, userId) => {
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name,
        sku,
        category: (formData.get("category") as string) || null,
        unit: (formData.get("unit") as string) || "pcs",
        selling_price: sellingPrice,
        bulk_price: bulkPrice,
        bulk_min_qty: bulkMinQty,
        image_url: (formData.get("image_url") as string) || null,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    await insertAuditLog(
      supabase,
      userId,
      "CREATE_PRODUCT",
      "products",
      product.id,
    );
    revalidatePath("/products");
    revalidateTag("active-products", { expire: 0 });
    return {};
  });
}

export async function updateProduct(id: string, formData: FormData) {
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed;
  const { name, sku, sellingPrice, bulkPrice, bulkMinQty } = parsed;

  return ownerAction(async (supabase, userId) => {
    const { error } = await supabase
      .from("products")
      .update({
        name,
        sku,
        category: (formData.get("category") as string) || null,
        unit: (formData.get("unit") as string) || "pcs",
        selling_price: sellingPrice,
        bulk_price: bulkPrice,
        bulk_min_qty: bulkMinQty,
        image_url: (formData.get("image_url") as string) || null,
        is_active: formData.get("is_active") === "true",
      })
      .eq("id", id);
    if (error) return { error: error.message };
    await insertAuditLog(supabase, userId, "UPDATE_PRODUCT", "products", id);
    revalidatePath("/products");
    revalidateTag("active-products", { expire: 0 });
    return {};
  });
}

export async function getProductPriceHistory(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_prices")
    .select("*")
    .eq("product_id", productId)
    .order("effective_from", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ============================================================
// PRODUCT UNITS
// ============================================================

export async function getProductUnits(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_units")
    .select("*")
    .eq("product_id", productId)
    .order("is_base", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertProductUnit(
  productId: string,
  unit: {
    id?: string;
    unit_name: string;
    conversion_to_base: number;
    is_base: boolean;
  },
) {
  const unitName = unit.unit_name.trim();
  if (!unitName) return { error: "Unit name is required" };
  if (unitName.length > 50)
    return { error: "Unit name must be 50 characters or less" };
  if (unit.conversion_to_base <= 0)
    return { error: "Conversion must be greater than 0" };

  return ownerAction(async (supabase, userId) => {
    if (unit.id) {
      const { error } = await supabase
        .from("product_units")
        .update({
          unit_name: unitName,
          conversion_to_base: unit.conversion_to_base,
          is_base: unit.is_base,
        })
        .eq("id", unit.id);
      if (error) return { error: error.message };
      await insertAuditLog(
        supabase,
        userId,
        "UPDATE_PRODUCT_UNIT",
        "product_units",
        unit.id,
      );
    } else {
      const { data: newUnit, error } = await supabase
        .from("product_units")
        .insert({
          product_id: productId,
          unit_name: unitName,
          conversion_to_base: unit.conversion_to_base,
          is_base: unit.is_base,
        })
        .select("id")
        .single();
      if (error) return { error: error.message };
      await insertAuditLog(
        supabase,
        userId,
        "CREATE_PRODUCT_UNIT",
        "product_units",
        newUnit.id,
      );
    }
    revalidatePath("/products");
    return {};
  });
}

export async function deleteProductUnit(id: string) {
  return ownerAction(async (supabase, userId) => {
    const { error } = await supabase
      .from("product_units")
      .delete()
      .eq("id", id);
    if (error) return { error: error.message };
    await insertAuditLog(
      supabase,
      userId,
      "DELETE_PRODUCT_UNIT",
      "product_units",
      id,
    );
    revalidatePath("/products");
    return {};
  });
}
