"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { PipelineColumn } from "@/components/crm/PipelineColumn";
import { NewDealModal } from "@/components/crm/NewDealModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, RefreshCw } from "lucide-react";
import type { CrmDeal, CrmStage } from "@/types/crm";

export default function PipelinePage() {
  const router = useRouter();
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [newDealModalOpen, setNewDealModalOpen] = useState(false);
  const [newDealStageId, setNewDealStageId] = useState<string | undefined>();

  // Drag and drop state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stagesRes, dealsRes] = await Promise.all([
        fetch("/api/crm/stages"),
        fetch(`/api/crm/deals${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`),
      ]);

      const stagesData = await stagesRes.json();
      const dealsData = await dealsRes.json();

      if (stagesData.stages) {
        setStages(stagesData.stages);
      }
      if (dealsData.deals) {
        setDeals(dealsData.deals);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    fetchData();
  };

  const handleAddDeal = (stageId: string) => {
    setNewDealStageId(stageId);
    setNewDealModalOpen(true);
  };

  const handleCreateDeal = async (data: {
    title: string;
    contactId?: string;
    value?: number;
    company?: string;
    stageId?: string;
  }) => {
    const response = await fetch("/api/crm/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar deal");
    }

    await fetchData();
  };

  const handleDealClick = (deal: CrmDeal) => {
    router.push(`/pipeline/${deal.id}`);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (stageId: string) => {
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(null);

    if (!draggedDealId || !stageId) return;

    const deal = deals.find((d) => d.id === draggedDealId);
    if (!deal || deal.stageId === stageId) {
      setDraggedDealId(null);
      return;
    }

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === draggedDealId
          ? { ...d, stageId, stage: stages.find((s) => s.id === stageId)! }
          : d
      )
    );

    try {
      const response = await fetch(`/api/crm/deals/${draggedDealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });

      if (!response.ok) {
        throw new Error("Erro ao mover deal");
      }

      // Refresh to get updated counts
      await fetchData();
    } catch (error) {
      console.error("Erro ao mover deal:", error);
      // Revert on error
      await fetchData();
    }

    setDraggedDealId(null);
  };

  // Group deals by stage
  const dealsByStage = stages.reduce(
    (acc, stage) => {
      acc[stage.id] = deals.filter((deal) => deal.stageId === stage.id);
      return acc;
    },
    {} as Record<string, CrmDeal[]>
  );

  // Calculate totals
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const wonDeals = deals.filter((d) => stages.find((s) => s.id === d.stageId)?.isWon);
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <>
      <Header
        title="Pipeline de Vendas"
        description="Gerencie seus deals e acompanhe o progresso das negociações"
      />

      <div className="p-6">
        {/* Stats Bar */}
        <div className="flex flex-wrap items-center gap-6 mb-6 p-4 bg-card rounded-lg border">
          <div>
            <p className="text-sm text-muted-foreground">Total de Deals</p>
            <p className="text-2xl font-bold">{totalDeals}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ganhos</p>
            <p className="text-2xl font-bold text-green-500">
              {formatCurrency(wonValue)}
            </p>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => setNewDealModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Deal
          </Button>
        </div>

        {/* Pipeline Board */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                onDragEnter={() => handleDragEnter(stage.id)}
                onDragLeave={handleDragLeave}
              >
                <PipelineColumn
                  stage={stage}
                  deals={dealsByStage[stage.id] || []}
                  onDealClick={handleDealClick}
                  onAddDeal={handleAddDeal}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragOver={dragOverStageId === stage.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Deal Modal */}
      <NewDealModal
        open={newDealModalOpen}
        onClose={() => {
          setNewDealModalOpen(false);
          setNewDealStageId(undefined);
        }}
        onSubmit={handleCreateDeal}
        defaultStageId={newDealStageId}
      />
    </>
  );
}
