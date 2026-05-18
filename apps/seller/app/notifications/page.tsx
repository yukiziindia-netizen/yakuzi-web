"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Package, CreditCard, AlertTriangle, ShoppingBag, MessageSquare, Info } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { formatDate } from "@pharmabag/utils";
import { useSellerNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useSeller";
import { cn } from "@/lib/utils";
import Link from "next/link";

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  ORDER: { icon: ShoppingBag, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20" },
  PAYMENT: { icon: CreditCard, color: "bg-green-50 text-green-600 dark:bg-green-900/20" },
  PRODUCT: { icon: Package, color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20" },
  TICKET: { icon: MessageSquare, color: "bg-orange-50 text-orange-600 dark:bg-orange-900/20" },
  ALERT: { icon: AlertTriangle, color: "bg-red-50 text-red-600 dark:bg-red-900/20" },
  DEFAULT: { icon: Info, color: "bg-muted text-muted-foreground" },
};

function getNotificationIcon(type?: string) {
  return TYPE_ICON[type?.toUpperCase() ?? "DEFAULT"] ?? TYPE_ICON.DEFAULT;
}

function getNotificationLink(notification: any): string | null {
  if (notification.orderId) return `/orders/${notification.orderId}`;
  if (notification.productId) return `/products/${notification.productId}`;
  if (notification.ticketId) return `/support/${notification.ticketId}`;
  return null;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data: notificationsRaw, isLoading } = useSellerNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications: any[] = Array.isArray(notificationsRaw)
    ? notificationsRaw
    : (notificationsRaw?.notifications ?? []);

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read && !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;

  const handleMarkRead = (notifId: string) => {
    markRead.mutate(notifId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" loading={markAllRead.isPending} onClick={() => markAllRead.mutate()} leftIcon={<CheckCheck className="h-3.5 w-3.5" />}>
            Mark all read
          </Button>
        )}
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-medium transition-all",
              filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {f === "all" ? "All" : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif, i) => {
            const { icon: Icon, color } = getNotificationIcon(notif.type);
            const isUnread = !notif.read && !notif.isRead;
            const link = getNotificationLink(notif);

            const content = (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "glass-card rounded-xl p-4 flex items-start gap-4 transition-colors cursor-pointer hover:bg-accent/30",
                  isUnread && "border-l-4 border-l-primary bg-primary/[0.02]"
                )}
                onClick={() => isUnread && handleMarkRead(notif.id ?? notif._id)}
              >
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm truncate", isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                      {notif.title || notif.subject || "Notification"}
                    </p>
                    {isUnread && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message || notif.body || ""}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{formatDate(notif.createdAt)}</p>
                </div>
              </motion.div>
            );

            return link ? <Link key={notif.id ?? notif._id ?? i} href={link}>{content}</Link> : <div key={notif.id ?? notif._id ?? i}>{content}</div>;
          })}
        </div>
      )}
    </div>
  );
}
