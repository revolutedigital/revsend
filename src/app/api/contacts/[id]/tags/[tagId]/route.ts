import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// DELETE - Remove a tag from a contact
export const DELETE = apiHandler(async (_req: NextRequest, { params, session }) => {
  const contactId = params?.id;
  const tagId = params?.tagId;

  if (!contactId || !tagId) {
    return NextResponse.json(
      { error: "contactId e tagId são obrigatórios" },
      { status: 400 }
    );
  }

  // Verify contact exists and belongs to organization
  const contact = await db.contact.findFirst({
    where: {
      id: contactId,
      list: { organizationId: session!.user.organizationId! },
    },
  });

  if (!contact) {
    return NextResponse.json(
      { error: "Contato não encontrado" },
      { status: 404 }
    );
  }

  // Verify tag exists and belongs to organization
  const tag = await db.tag.findFirst({
    where: {
      id: tagId,
      organizationId: session!.user.organizationId!,
    },
  });

  if (!tag) {
    return NextResponse.json(
      { error: "Tag não encontrada" },
      { status: 404 }
    );
  }

  // Remove tag from contact
  await db.contactTag.deleteMany({
    where: {
      contactId,
      tagId,
    },
  });

  return NextResponse.json({ success: true });
}, { requiredPermission: "lists:create" });
