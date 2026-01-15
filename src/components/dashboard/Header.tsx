"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 bg-background border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="w-64 pl-9"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange text-[10px] font-bold text-white rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-orange flex items-center justify-center text-white font-semibold">
              {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{session?.user?.name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
