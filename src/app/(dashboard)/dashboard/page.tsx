import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-card-hover transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="font-display">Iniciar Nova Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Crie uma nova campanha de disparo de mensagens em massa.
              </p>
              <a
                href="/campaigns/new"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Nova Campanha
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="font-display">Importar Lista</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Faça upload de uma planilha com seus contatos.
              </p>
              <a
                href="/lists"
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Gerenciar Listas
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Campanhas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma campanha criada ainda</p>
              <p className="text-sm">
                Crie sua primeira campanha para começar a prospectar
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
