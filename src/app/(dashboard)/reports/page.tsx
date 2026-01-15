"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Loader2,
  Send,
  Users,
  MessageSquare,
  TrendingUp,
  Smartphone,
} from "lucide-react";

interface ReportData {
  overview: {
    totalCampaigns: number;
    completedCampaigns: number;
    totalContacts: number;
    totalSentMessages: number;
    totalReplies: number;
    responseRate: string;
  };
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    totalSent: number;
    totalFailed: number;
    totalReplies: number;
    responseRate: string;
    deliveryRate: string;
    createdAt: string;
  }>;
  whatsappStats: Array<{
    id: string;
    name: string;
    phoneNumber: string;
    messagesSent: number;
    repliesReceived: number;
  }>;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/reports");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Erro ao buscar relatórios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <>
        <Header
          title="Relatórios"
          description="Analise o desempenho das suas campanhas"
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header
          title="Relatórios"
          description="Analise o desempenho das suas campanhas"
        />
        <div className="p-6">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Erro ao carregar relatórios</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const stats = [
    {
      title: "Campanhas",
      value: data.overview.totalCampaigns,
      description: `${data.overview.completedCampaigns} concluídas`,
      icon: Send,
      color: "text-orange",
      bgColor: "bg-orange/10",
    },
    {
      title: "Contatos",
      value: data.overview.totalContacts.toLocaleString("pt-BR"),
      description: "Em todas as listas",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Mensagens Enviadas",
      value: data.overview.totalSentMessages.toLocaleString("pt-BR"),
      description: "Total de envios",
      icon: MessageSquare,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Taxa de Resposta",
      value: data.overview.responseRate,
      description: `${data.overview.totalReplies} respostas`,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <>
      <Header
        title="Relatórios"
        description="Analise o desempenho das suas campanhas"
      />

      <div className="p-6 space-y-6">
        {/* Overview Stats */}
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

        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            {data.campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma campanha executada ainda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">
                        Campanha
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        Status
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        Enviadas
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        Falhas
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        Respostas
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        Taxa Resposta
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b">
                        <td className="py-3 px-4 font-medium">
                          {campaign.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              campaign.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {campaign.status === "completed"
                              ? "Concluída"
                              : "Em andamento"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-green-600">
                          {campaign.totalSent}
                        </td>
                        <td className="py-3 px-4 text-center text-red-600">
                          {campaign.totalFailed}
                        </td>
                        <td className="py-3 px-4 text-center text-blue-600">
                          {campaign.totalReplies}
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {campaign.responseRate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-orange" />
              Desempenho por WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.whatsappStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum WhatsApp utilizado ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.whatsappStats.map((wa) => (
                  <div key={wa.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{wa.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {wa.phoneNumber || "Não conectado"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {wa.messagesSent}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Enviadas
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {wa.repliesReceived}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Respostas
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
