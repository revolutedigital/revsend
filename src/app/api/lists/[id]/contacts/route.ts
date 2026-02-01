import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = apiHandler(async (req: NextRequest, { params, session }) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";

  // Verificar se a lista pertence ao usuário
  const list = await db.contactList.findFirst({
    where: {
      id: params?.id,
      userId: session!.user.id,
    },
  });

  if (!list) {
    return NextResponse.json(
      { error: "Lista não encontrada" },
      { status: 404 }
    );
  }

  // Buscar contatos com paginação
  const where = {
    listId: params?.id,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phoneNumber: { contains: search } },
          ],
        }
      : {}),
  };

  const [contacts, total] = await Promise.all([
    db.contact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.contact.count({ where }),
  ]);

  return NextResponse.json({
    contacts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
