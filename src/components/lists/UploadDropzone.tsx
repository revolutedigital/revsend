"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UploadDropzoneProps {
  onUploadComplete: () => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function UploadDropzone({ onUploadComplete }: UploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [listName, setListName] = useState("");
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [result, setResult] = useState<{
    totalContacts?: number;
    skippedContacts?: number;
    error?: string;
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setListName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      setStatus("idle");
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", listName);

      const response = await fetch("/api/lists/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setResult({ error: data.error || "Erro ao fazer upload" });
        return;
      }

      setStatus("success");
      setResult({
        totalContacts: data.list.totalContacts,
        skippedContacts: data.list.skippedContacts,
      });

      // Limpar após sucesso
      setTimeout(() => {
        setFile(null);
        setListName("");
        setStatus("idle");
        setResult(null);
        onUploadComplete();
      }, 2000);
    } catch {
      setStatus("error");
      setResult({ error: "Erro de conexão. Tente novamente." });
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setListName("");
    setStatus("idle");
    setResult(null);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-orange bg-orange/5"
              : "border-border hover:border-orange/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-orange font-medium">Solte o arquivo aqui...</p>
          ) : (
            <>
              <p className="text-muted-foreground mb-2">
                Arraste um arquivo CSV ou XLSX aqui
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique para selecionar
              </p>
              <Button variant="orange" type="button">
                Selecionar Arquivo
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
            <FileSpreadsheet className="h-10 w-10 text-green-600" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {status === "idle" && (
              <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                Remover
              </Button>
            )}
          </div>

          {status === "idle" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="listName">Nome da Lista</Label>
                <Input
                  id="listName"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="Ex: Leads Janeiro 2026"
                />
              </div>

              <Button
                variant="orange"
                className="w-full"
                onClick={handleUpload}
                disabled={!listName.trim()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Lista
              </Button>
            </>
          )}

          {status === "uploading" && (
            <div className="flex items-center justify-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-orange" />
              <span>Processando planilha com IA...</span>
            </div>
          )}

          {status === "success" && result && (
            <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="font-medium">Lista importada com sucesso!</p>
                <p className="text-sm">
                  {result.totalContacts} contatos importados
                  {result.skippedContacts && result.skippedContacts > 0 && (
                    <>, {result.skippedContacts} ignorados (telefone inválido)</>
                  )}
                </p>
              </div>
            </div>
          )}

          {status === "error" && result?.error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg">
              <XCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Erro ao importar</p>
                <p className="text-sm">{result.error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        A IA irá analisar e normalizar automaticamente os campos da sua planilha.
        Formatos aceitos: CSV, XLS, XLSX
      </p>
    </div>
  );
}
