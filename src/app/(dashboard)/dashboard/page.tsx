import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyStateIllustration } from "@/components/illustrations/EmptyState";
import { Send, Users, MessageSquare, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Mensagens Enviadas",
    value: "0",
    description: "Total de mensagens",
    icon: Send,
    color: "text-coral",
    bgColor: "bg-coral/10",
  },
  {
    title: "Contatos",
    value: "0",
    description: "Em todas as listas",
    icon: Users,
    color: "text-navy-300",
    bgColor: "bg-navy-400/20",
  },
  {
    title: "Respostas",
    value: "0",
    description: "Total de retornos",
    icon: MessageSquare,
    color: "text-mint",
    bgColor: "bg-mint/10",
  },
  {
    title: "Taxa de Resposta",
    value: "0%",
    description: "Média geral",
    icon: TrendingUp,
    color: "text-gold",
    bgColor: "bg-gold/10",
  },
];

export default function DashboardPage() {
  return (
    <>
      <Header
        title="Dashboard"
        description="Visão geral das suas campanhas"
      />

      <div className="p-6 space-y-6">
        {/* Stats - Bento Grid */}
        <div className="bento-grid stagger-fast">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-card-hover transition-all duration-200 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-card-hover transition-shadow duration-300 group">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <div className="p-2 rounded-lg bg-coral/10 group-hover:bg-coral/20 transition-colors">
                  <Send className="h-5 w-5 text-coral" />
                </div>
                Iniciar Nova Campanha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Crie uma nova campanha de disparo de mensagens em massa.
              </p>
              <a
                href="/campaigns/new"
                className="inline-flex items-center gap-2 bg-[#ff7336] hover:bg-[#E85520] text-white font-semibold py-2.5 px-5 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,115,54,0.3)] hover:-translate-y-0.5"
              >
                <Send className="h-4 w-4" />
                Nova Campanha
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-shadow duration-300 group">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
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
              <a
                href="/lists"
                className="inline-flex items-center gap-2 border-2 border-[#ff7336] text-[#ff7336] hover:bg-[#ff7336] hover:text-white font-semibold py-2.5 px-5 rounded-lg transition-all hover:-translate-y-0.5"
              >
                <Users className="h-4 w-4" />
                Gerenciar Listas
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Recent Campaigns */}
        <Card className="hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-display">Campanhas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <EmptyStateIllustration variant="campaigns" className="w-40 h-40 mx-auto mb-4" />
              <p className="text-foreground font-medium">Nenhuma campanha criada ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie sua primeira campanha para começar a prospectar
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
