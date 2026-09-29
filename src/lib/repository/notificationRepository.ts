import { supabase } from "@/lib/supabase/client";
import type { AppNotification } from "@/types/domain";

class NotificationRepository {
  async listByUserId(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from("app_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      isRead: row.is_read,
      createdAt: row.created_at,
    }));
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from("app_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from("app_notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  async create(payload: Omit<AppNotification, "id" | "createdAt">): Promise<void> {
    const { error } = await supabase.from("app_notifications").insert({
      user_id: payload.userId,
      title: payload.title,
      content: payload.content,
      is_read: payload.isRead,
    });

    if (error) {
      console.error("Error creating notification:", error);
    }
  }
}

export const notificationRepository = new NotificationRepository();
