"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { RevSendLogoCompact } from "@/components/logo/RevSendLogo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Send,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  Kanban,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

// Menu organizado por grupos
const menuGroups = [
  {
    label: "Principal",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "CRM",
    items: [
      {
        label: "Pipeline",
        href: "/pipeline",
        icon: Kanban,
      },
      {
        label: "Listas",
        href: "/lists",
        icon: Users,
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        label: "Campanhas",
        href: "/campaigns",
        icon: Send,
      },
      {
        label: "Templates",
        href: "/templates",
        icon: FileText,
      },
      {
        label: "Respostas",
        href: "/replies",
        icon: MessageSquare,
        badge: true, // Mostra badge de notificacao
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        label: "Relatorios",
        href: "/reports",
        icon: BarChart3,
      },
      {
        label: "Configuracoes",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

// Tooltip component simples
function Tooltip({ children, content, show }: { children: React.ReactNode; content: string; show: boolean }) {
  if (!show) return <>{children}</>;

  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute left-full ml-2 px-2 py-1 bg-navy-600 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
        {content}
      </div>
    </div>
  );
}

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadReplies, setUnreadReplies] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Principal", "CRM", "Marketing", "Sistema"]);

  // Buscar contagem de respostas nao lidas
  useEffect(() => {
    const fetchUnreadReplies = async () => {
      try {
        const response = await fetch("/api/replies/unread-count");
        if (response.ok) {
          const data = await response.json();
          setUnreadReplies(data.count || 0);
        }
      } catch {
        // Silently fail - badge just won't show
      }
    };

    fetchUnreadReplies();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUnreadReplies, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Fechar menu mobile com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev =>
      prev.includes(label)
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  const SidebarContent = () => (
    <div className="relative flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-navy-400/30">
        <div className="flex items-center gap-3">
          <RevSendLogoCompact className="w-9 h-9" />
          {!collapsed && (
            <span className="text-lg font-display font-bold text-white">
              Rev<span className="text-[#FF6B35]">Send</span>
            </span>
          )}
        </div>
        {/* Botao fechar mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg text-navy-200 hover:bg-navy-400/50 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Menu com grupos */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.label}>
            {/* Header do grupo */}
            <button
              onClick={() => toggleGroup(group.label)}
              className={cn(
                "flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy-300 hover:text-navy-200 transition-colors",
                collapsed && "justify-center"
              )}
            >
              {!collapsed && <span>{group.label}</span>}
              {!collapsed && (
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    expandedGroups.includes(group.label) && "rotate-180"
                  )}
                />
              )}
            </button>

            {/* Items do grupo */}
            {(expandedGroups.includes(group.label) || collapsed) && (
              <div className="mt-1 space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const showBadge = item.badge && unreadReplies > 0;

                  return (
                    <Tooltip key={item.href} content={item.label} show={collapsed}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-[#FF6B35] text-white shadow-[0_0_20px_rgba(255,107,53,0.3)]"
                            : "text-navy-200 hover:bg-navy-400/50 hover:text-white",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 transition-transform duration-200 flex-shrink-0",
                          !isActive && "group-hover:scale-110"
                        )} />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {showBadge && (
                              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-[#00D9A5] text-white rounded-full animate-pulse">
                                {unreadReplies > 99 ? "99+" : unreadReplies}
                              </span>
                            )}
                            {isActive && !showBadge && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            )}
                          </>
                        )}
                        {collapsed && showBadge && (
                          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-[#00D9A5] text-white rounded-full">
                            {unreadReplies > 9 ? "9+" : unreadReplies}
                          </span>
                        )}
                      </Link>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Status indicator */}
      <div className={cn("mx-3 mb-3 p-3 bg-navy-400/30 rounded-lg", collapsed && "mx-2 p-2")}>
        <div className={cn("flex items-center gap-2 text-xs text-navy-200", collapsed && "justify-center")}>
          <div className="w-2 h-2 bg-[#00D9A5] rounded-full animate-pulse flex-shrink-0" />
          {!collapsed && <span>Sistema operacional</span>}
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-navy-400/30">
        <Tooltip content="Sair" show={collapsed}>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-200 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-navy text-white shadow-lg hover:bg-navy-600 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 bg-navy border-r border-navy-400/30 transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#FF6B35]/5 to-transparent pointer-events-none" />
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-navy border-r border-navy-400/30 hidden lg:block transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#FF6B35]/5 to-transparent pointer-events-none" />
        <SidebarContent />
      </aside>
    </>
  );
}
