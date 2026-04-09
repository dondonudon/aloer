"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ownerAction, validateName } from "./action-utils";

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
    .select("*", { count: "exact" })
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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return data;
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

  return ownerAction(async (supabase) => {
    const { error } = await supabase.from("products").insert({
      name,
      sku,
      category: (formData.get("category") as string) || null,
      unit: (formData.get("unit") as string) || "pcs",
      selling_price: sellingPrice,
      bulk_price: bulkPrice,
      bulk_min_qty: bulkMinQty,
      image_url: (formData.get("image_url") as string) || null,
    });
    if (error) return { error: error.message };
    revalidatePath("/products");
    return {};
  });
}

export async function updateProduct(id: string, formData: FormData) {
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed;
  const { name, sku, sellingPrice, bulkPrice, bulkMinQty } = parsed;

  return ownerAction(async (supabase) => {
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
    revalidatePath("/products");
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
