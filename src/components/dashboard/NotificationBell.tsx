"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications/unread-count");
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch {
        // Silently fail
      }
    };

    if (session?.user?.currentOrgId) {
      fetchUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.currentOrgId]);

  // Fetch notifications when opened
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/notifications?limit=10");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && session?.user?.currentOrgId) {
      fetchNotifications();
    }
  }, [isOpen, session?.user?.currentOrgId]);

  // Mark as read
  const markAsRead = async (ids: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            ids.includes(n.id) ? { ...n, read: true, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - ids.length));
      }
    } catch {
      // Silently fail
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch {
      // Silently fail
    }
  };

  // Get icon/color based on notification type
  const getTypeStyle = (type: string) => {
    const styles: Record<string, { bgColor: string; textColor: string }> = {
      deal_assigned: { bgColor: "bg-blue-500/20", textColor: "text-blue-400" },
      campaign_completed: { bgColor: "bg-green-500/20", textColor: "text-green-400" },
      member_joined: { bgColor: "bg-purple-500/20", textColor: "text-purple-400" },
      task_due: { bgColor: "bg-yellow-500/20", textColor: "text-yellow-400" },
      lead_hot: { bgColor: "bg-red-500/20", textColor: "text-red-400" },
      opt_out: { bgColor: "bg-orange-500/20", textColor: "text-orange-400" },
    };
    return styles[type] || { bgColor: "bg-navy-500/20", textColor: "text-navy-300" };
  };

  if (!session?.user) return null;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-navy-200 hover:bg-navy-400/50 hover:text-white transition-colors"
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-[#ff7336] text-white rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-navy-600 border border-navy-400/50 rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-navy-400/30">
              <h3 className="font-medium text-white">Notificações</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-navy-300 hover:text-white transition-colors flex items-center gap-1"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Ler todas</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-navy-300 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-navy-300">
                  Carregando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-navy-300">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((notification) => {
                  const style = getTypeStyle(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "px-4 py-3 border-b border-navy-400/20 hover:bg-navy-500/30 transition-colors cursor-pointer",
                        !notification.read && "bg-navy-500/20"
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead([notification.id]);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                            style.bgColor
                          )}
                        >
                          <Bell className={cn("h-4 w-4", style.textColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-[#ff7336] rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-navy-300 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-navy-400 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead([notification.id]);
                            }}
                            className="flex-shrink-0 p-1 text-navy-400 hover:text-white transition-colors"
                            title="Marcar como lida"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-navy-400/30 bg-navy-600/50">
                <a
                  href="/notifications"
                  className="text-xs text-navy-300 hover:text-white transition-colors"
                >
                  Ver todas as notificações
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
