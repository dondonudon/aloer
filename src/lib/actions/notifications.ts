"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface Notification {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  tag: string | null;
  is_read: boolean;
  created_at: string;
}

/** Fetches the most recent 100 notifications for the current user. */
export async function getNotifications(): Promise<Notification[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, url, tag, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as Notification[];
}

/** Returns the number of unread notifications for the current user. */
export async function getUnreadNotificationsCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  return count ?? 0;
}

/** Marks a single notification as read. RLS ensures users only touch their own rows. */
export async function markNotificationRead(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);

  revalidatePath("/notifications");
}

/** Marks all notifications as read for the current user. */
export async function markAllNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  revalidatePath("/notifications");
}
