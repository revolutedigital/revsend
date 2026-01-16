"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  Loader2,
  Plus,
  MessageSquare,
  PhoneCall,
  Mail,
  StickyNote,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string | null;
  phoneNumber: string;
  extraFields: Record<string, string> | null;
  list: { name: string } | null;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  isFinal: boolean;
  isWon: boolean;
}

interface Activity {
  id: string;
  activityType: string;
  content: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string | null; email: string };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  priority: string;
}

interface Deal {
  id: string;
  title: string;
  value: number | null;
  probability: number;
  company: string | null;
  notes: string | null;
  expectedCloseDate: string | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  lostReason: string | null;
  wonAt: string | null;
  lostAt: string | null;
  createdAt: string;
  contact: Contact | null;
  stage: Stage;
  activities: Activity[];
  tasks: Task[];
}

export default function DealPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<string>("note");
  const [noteContent, setNoteContent] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const fetchDeal = async () => {
    try {
      const [dealRes, stagesRes] = await Promise.all([
        fetch(`/api/crm/deals/${id}`),
        fetch("/api/crm/stages"),
      ]);

      const dealData = await dealRes.json();
      const stagesData = await stagesRes.json();

      if (dealData.deal) {
        setDeal(dealData.deal);
      }
      if (stagesData.stages) {
        setStages(stagesData.stages);
      }
    } catch (error) {
      console.error("Erro ao carregar deal:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
  }, [id]);

  const handleStageChange = async (newStageId: string) => {
    if (!deal || deal.stage.id === newStageId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/crm/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: newStageId }),
      });

      if (response.ok) {
        await fetchDeal();
      }
    } catch (error) {
      console.error("Erro ao mudar estágio:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddActivity = async () => {
    if (!noteContent.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/crm/deals/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType,
          content: noteContent,
        }),
      });

      if (response.ok) {
        await fetchDeal();
        setNoteContent("");
        setNoteModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao adicionar atividade:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/crm/deals/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          dueDate: taskDueDate || null,
        }),
      });

      if (response.ok) {
        await fetchDeal();
        setTaskTitle("");
        setTaskDueDate("");
        setTaskModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await fetch(`/api/crm/deals/${id}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, completed }),
      });
      await fetchDeal();
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/crm/deals/${id}/tasks?taskId=${taskId}`, {
        method: "DELETE",
      });
      await fetchDeal();
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "note":
        return <StickyNote className="h-4 w-4" />;
      case "call":
        return <PhoneCall className="h-4 w-4" />;
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "stage_change":
        return <ArrowRight className="h-4 w-4" />;
      case "task_completed":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-muted-foreground mb-4">Deal não encontrado</p>
        <Button onClick={() => router.push("/pipeline")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Pipeline
        </Button>
      </div>
    );
  }

  return (
    <>
      <Header
        title={deal.title}
        description={deal.company || ""}
      />

      <div className="p-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/pipeline")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Pipeline
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stage Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Estágio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stages.map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => handleStageChange(stage.id)}
                      disabled={saving}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        deal.stage.id === stage.id
                          ? "text-white"
                          : "bg-muted hover:opacity-80"
                      )}
                      style={{
                        backgroundColor:
                          deal.stage.id === stage.id ? stage.color : undefined,
                      }}
                    >
                      {stage.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tarefas</CardTitle>
                <Button size="sm" onClick={() => setTaskModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Tarefa
                </Button>
              </CardHeader>
              <CardContent>
                {deal.tasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma tarefa
                  </p>
                ) : (
                  <div className="space-y-2">
                    {deal.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          task.completedAt && "opacity-60"
                        )}
                      >
                        <button
                          onClick={() =>
                            handleToggleTask(task.id, !task.completedAt)
                          }
                        >
                          {task.completedAt ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p
                            className={cn(
                              "font-medium",
                              task.completedAt && "line-through"
                            )}
                          >
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Histórico</CardTitle>
                <Button size="sm" onClick={() => setNoteModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Nota
                </Button>
              </CardHeader>
              <CardContent>
                {deal.activities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma atividade registrada
                  </p>
                ) : (
                  <div className="space-y-4">
                    {deal.activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {getActivityIcon(activity.activityType)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.user.name || activity.user.email} •{" "}
                            {formatDate(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="font-semibold">
                    {deal.value ? formatCurrency(deal.value) : "Não definido"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-orange" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Probabilidade:
                  </span>
                  <span className="font-semibold">{deal.probability}%</span>
                </div>

                {deal.expectedCloseDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Previsão:
                    </span>
                    <span className="font-semibold">
                      {new Date(deal.expectedCloseDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}

                {deal.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Empresa:</span>
                    <span className="font-semibold">{deal.company}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Criado:</span>
                  <span className="text-sm">
                    {new Date(deal.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                {deal.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Notas:</p>
                    <p className="text-sm">{deal.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            {deal.contact && (
              <Card>
                <CardHeader>
                  <CardTitle>Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-semibold">
                    {deal.contact.name || "Sem nome"}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{deal.contact.phoneNumber}</span>
                  </div>
                  {deal.contact.list && (
                    <p className="text-xs text-muted-foreground">
                      Lista: {deal.contact.list.name}
                    </p>
                  )}
                  {deal.contact.extraFields &&
                    Object.entries(deal.contact.extraFields).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-muted-foreground">{key}:</span>{" "}
                        <span>{value}</span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Note Modal */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Atividade</DialogTitle>
            <DialogDescription>
              Registre uma nota, ligacao, mensagem ou email relacionado a este deal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              {[
                { type: "note", label: "Nota", icon: StickyNote },
                { type: "call", label: "Ligação", icon: PhoneCall },
                { type: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                { type: "email", label: "Email", icon: Mail },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setActivityType(type)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm",
                    activityType === type
                      ? "bg-orange text-white"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Descreva a atividade..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full h-32 p-3 border rounded-lg resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNoteModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddActivity} disabled={saving || !noteContent.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Modal */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogDescription>
              Crie uma tarefa para acompanhar este deal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Ex: Ligar para confirmar reunião"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento (opcional)</Label>
              <Input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTaskModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddTask} disabled={saving || !taskTitle.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Tarefa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
