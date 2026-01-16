"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

// Mapeamento de rotas para labels em portugues
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  pipeline: "Pipeline",
  lists: "Listas",
  campaigns: "Campanhas",
  templates: "Templates",
  replies: "Respostas",
  reports: "Relatorios",
  settings: "Configuracoes",
  new: "Nova",
};

interface BreadcrumbProps {
  className?: string;
  customLabels?: Record<string, string>;
}

export function Breadcrumb({ className, customLabels = {} }: BreadcrumbProps) {
  const pathname = usePathname();

  // Ignorar a rota raiz
  if (pathname === "/" || pathname === "/dashboard") {
    return null;
  }

  // Separar segmentos da rota
  const segments = pathname.split("/").filter(Boolean);

  // Construir breadcrumbs
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    // Verificar se e um UUID (ID dinamico)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

    // Pegar label customizado ou do mapeamento
    let label = customLabels[segment] || routeLabels[segment] || segment;

    // Se for UUID, mostrar "Detalhes"
    if (isUuid) {
      label = "Detalhes";
    }

    // Capitalizar primeira letra se nao encontrou label
    if (label === segment) {
      label = segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    return { href, label, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm text-muted-foreground", className)}
    >
      {/* Home link */}
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

// Componente para usar no Header com estilo integrado
export function HeaderBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();

  // Nao mostrar breadcrumb no dashboard principal
  if (pathname === "/dashboard") {
    return null;
  }

  return (
    <div className={cn("mb-2", className)}>
      <Breadcrumb />
    </div>
  );
}
