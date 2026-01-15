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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-navy border-r border-navy-400">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-400">
          <RevSendLogoCompact className="w-10 h-10" />
          <span className="text-xl font-bold text-white">
            Rev<span className="text-orange">Send</span>
          </span>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-orange text-white"
                    : "text-gray-400 hover:bg-navy-400 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-navy-400">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-navy-400 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
