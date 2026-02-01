import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - Listar templates do usuário
export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const templates = await db.messageTemplate.findMany({
    where: {
      userId: session!.user.id,
      ...(category ? { category } : {}),
    },
    orderBy: [
      { timesUsed: "desc" },
      { updatedAt: "desc" },
    ],
  });

  return NextResponse.json({ templates });
});

// POST - Criar novo template
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { name, category, content, mediaType, mediaUrl, mediaName } = body;

  if (!name || !content) {
    return NextResponse.json(
      { error: "Nome e conteúdo são obrigatórios" },
      { status: 400 }
    );
  }

  const template = await db.messageTemplate.create({
    data: {
      userId: session!.user.id,
      name,
      category: category || null,
      content,
      mediaType: mediaType || null,
      mediaUrl: mediaUrl || null,
      mediaName: mediaName || null,
    },
  });

  return NextResponse.json({ template }, { status: 201 });
});
