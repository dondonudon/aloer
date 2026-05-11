import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const endpoint: string | undefined = body?.endpoint;
  const p256dh: string | undefined = body?.keys?.p256dh;
  const auth: string | undefined = body?.keys?.auth;
  const userAgent: string | undefined = body?.userAgent;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "Invalid subscription" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  type PushSubRow = {
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent: string | null;
    last_seen_at: string;
  };
  type PushSubBuilder = {
    upsert: (
      values: PushSubRow,
      options: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
  };
  const { error } = await (
    admin.from("push_subscriptions") as unknown as PushSubBuilder
  ).upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
