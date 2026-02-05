"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Send,
  Users,
  Clock,
  Flame,
  Ban,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filter === "unread" && { unreadOnly: "true" }),
      });
      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [pagination.page, filter]);

  const markAsRead = async (ids: string[]) => {
    setMarkingId(ids[0]);
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            ids.includes(n.id)
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        );
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    } finally {
      setMarkingId(null);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
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
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, typeof Bell> = {
      deal_assigned: Briefcase,
      campaign_completed: Send,
      member_joined: Users,
      invite_accepted: UserPlus,
      task_due: Clock,
      lead_hot: Flame,
      opt_out: Ban,
    };
    return icons[type] || Bell;
  };

  const getTypeStyle = (type: string) => {
    const styles: Record<string, { bgColor: string; textColor: string }> = {
      deal_assigned: { bgColor: "bg-blue-500/10", textColor: "text-blue-500" },
      campaign_completed: { bgColor: "bg-green-500/10", textColor: "text-green-500" },
      member_joined: { bgColor: "bg-purple-500/10", textColor: "text-purple-500" },
      invite_accepted: { bgColor: "bg-indigo-500/10", textColor: "text-indigo-500" },
      task_due: { bgColor: "bg-yellow-500/10", textColor: "text-yellow-500" },
      lead_hot: { bgColor: "bg-red-500/10", textColor: "text-red-500" },
      opt_out: { bgColor: "bg-orange-500/10", textColor: "text-orange-500" },
    };
    return styles[type] || { bgColor: "bg-gray-500/10", textColor: "text-gray-500" };
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <Header
        title="Notificacoes"
        description="Acompanhe todas as notificacoes do sistema"
      />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange" />
                  Todas as Notificacoes
                </CardTitle>
                <CardDescription>
                  {pagination.total} notificacoes no total
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    onClick={() => {
                      setFilter("all");
                      setPagination({ ...pagination, page: 1 });
                    }}
                    className={cn(
                      "px-3 py-1.5 text-sm transition-colors",
                      filter === "all"
                        ? "bg-orange text-white"
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => {
                      setFilter("unread");
                      setPagination({ ...pagination, page: 1 });
                    }}
                    className={cn(
                      "px-3 py-1.5 text-sm transition-colors",
                      filter === "unread"
                        ? "bg-orange text-white"
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    Nao Lidas
                  </button>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={markingAll}
                  >
                    {markingAll ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4 mr-2" />
                    )}
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhuma notificacao</p>
                <p className="text-sm">
                  {filter === "unread"
                    ? "Todas as notificacoes foram lidas"
                    : "Voce ainda nao recebeu notificacoes"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const Icon = getTypeIcon(notification.type);
                  const style = getTypeStyle(notification.type);

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-4 p-4 border rounded-lg transition-colors",
                        !notification.read && "bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                          style.bgColor
                        )}
                      >
                        <Icon className={cn("h-5 w-5", style.textColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{notification.title}</p>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-orange" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead([notification.id])}
                              disabled={markingId === notification.id}
                              className="flex-shrink-0"
                            >
                              {markingId === notification.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                          {notification.readAt && (
                            <span>
                              Lida {format(new Date(notification.readAt), "dd/MM HH:mm")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Pagina {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Proximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
