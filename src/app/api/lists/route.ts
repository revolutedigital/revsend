import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const lists = await db.contactList.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { contacts: true },
      },
    },
  });

  return NextResponse.json({ lists });
});

export const DELETE = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = new URL(req.url);
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
      userId: session!.user.id,
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
});
