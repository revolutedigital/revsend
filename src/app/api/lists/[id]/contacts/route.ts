import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = apiHandler(async (req: NextRequest, { params, session }) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const search = searchParams.get("search") || "";
  const tagsParam = searchParams.get("tags") || "";

  // Verificar se a lista pertence à organização
  const list = await db.contactList.findFirst({
    where: {
      id: params?.id,
      organizationId: session!.user.organizationId!,
    },
  });

  if (!list) {
    return NextResponse.json(
      { error: "Lista não encontrada" },
      { status: 404 }
    );
  }

  // Parse tags filter (comma-separated tag IDs or names)
  const tagFilters = tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // Buscar contatos com paginação
  const where: Record<string, unknown> = {
    listId: params?.id,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phoneNumber: { contains: search } },
          ],
        }
      : {}),
    // Filter by tags if provided (contacts that have ALL specified tags)
    ...(tagFilters.length > 0
      ? {
          AND: tagFilters.map((tagFilter) => ({
            tags: {
              some: {
                tag: {
                  OR: [
                    { id: tagFilter },
                    { name: { equals: tagFilter, mode: "insensitive" as const } },
                  ],
                },
              },
            },
          })),
        }
      : {}),
  };

  const [contacts, total] = await Promise.all([
    db.contact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),
    db.contact.count({ where }),
  ]);

  // Transform contacts to include flat tags array
  const contactsWithTags = contacts.map((contact) => ({
    ...contact,
    tags: contact.tags.map((ct) => ct.tag),
  }));

  return NextResponse.json({
    contacts: contactsWithTags,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}, { requiredPermission: "lists:read" });
