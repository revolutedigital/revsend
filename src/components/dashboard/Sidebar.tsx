"use client";

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
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
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
  },
  {
    label: "Relatórios",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-navy border-r border-navy-400/30">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-coral/5 to-transparent pointer-events-none" />

      <div className="relative flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-400/30">
          <RevSendLogoCompact className="w-10 h-10" />
          <span className="text-xl font-display font-bold text-white">
            Rev<span className="text-coral">Send</span>
          </span>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-coral text-white shadow-glow"
                    : "text-navy-200 hover:bg-navy-400/50 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )} />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="mx-4 mb-4 p-3 bg-navy-400/30 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-navy-200">
            <div className="w-2 h-2 bg-mint rounded-full animate-pulse" />
            <span>Sistema operacional</span>
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-navy-400/30">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-navy-200 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
