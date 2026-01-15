import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const lists = await db.contactList.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    return NextResponse.json({ lists });
  } catch (error) {
    console.error("Erro ao buscar listas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar listas" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("id");

    if (!listId) {
      return NextResponse.json(
        { error: "ID da lista não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se a lista pertence ao usuário
    const list = await db.contactList.findFirst({
      where: {
        id: listId,
        userId: session.user.id,
      },
    });

    if (!list) {
      return NextResponse.json(
        { error: "Lista não encontrada" },
        { status: 404 }
      );
    }

    // Deletar lista (contatos serão deletados em cascata)
    await db.contactList.delete({
      where: { id: listId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar lista:", error);
    return NextResponse.json(
      { error: "Erro ao deletar lista" },
      { status: 500 }
    );
  }
}
