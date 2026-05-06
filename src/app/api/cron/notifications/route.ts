import { NextResponse } from "next/server";
import {
  notifyExpiringProducts,
  notifyOutstandingCredit,
} from "@/lib/cron/notifications";

export const runtime = "nodejs";

// Triggered by Vercel Cron. Vercel automatically attaches
// `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set as an env var.
// We reject anything else so this endpoint isn't publicly invokable.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = await Promise.all([
    notifyOutstandingCredit().catch((e) => ({
      job: "outstanding_credit",
      notified: 0,
      errors: 1,
      message: String(e),
    })),
    notifyExpiringProducts().catch((e) => ({
      job: "expiring_products",
      notified: 0,
      errors: 1,
      message: String(e),
    })),
  ]);

  return NextResponse.json({ ok: true, results });
}
