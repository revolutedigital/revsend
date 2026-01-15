"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, User } from "lucide-react";

interface Contact {
  id: string;
  name: string | null;
  phoneNumber: string;
}

interface NewDealModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    contactId?: string;
    value?: number;
    company?: string;
    stageId?: string;
  }) => Promise<void>;
  defaultStageId?: string;
}

export function NewDealModal({
  open,
  onClose,
  onSubmit,
  defaultStageId,
}: NewDealModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [company, setCompany] = useState("");

  // Contact search
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setValue("");
      setCompany("");
      setContactSearch("");
      setContacts([]);
      setSelectedContact(null);
    }
  }, [open]);

  const searchContacts = async (search: string) => {
    if (search.length < 2) {
      setContacts([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Buscar em todas as listas do usuário
      const response = await fetch(`/api/lists`);
      const data = await response.json();

      if (data.lists && data.lists.length > 0) {
        // Buscar contatos da primeira lista (simplificado - idealmente buscaria em todas)
        const allContacts: Contact[] = [];

        for (const list of data.lists.slice(0, 3)) {
          const contactsResponse = await fetch(
            `/api/lists/${list.id}/contacts?search=${encodeURIComponent(search)}&limit=10`
          );
          const contactsData = await contactsResponse.json();

          if (contactsData.contacts) {
            allContacts.push(...contactsData.contacts);
          }
        }

        setContacts(allContacts.slice(0, 10));
      }
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (contactSearch && !selectedContact) {
        searchContacts(contactSearch);
        setShowContactDropdown(true);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [contactSearch, selectedContact]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactSearch(contact.name || contact.phoneNumber);
    setShowContactDropdown(false);
    setContacts([]);
  };

  const handleClearContact = () => {
    setSelectedContact(null);
    setContactSearch("");
    setContacts([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        contactId: selectedContact?.id,
        value: value ? parseFloat(value) : undefined,
        company: company.trim() || undefined,
        stageId: defaultStageId,
      });
      onClose();
    } catch (error) {
      console.error("Erro ao criar deal:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Deal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Proposta para Empresa X"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Contato */}
          <div className="space-y-2">
            <Label>Contato (opcional)</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={contactSearch}
                  onChange={(e) => {
                    setContactSearch(e.target.value);
                    if (selectedContact) {
                      handleClearContact();
                    }
                  }}
                  onFocus={() => contacts.length > 0 && setShowContactDropdown(true)}
                  className="pl-10"
                />
              </div>

              {/* Dropdown de contatos */}
              {showContactDropdown && (contacts.length > 0 || searchLoading) && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    contacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleSelectContact(contact)}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {contact.name || "Sem nome"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contact.phoneNumber}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedContact && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <User className="h-4 w-4 text-orange" />
                <span className="text-sm">
                  {selectedContact.name || selectedContact.phoneNumber}
                </span>
                <button
                  type="button"
                  onClick={handleClearContact}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="value">Valor (R$)</Label>
            <Input
              id="value"
              type="number"
              placeholder="0.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              placeholder="Nome da empresa"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Deal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
