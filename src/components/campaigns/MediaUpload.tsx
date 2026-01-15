"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Image,
  Mic,
  Video,
  Upload,
  X,
  Loader2,
  Play,
  FileAudio,
} from "lucide-react";

interface MediaUploadProps {
  onUpload: (media: {
    url: string;
    type: "image" | "audio" | "video";
    name: string;
  }) => void;
  currentMedia?: {
    url: string;
    type: string;
    name: string;
  } | null;
  onRemove: () => void;
}

export function MediaUpload({
  onUpload,
  currentMedia,
  onRemove,
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      onUpload({
        url: data.url,
        type: data.mediaType,
        name: data.originalName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-5 w-5" />;
      case "audio":
        return <FileAudio className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      default:
        return <Upload className="h-5 w-5" />;
    }
  };

  const renderPreview = () => {
    if (!currentMedia) return null;

    return (
      <div className="relative inline-flex items-center gap-3 p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          {currentMedia.type === "image" ? (
            <img
              src={currentMedia.url}
              alt="Preview"
              className="h-12 w-12 object-cover rounded"
            />
          ) : currentMedia.type === "audio" ? (
            <div className="h-12 w-12 bg-orange/10 rounded flex items-center justify-center">
              <FileAudio className="h-6 w-6 text-orange" />
            </div>
          ) : (
            <div className="h-12 w-12 bg-purple-500/10 rounded flex items-center justify-center">
              <Video className="h-6 w-6 text-purple-500" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium truncate max-w-[200px]">
              {currentMedia.name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {currentMedia.type === "image"
                ? "Imagem"
                : currentMedia.type === "audio"
                ? "Áudio"
                : "Vídeo"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {currentMedia ? (
        renderPreview()
      ) : (
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,audio/*,video/*"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Adicionar mídia
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground self-center">
            Imagem, áudio ou vídeo (máx. 16MB)
          </span>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
