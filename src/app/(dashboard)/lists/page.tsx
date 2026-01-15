"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadDropzone } from "@/components/lists/UploadDropzone";
import { ListCard } from "@/components/lists/ListCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Users,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  User,
} from "lucide-react";

interface ContactList {
  id: string;
  name: string;
  totalContacts: number;
  createdAt: string;
}

interface Contact {
  id: string;
  phoneNumber: string;
  name: string | null;
  extraFields: Record<string, string> | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ListsPage() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLists = async () => {
    try {
      const response = await fetch("/api/lists");
      const data = await response.json();
      if (data.lists) {
        setLists(data.lists);
      }
    } catch (error) {
      console.error("Erro ao buscar listas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchContacts = async (listId: string, page: number = 1, search: string = "") => {
    setContactsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/lists/${listId}/contacts?${params}`);
      const data = await response.json();

      if (data.contacts) {
        setContacts(data.contacts);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setLists((prev) => prev.filter((list) => list.id !== id));
  };

  const handleView = (id: string) => {
    const list = lists.find((l) => l.id === id);
    if (list) {
      setSelectedList(list);
      setModalOpen(true);
      setSearchTerm("");
      setCurrentPage(1);
      fetchContacts(id, 1, "");
    }
  };

  const handleSearch = () => {
    if (selectedList) {
      setCurrentPage(1);
      fetchContacts(selectedList.id, 1, searchTerm);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (selectedList) {
      setCurrentPage(newPage);
      fetchContacts(selectedList.id, newPage, searchTerm);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedList(null);
    setContacts([]);
    setPagination(null);
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <>
      <Header
        title="Listas de Contatos"
        description="Gerencie suas listas de contatos para campanhas"
      />

      <div className="p-6 space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-orange" />
              Importar Nova Lista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UploadDropzone onUploadComplete={fetchLists} />
          </CardContent>
        </Card>

        {/* Lists */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Suas Listas</span>
              {!loading && lists.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {lists.length} lista{lists.length !== 1 ? "s" : ""}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma lista criada ainda</p>
                <p className="text-sm">
                  Importe uma planilha para criar sua primeira lista
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    onDelete={handleDelete}
                    onView={handleView}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Contatos */}
      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange" />
              {selectedList?.name}
            </DialogTitle>
            <DialogDescription>
              {pagination?.total || 0} contato{(pagination?.total || 0) !== 1 ? "s" : ""} na lista
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="secondary">
              Buscar
            </Button>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {contactsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum contato encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {contact.name || "Sem nome"}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{contact.phoneNumber}</span>
                      </div>
                    </div>
                    {contact.extraFields && Object.keys(contact.extraFields).length > 0 && (
                      <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px]">
                        {Object.entries(contact.extraFields).slice(0, 2).map(([key, value]) => (
                          <span
                            key={key}
                            className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground truncate max-w-[90px]"
                            title={`${key}: ${value}`}
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || contactsLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages || contactsLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
