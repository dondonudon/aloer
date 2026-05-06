import { NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push-server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Sends a test notification to every subscription belonging to the caller.
// Useful for validating the wiring end-to-end from settings.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const result = await sendPushToUser(user.id, {
    title: "Aloer",
    body: "Notifications are working ✓",
    url: "/dashboard",
    tag: "aloer-test",
  });

  return NextResponse.json(result);
}
