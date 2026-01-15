"use client";

import { Phone, Building2, Calendar, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CrmDeal } from "@/types/crm";

interface DealCardProps {
  deal: CrmDeal;
  onClick: () => void;
  isDragging?: boolean;
}

export function DealCard({ deal, onClick, isDragging }: DealCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Amanhã";
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const isOverdue = deal.nextActionAt && new Date(deal.nextActionAt) < new Date();

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:border-orange/50",
        isDragging && "opacity-50 rotate-2 shadow-lg"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5 cursor-grab" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{deal.title}</h4>
          {deal.contact && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Phone className="h-3 w-3" />
              <span className="truncate">
                {deal.contact.name || deal.contact.phoneNumber}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Value & Probability */}
      <div className="flex items-center justify-between mb-2">
        {deal.value ? (
          <span className="text-sm font-semibold text-green-500">
            {formatCurrency(deal.value)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sem valor</span>
        )}
        <div className="flex items-center gap-1">
          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-orange transition-all"
              style={{ width: `${deal.probability}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{deal.probability}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        {deal.company && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{deal.company}</span>
          </div>
        )}
        {deal.nextActionAt && (
          <div
            className={cn(
              "flex items-center gap-1",
              isOverdue ? "text-red-500" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-3 w-3" />
            <span>{formatDate(deal.nextActionAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
