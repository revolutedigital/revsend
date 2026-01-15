import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Listar templates do usuário
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const templates = await db.messageTemplate.findMany({
      where: {
        userId: session.user.id,
        ...(category ? { category } : {}),
      },
      orderBy: [
        { timesUsed: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Erro ao buscar templates:", error);
    return NextResponse.json(
      { error: "Erro ao buscar templates" },
      { status: 500 }
    );
  }
}

// POST - Criar novo template
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, content, mediaType, mediaUrl, mediaName } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: "Nome e conteúdo são obrigatórios" },
        { status: 400 }
      );
    }

    const template = await db.messageTemplate.create({
      data: {
        userId: session.user.id,
        name,
        category: category || null,
        content,
        mediaType: mediaType || null,
        mediaUrl: mediaUrl || null,
        mediaName: mediaName || null,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar template:", error);
    return NextResponse.json(
      { error: "Erro ao criar template" },
      { status: 500 }
    );
  }
}
