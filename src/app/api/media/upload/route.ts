import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  audio: ["audio/mpeg", "audio/ogg", "audio/wav", "audio/mp4", "audio/aac"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

function getMediaType(mimeType: string): string | null {
  for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type;
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 16MB" },
        { status: 400 }
      );
    }

    // Validar tipo
    const mediaType = getMediaType(file.type);
    if (!mediaType) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido" },
        { status: 400 }
      );
    }

    // Criar diretório se não existir
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Gerar nome único
    const ext = path.extname(file.name);
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // URL pública
    const url = `/uploads/${filename}`;

    // Salvar no banco
    const mediaFile = await db.mediaFile.create({
      data: {
        userId: session.user.id,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url,
      },
    });

    return NextResponse.json({
      id: mediaFile.id,
      url: mediaFile.url,
      filename: mediaFile.filename,
      originalName: mediaFile.originalName,
      mimeType: mediaFile.mimeType,
      mediaType,
      size: mediaFile.size,
    });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload do arquivo" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const files = await db.mediaFile.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    return NextResponse.json(
      { error: "Erro ao listar arquivos" },
      { status: 500 }
    );
  }
}
