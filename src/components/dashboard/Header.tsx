"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HeaderBreadcrumb } from "@/components/ui/breadcrumb";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          {/* Breadcrumb */}
          <HeaderBreadcrumb className="mb-1" />

          <h1 className="text-2xl font-bold font-display text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="w-64 pl-9 bg-muted/50 border-transparent focus:border-[#ff7336] focus:ring-[#ff7336]/20"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#ff7336] text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
              3
            </span>
          </Button>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#ff7336] to-[#E85520] flex items-center justify-center text-white font-semibold shadow-sm">
              {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{session?.user?.name || "Usuario"}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
