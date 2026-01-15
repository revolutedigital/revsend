"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Send,
  Loader2,
  Play,
  Pause,
  MoreVertical,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalSent: number;
  totalFailed: number;
  totalReplies: number;
  createdAt: string;
  list: {
    name: string;
    totalContacts: number;
  } | null;
  _count: {
    messages: number;
    campaignNumbers: number;
  };
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Rascunho",
    color: "bg-gray-100 text-gray-700",
    icon: <Clock className="h-4 w-4" />,
  },
  running: {
    label: "Enviando",
    color: "bg-orange-100 text-orange-700",
    icon: <Send className="h-4 w-4" />,
  },
  paused: {
    label: "Pausada",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Pause className="h-4 w-4" />,
  },
  completed: {
    label: "Concluída",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="h-4 w-4" />,
  },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns");
      const data = await response.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    // Atualizar a cada 5 segundos se houver campanhas em execução
    const interval = setInterval(() => {
      if (campaigns.some((c) => c.status === "running")) {
        fetchCampaigns();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [campaigns]);

  const handleStart = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}/start`, {
        method: "POST",
      });

      if (response.ok) {
        fetchCampaigns();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao iniciar campanha");
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await fetch(`/api/campaigns/${id}/pause`, { method: "POST" });
      fetchCampaigns();
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return;

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  return (
    <>
      <Header
        title="Campanhas"
        description="Gerencie suas campanhas de disparo"
      />

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Link href="/campaigns/new">
            <Button variant="orange" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Campanha
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Suas Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma campanha criada ainda</p>
                <p className="text-sm">
                  Crie sua primeira campanha para começar a prospectar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const status = statusConfig[campaign.status] || statusConfig.draft;
                  const progress = campaign.list
                    ? Math.round(
                        ((campaign.totalSent + campaign.totalFailed) /
                          campaign.list.totalContacts) *
                          100
                      )
                    : 0;

                  return (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Lista: {campaign.list?.name || "Não definida"}
                          </span>
                          <span>•</span>
                          <span>{campaign._count.messages} mensagens</span>
                          <span>•</span>
                          <span>{campaign._count.campaignNumbers} WhatsApps</span>
                        </div>
                        {campaign.status === "running" && campaign.list && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-orange transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-muted-foreground">
                                {campaign.totalSent}/{campaign.list.totalContacts}
                              </span>
                            </div>
                          </div>
                        )}
                        {campaign.status === "completed" && (
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-green-600">
                              {campaign.totalSent} enviadas
                            </span>
                            {campaign.totalFailed > 0 && (
                              <span className="text-red-600">
                                {campaign.totalFailed} falharam
                              </span>
                            )}
                            {campaign.totalReplies > 0 && (
                              <span className="text-blue-600">
                                {campaign.totalReplies} respostas
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {(campaign.status === "draft" ||
                          campaign.status === "paused") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleStart(campaign.id)}
                          >
                            <Play className="h-4 w-4" />
                            Iniciar
                          </Button>
                        )}
                        {campaign.status === "running" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handlePause(campaign.id)}
                          >
                            <Pause className="h-4 w-4" />
                            Pausar
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/campaigns/${campaign.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            {campaign.status !== "running" && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(campaign.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
