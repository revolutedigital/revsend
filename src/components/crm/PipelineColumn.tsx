"use client";

import { Plus } from "lucide-react";
import { DealCard } from "./DealCard";
import { cn } from "@/lib/utils";
import type { CrmDeal, CrmStage } from "@/types/crm";

interface PipelineColumnProps {
  stage: CrmStage;
  deals: CrmDeal[];
  onDealClick: (deal: CrmDeal) => void;
  onAddDeal: (stageId: string) => void;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  isDragOver: boolean;
}

export function PipelineColumn({
  stage,
  deals,
  onDealClick,
  onAddDeal,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: PipelineColumnProps) {
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div
      className={cn(
        "flex flex-col w-72 flex-shrink-0 bg-muted/30 rounded-lg",
        isDragOver && "ring-2 ring-orange ring-opacity-50"
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      {/* Header */}
      <div className="p-3 border-b" style={{ borderColor: stage.color }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <h3 className="font-semibold text-sm">{stage.name}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-muted-foreground">{formatCurrency(totalValue)}</p>
        )}
      </div>

      {/* Deals */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)]">
        {deals.map((deal) => (
          <div
            key={deal.id}
            draggable
            onDragStart={(e) => onDragStart(e, deal.id)}
          >
            <DealCard deal={deal} onClick={() => onDealClick(deal)} />
          </div>
        ))}

        {deals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum deal
          </div>
        )}
      </div>

      {/* Add Button */}
      {!stage.isFinal && (
        <button
          onClick={() => onAddDeal(stage.id)}
          className="m-2 p-2 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Adicionar deal
        </button>
      )}
    </div>
  );
}
