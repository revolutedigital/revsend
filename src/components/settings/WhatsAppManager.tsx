"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Smartphone,
  Plus,
  QrCode,
  Wifi,
  WifiOff,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface WhatsAppNumber {
  id: string;
  name: string;
  phoneNumber: string;
  status: string;
}

export function WhatsAppManager() {
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<WhatsAppNumber | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchNumbers = useCallback(async () => {
    try {
      const response = await fetch("/api/whatsapp");
      const data = await response.json();
      if (data.numbers) {
        setNumbers(data.numbers);
      }
    } catch (error) {
      console.error("Erro ao buscar números:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNumbers();
  }, [fetchNumbers]);

  const handleAdd = async () => {
    if (!newName.trim()) return;

    setAdding(true);
    try {
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        setShowAddDialog(false);
        setNewName("");
        fetchNumbers();
      }
    } catch (error) {
      console.error("Erro ao adicionar:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleConnect = async (number: WhatsAppNumber) => {
    setSelectedNumber(number);
    setShowQRDialog(true);
    setConnecting(true);
    setQrCode(null);

    try {
      const response = await fetch(`/api/whatsapp/${number.id}/connect`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.qrCode) {
        setQrCode(data.qrCode);
      }

      // Polling para verificar status
      const interval = setInterval(async () => {
        const statusResponse = await fetch(`/api/whatsapp/${number.id}/status`);
        const statusData = await statusResponse.json();

        if (statusData.qrCode) {
          setQrCode(statusData.qrCode);
        }

        if (statusData.status === "connected") {
          clearInterval(interval);
          setShowQRDialog(false);
          setQrCode(null);
          fetchNumbers();
        }
      }, 3000);

      // Timeout após 2 minutos
      setTimeout(() => {
        clearInterval(interval);
        if (qrCode) {
          setConnecting(false);
        }
      }, 120000);
    } catch (error) {
      console.error("Erro ao conectar:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (number: WhatsAppNumber) => {
    if (!confirm("Tem certeza que deseja desconectar este WhatsApp?")) return;

    try {
      await fetch(`/api/whatsapp/${number.id}/disconnect`, {
        method: "POST",
      });
      fetchNumbers();
    } catch (error) {
      console.error("Erro ao desconectar:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este número?")) return;

    try {
      const response = await fetch(`/api/whatsapp?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchNumbers();
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {numbers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Smartphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Nenhum WhatsApp conectado</p>
            <p className="text-sm mb-4">
              Adicione um número para começar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {numbers.map((number) => (
              <Card key={number.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {number.status === "connected" ? (
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Wifi className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <WifiOff className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{number.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {number.phoneNumber || "Não conectado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {number.status === "connected" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(number)}
                        >
                          Desconectar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleConnect(number)}
                        >
                          <QrCode className="h-4 w-4" />
                          Conectar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(number.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {numbers.length < 4 && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Adicionar WhatsApp
          </Button>
        )}
      </div>

      {/* Dialog para adicionar novo número */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do WhatsApp</Label>
              <Input
                id="name"
                placeholder="Ex: WhatsApp Comercial"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <Button
              variant="orange"
              className="w-full"
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
            >
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para QR Code */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {qrCode ? (
              <>
                <div className="bg-white p-4 rounded-lg shadow-inner">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Abra o WhatsApp no seu celular, vá em
                  <br />
                  <strong>Configurações &gt; Aparelhos conectados</strong>
                  <br />e escaneie o código QR
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => selectedNumber && handleConnect(selectedNumber)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar QR Code
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-orange mb-4" />
                <p className="text-muted-foreground">
                  {connecting ? "Gerando QR Code..." : "Aguardando conexão..."}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
