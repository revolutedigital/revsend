import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - List tags for a contact
export const GET = apiHandler(async (_req: NextRequest, { params, session }) => {
  // Verify contact exists and belongs to organization
  const contact = await db.contact.findFirst({
    where: {
      id: params?.id,
      list: { organizationId: session!.user.organizationId! },
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!contact) {
    return NextResponse.json(
      { error: "Contato não encontrado" },
      { status: 404 }
    );
  }

  const tags = contact.tags.map((ct) => ct.tag);

  return NextResponse.json({ tags });
}, { requiredPermission: "lists:read" });

// POST - Add tags to a contact
export const POST = apiHandler(async (req: NextRequest, { params, session }) => {
  const body = await req.json();
  const { tagIds } = body;

  if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
    return NextResponse.json(
      { error: "tagIds é obrigatório e deve ser um array" },
      { status: 400 }
    );
  }

  // Verify contact exists and belongs to organization
  const contact = await db.contact.findFirst({
    where: {
      id: params?.id,
      list: { organizationId: session!.user.organizationId! },
    },
  });

  if (!contact) {
    return NextResponse.json(
      { error: "Contato não encontrado" },
      { status: 404 }
    );
  }

  // Verify all tags exist and belong to organization
  const tags = await db.tag.findMany({
    where: {
      id: { in: tagIds },
      organizationId: session!.user.organizationId!,
    },
  });

  if (tags.length !== tagIds.length) {
    return NextResponse.json(
      { error: "Uma ou mais tags não foram encontradas" },
      { status: 400 }
    );
  }

  // Add tags to contact (skip duplicates)
  await db.contactTag.createMany({
    data: tagIds.map((tagId: string) => ({
      contactId: params!.id,
      tagId,
    })),
    skipDuplicates: true,
  });

  // Return updated contact with tags
  const updatedContact = await db.contact.findUnique({
    where: { id: params!.id },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return NextResponse.json({
    contact: updatedContact,
    tags: updatedContact?.tags.map((ct) => ct.tag) || [],
  });
}, { requiredPermission: "lists:create" });
