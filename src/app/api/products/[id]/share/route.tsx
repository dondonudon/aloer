import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function fmtIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const mime = res.headers.get("content-type") ?? "image/jpeg";
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = createAdminClient();

  const [
    { data: product, error: productError },
    { data: storeSettings },
    { data: campaigns },
  ] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase
      .from("store_settings")
      .select("store_name, store_icon_url")
      .limit(1)
      .single(),
    supabase
      .from("campaigns")
      .select("*, campaign_products!inner(product_id)")
      .eq("is_active", true)
      .lte("start_date", new Date().toISOString())
      .gte("end_date", new Date().toISOString())
      .eq("campaign_products.product_id", id),
  ]);

  if (productError || !product) {
    return new Response("Product not found", { status: 404 });
  }

  const storeName: string = storeSettings?.store_name ?? "My Store";
  const storeIconUrl: string | null = storeSettings?.store_icon_url ?? null;

  const campaign = campaigns?.[0] ?? null;
  let promoLabel: string | null = null;
  let promoDateRange: string | null = null;
  if (campaign) {
    promoLabel =
      campaign.discount_type === "percentage"
        ? `PROMO ${campaign.discount_value}% OFF`
        : `PROMO Hemat ${fmtIDR(campaign.discount_value)}`;
    promoDateRange = `Berlaku: ${fmtDate(campaign.start_date)} – ${fmtDate(campaign.end_date)}`;
  }

  const [productImageDataUrl, storeIconDataUrl] = await Promise.all([
    product.image_url ? toDataUrl(product.image_url) : Promise.resolve(null),
    storeIconUrl ? toDataUrl(storeIconUrl) : Promise.resolve(null),
  ]);

  const generatedAt = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const CARD_W = 540;
  const CARD_H = 700;

  const png = new ImageResponse(
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 24,
          paddingRight: 24,
          backgroundImage: "linear-gradient(135deg, #1A3D5D 0%, #F29F21 100%)",
        }}
      >
        {storeIconDataUrl ? (
          <img
            src={storeIconDataUrl}
            alt={storeName}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              marginRight: 12,
              objectFit: "cover",
            }}
          />
        ) : null}
        <span style={{ color: "#ffffff", fontSize: 20, fontWeight: 700 }}>
          {storeName}
        </span>
      </div>
      <div
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 32,
          paddingRight: 32,
        }}
      >
        {productImageDataUrl ? (
          <img
            src={productImageDataUrl}
            alt={product.name}
            style={{
              width: 200,
              height: 200,
              objectFit: "contain",
              borderRadius: 16,
              marginBottom: 18,
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 200,
              height: 200,
              backgroundColor: "#f3f4f6",
              borderRadius: 16,
              marginBottom: 18,
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: 14 }}>{"No Image"}</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 800,
            color: "#111827",
            textAlign: "center",
            lineHeight: "1.2",
            marginBottom: 10,
            maxWidth: 460,
          }}
        >
          <span>{product.name}</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            color: "#4F46E5",
            marginBottom: product.bulk_price ? 6 : 0,
          }}
        >
          <span>{fmtIDR(product.selling_price)}</span>
        </div>
        {product.bulk_price && product.bulk_min_qty ? (
          <div
            style={{
              display: "flex",
              fontSize: 15,
              color: "#6b7280",
              marginBottom: promoLabel ? 14 : 0,
            }}
          >
            <span>{`Grosir ${fmtIDR(product.bulk_price)} / min ${product.bulk_min_qty} ${product.unit}`}</span>
          </div>
        ) : null}
        {promoLabel ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: "#FEF3C7",
              borderRadius: 12,
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 20,
              paddingRight: 20,
              marginTop: 12,
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 700, color: "#B45309" }}>
              {`🏷 ${promoLabel}`}
            </span>
            <span style={{ fontSize: 13, color: "#92400E", marginTop: 4 }}>
              {promoDateRange ?? ""}
            </span>
            <span style={{ fontSize: 12, color: "#B45309", marginTop: 4 }}>
              {"* Syarat & ketentuan berlaku"}
            </span>
          </div>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 24,
          paddingRight: 24,
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          {`Dibuat: ${generatedAt}`}
        </span>
        <span style={{ fontSize: 11, color: "#d1d5db", marginTop: 2 }}>
          {"Harga dapat berubah sewaktu-waktu"}
        </span>
      </div>
    </div>,
    { width: CARD_W, height: CARD_H },
  );

  const buffer = await png.arrayBuffer();
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const slug = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${slug}-${ts}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
