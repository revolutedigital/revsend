"use client";

import { useState } from "react";
import { Users, Trash2, Eye, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ListCardProps {
  list: {
    id: string;
    name: string;
    totalContacts: number;
    createdAt: string;
  };
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export function ListCard({ list, onDelete, onView }: ListCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta lista?")) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/lists?id=${list.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(list.id);
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
    } finally {
      setDeleting(false);
    }
  };

  const formattedDate = new Date(list.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-orange/10 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-orange" />
            </div>
            <div>
              <h3 className="font-semibold">{list.name}</h3>
              <p className="text-sm text-muted-foreground">
                {list.totalContacts} contatos • Criada em {formattedDate}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={deleting}>
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(list.id)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Contatos
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
