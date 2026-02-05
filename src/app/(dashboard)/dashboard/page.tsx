"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyStateIllustration } from "@/components/illustrations/EmptyState";
import { usePermission } from "@/hooks/use-permission";
import {
  Send,
  Users,
  MessageSquare,
  TrendingUp,
  Building2,
  Briefcase,
  Target,
  Clock,
  CheckCircle2,
  Loader2,
  Trophy,
  DollarSign,
  Calendar,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardData {
  type: "master_global" | "gerente" | "vendedor";
  stats: Record<string, number | string>;
  // Master specific
  campaignsByStatus?: Record<string, number>;
  recentOrgs?: Array<{
    id: string;
    name: string;
    plan: string;
    membersCount: number;
    campaignsCount: number;
    createdAt: string;
  }>;
  // Gerente specific
  team?: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    dealsCount: number;
    dealsValue: number;
  }>;
  recentCampaigns?: Array<{
    id: string;
    name: string;
    status: string;
    totalSent: number;
    totalReplies: number;
    createdAt: string;
  }>;
  pipeline?: Array<{
    stageId: string;
    stageName: string;
    stageColor: string;
    count: number;
    totalValue: number;
  }>;
  leadsByStatus?: Record<string, number>;
  // Vendedor specific
  recentDeals?: Array<{
    id: string;
    title: string;
    value: number;
    stage: { name: string; color: string };
    contact: { name: string; phoneNumber: string };
    updatedAt: string;
  }>;
  upcomingTasks?: Array<{
    id: string;
    title: string;
    dueDate: string;
    deal: { id: string; title: string };
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { role, isMaster } = usePermission();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!session?.user?.currentOrgId && !session?.user?.isMaster) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/dashboard");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [session?.user?.currentOrgId, session?.user?.isMaster]);

  if (loading) {
    return (
      <>
        <Header title="Dashboard" description="Carregando..." />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  // Render based on dashboard type
  if (data?.type === "master_global") {
    return <MasterDashboard data={data} />;
  }

  if (data?.type === "gerente") {
    return <GerenteDashboard data={data} />;
  }

  if (data?.type === "vendedor") {
    return <VendedorDashboard data={data} />;
  }

  // Fallback - no org selected
  return (
    <>
      <Header
        title="Dashboard"
        description="Selecione uma organizacao para ver as metricas"
      />
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Selecione uma organizacao no menu lateral para ver o dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function MasterDashboard({ data }: { data: DashboardData }) {
  const stats = data.stats;
  return (
    <>
      <Header
        title="Dashboard Master"
        description="Visao geral de todas as organizacoes"
      />
      <div className="p-6 space-y-6">
        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Organizacoes"
            value={stats.totalOrgs?.toString() || "0"}
            icon={Building2}
            color="text-purple-500"
            bgColor="bg-purple-500/10"
          />
          <StatCard
            title="Usuarios"
            value={stats.totalUsers?.toString() || "0"}
            icon={Users}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
          />
          <StatCard
            title="Campanhas"
            value={stats.totalCampaigns?.toString() || "0"}
            icon={Send}
            color="text-green-500"
            bgColor="bg-green-500/10"
          />
          <StatCard
            title="Deals"
            value={stats.totalDeals?.toString() || "0"}
            icon={Briefcase}
            color="text-orange"
            bgColor="bg-orange/10"
          />
        </div>

        {/* Campaign Status */}
        {data.campaignsByStatus && Object.keys(data.campaignsByStatus).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Campanhas por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                {Object.entries(data.campaignsByStatus).map(([status, count]) => (
                  <div key={status} className="px-4 py-2 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Organizations */}
        {data.recentOrgs && data.recentOrgs.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Organizacoes Recentes</CardTitle>
              <Link href="/admin/organizations" className="text-sm text-orange hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentOrgs.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-orange" />
                      </div>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {org.membersCount} membros • {org.campaignsCount} campanhas
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function GerenteDashboard({ data }: { data: DashboardData }) {
  const stats = data.stats;
  return (
    <>
      <Header
        title="Dashboard"
        description="Visao geral da sua organizacao"
      />
      <div className="p-6 space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Mensagens Enviadas"
            value={stats.totalSent?.toString() || "0"}
            icon={Send}
            color="text-coral"
            bgColor="bg-coral/10"
          />
          <StatCard
            title="Contatos"
            value={stats.totalContacts?.toString() || "0"}
            icon={Users}
            color="text-navy-300"
            bgColor="bg-navy-400/20"
          />
          <StatCard
            title="Respostas"
            value={stats.totalReplies?.toString() || "0"}
            icon={MessageSquare}
            color="text-mint"
            bgColor="bg-mint/10"
          />
          <StatCard
            title="Taxa de Resposta"
            value={stats.responseRate?.toString() || "0%"}
            icon={TrendingUp}
            color="text-gold"
            bgColor="bg-gold/10"
          />
        </div>

        {/* Second row - Deals stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            title="Total de Deals"
            value={stats.totalDeals?.toString() || "0"}
            icon={Briefcase}
            color="text-purple-500"
            bgColor="bg-purple-500/10"
          />
          <StatCard
            title="Campanhas Ativas"
            value={stats.activeCampaigns?.toString() || "0"}
            icon={Target}
            color="text-green-500"
            bgColor="bg-green-500/10"
          />
          <StatCard
            title="Total de Campanhas"
            value={stats.totalCampaigns?.toString() || "0"}
            icon={Send}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline */}
          {data.pipeline && data.pipeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-orange" />
                  Funil de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.pipeline.map((stage) => (
                    <div key={stage.stageId} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stage.stageColor }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{stage.stageName}</span>
                          <span className="text-sm text-muted-foreground">{stage.count} deals</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: stage.stageColor,
                              width: `${Math.min((stage.count / (data.stats.totalDeals as number || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Ranking */}
          {data.team && data.team.filter(m => m.role === "vendedor").length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-gold" />
                  Ranking da Equipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.team
                    .filter(m => m.role === "vendedor")
                    .sort((a, b) => b.dealsCount - a.dealsCount)
                    .slice(0, 5)
                    .map((member, index) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? "bg-gold/20 text-gold" :
                          index === 1 ? "bg-gray-300/20 text-gray-500" :
                          index === 2 ? "bg-orange/20 text-orange" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.name || member.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.dealsCount} deals • R$ {(member.dealsValue / 100).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Campaigns */}
        {data.recentCampaigns && data.recentCampaigns.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Campanhas Recentes</CardTitle>
              <Link href="/campaigns" className="text-sm text-orange hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.totalSent} enviadas • {campaign.totalReplies} respostas
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        campaign.status === "running" ? "bg-green-500/10 text-green-500" :
                        campaign.status === "completed" ? "bg-blue-500/10 text-blue-500" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-card-hover transition-shadow group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-coral/10 group-hover:bg-coral/20 transition-colors">
                  <Send className="h-5 w-5 text-coral" />
                </div>
                Nova Campanha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Crie uma nova campanha de disparo de mensagens.
              </p>
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-2 bg-[#ff7336] hover:bg-[#E85520] text-white font-semibold py-2.5 px-5 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,115,54,0.3)]"
              >
                <Send className="h-4 w-4" />
                Nova Campanha
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-shadow group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-mint/10 group-hover:bg-mint/20 transition-colors">
                  <Users className="h-5 w-5 text-mint" />
                </div>
                Importar Lista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Faca upload de uma planilha com seus contatos.
              </p>
              <Link
                href="/lists"
                className="inline-flex items-center gap-2 border-2 border-[#ff7336] text-[#ff7336] hover:bg-[#ff7336] hover:text-white font-semibold py-2.5 px-5 rounded-lg transition-all"
              >
                <Users className="h-4 w-4" />
                Gerenciar Listas
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function VendedorDashboard({ data }: { data: DashboardData }) {
  const stats = data.stats;
  return (
    <>
      <Header
        title="Meu Dashboard"
        description="Suas metricas pessoais"
      />
      <div className="p-6 space-y-6">
        {/* Personal Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Meus Deals"
            value={stats.myDeals?.toString() || "0"}
            icon={Briefcase}
            color="text-purple-500"
            bgColor="bg-purple-500/10"
          />
          <StatCard
            title="Ganhos"
            value={stats.myDealsWon?.toString() || "0"}
            icon={Trophy}
            color="text-green-500"
            bgColor="bg-green-500/10"
          />
          <StatCard
            title="Taxa de Ganho"
            value={stats.winRate?.toString() || "0%"}
            icon={TrendingUp}
            color="text-gold"
            bgColor="bg-gold/10"
          />
          <StatCard
            title="Valor Total"
            value={`R$ ${((stats.totalValue as number || 0) / 100).toLocaleString("pt-BR")}`}
            icon={DollarSign}
            color="text-mint"
            bgColor="bg-mint/10"
          />
        </div>

        {/* Tasks stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Tarefas Pendentes"
            value={stats.myPendingTasks?.toString() || "0"}
            icon={Clock}
            color="text-yellow-500"
            bgColor="bg-yellow-500/10"
          />
          <StatCard
            title="Total de Tarefas"
            value={stats.myTasks?.toString() || "0"}
            icon={CheckCircle2}
            color="text-blue-500"
            bgColor="bg-blue-500/10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Pipeline */}
          {data.pipeline && data.pipeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-orange" />
                  Meu Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.pipeline.map((stage) => (
                    <div key={stage.stageId} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stage.stageColor }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{stage.stageName}</span>
                          <span className="text-sm text-muted-foreground">{stage.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Tasks */}
          {data.upcomingTasks && data.upcomingTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange" />
                  Proximas Tarefas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.upcomingTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/pipeline/${task.deal.id}`}
                      className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.deal.title} • {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: ptBR })}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Deals */}
        {data.recentDeals && data.recentDeals.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Meus Deals Recentes</CardTitle>
              <Link href="/pipeline" className="text-sm text-orange hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/pipeline/${deal.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: deal.stage.color }}
                      />
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {deal.contact.name} • {deal.stage.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {(deal.value / 100).toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(deal.updatedAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Action */}
        <Card className="hover:shadow-card-hover transition-shadow group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Briefcase className="h-5 w-5 text-purple-500" />
              </div>
              Ver Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gerencie seus deals e acompanhe o progresso das negociacoes.
            </p>
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 bg-[#ff7336] hover:bg-[#E85520] text-white font-semibold py-2.5 px-5 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,115,54,0.3)]"
            >
              <Briefcase className="h-4 w-4" />
              Abrir Pipeline
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="hover:shadow-card-hover transition-all duration-200 group">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${bgColor} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display">{value}</div>
      </CardContent>
    </Card>
  );
}
