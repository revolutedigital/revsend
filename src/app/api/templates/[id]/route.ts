import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Buscar template específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const template = await db.messageTemplate.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Erro ao buscar template:", error);
    return NextResponse.json(
      { error: "Erro ao buscar template" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar template
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o template pertence ao usuário
    const existing = await db.messageTemplate.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, category, content, mediaType, mediaUrl, mediaName } = body;

    const template = await db.messageTemplate.update({
      where: { id: params.id },
      data: {
        name: name ?? existing.name,
        category: category !== undefined ? category : existing.category,
        content: content ?? existing.content,
        mediaType: mediaType !== undefined ? mediaType : existing.mediaType,
        mediaUrl: mediaUrl !== undefined ? mediaUrl : existing.mediaUrl,
        mediaName: mediaName !== undefined ? mediaName : existing.mediaName,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Erro ao atualizar template:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar template" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir template
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o template pertence ao usuário
    const existing = await db.messageTemplate.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    await db.messageTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir template:", error);
    return NextResponse.json(
      { error: "Erro ao excluir template" },
      { status: 500 }
    );
  }
}
