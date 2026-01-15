"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, ExternalLink, Phone } from "lucide-react";

interface Reply {
  id: string;
  content: string;
  receivedAt: string;
  contact: {
    name: string | null;
    phoneNumber: string;
  };
  campaign: {
    name: string;
  };
  whatsappNumber: {
    name: string;
    phoneNumber: string;
  };
}

export default function RepliesPage() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReplies = async () => {
    try {
      const response = await fetch(`/api/replies?page=${page}`);
      const data = await response.json();
      if (data.replies) {
        setReplies(data.replies);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Erro ao buscar respostas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [page]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 13 && phone.startsWith("55")) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  return (
    <>
      <Header
        title="Respostas"
        description="Veja todas as respostas recebidas das suas campanhas"
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Respostas Recebidas</span>
              {!loading && replies.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {replies.length} resposta{replies.length !== 1 ? "s" : ""}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : replies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma resposta recebida ainda</p>
                <p className="text-sm">
                  Quando seus contatos responderem, aparecerá aqui
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Phone className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {reply.contact.name || "Sem nome"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatPhone(reply.contact.phoneNumber)}
                            </p>
                          </div>
                        </div>
                        <div className="bg-muted p-3 rounded-lg mt-2">
                          <p className="text-sm">{reply.content}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Campanha: {reply.campaign.name}</span>
                          <span>•</span>
                          <span>Via: {reply.whatsappNumber.name}</span>
                          <span>•</span>
                          <span>{formatDate(reply.receivedAt)}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => openWhatsApp(reply.contact.phoneNumber)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Responder
                      </Button>
                    </div>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
