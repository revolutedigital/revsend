import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - Get a single tag
export const GET = apiHandler(async (_req: NextRequest, { params, session }) => {
  const tag = await db.tag.findFirst({
    where: {
      id: params?.id,
      organizationId: session!.user.organizationId!,
    },
    include: {
      _count: {
        select: { contacts: true },
      },
    },
  });

  if (!tag) {
    return NextResponse.json(
      { error: "Tag não encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({ tag });
}, { requiredPermission: "lists:read" });

// PUT - Update a tag
export const PUT = apiHandler(async (req: NextRequest, { params, session }) => {
  const body = await req.json();
  const { name, color } = body;

  // Check if tag exists and belongs to organization
  const existing = await db.tag.findFirst({
    where: {
      id: params?.id,
      organizationId: session!.user.organizationId!,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Tag não encontrada" },
      { status: 404 }
    );
  }

  // Check if new name conflicts with another tag
  if (name && name.trim() !== existing.name) {
    const nameConflict = await db.tag.findUnique({
      where: {
        organizationId_name: {
          organizationId: session!.user.organizationId!,
          name: name.trim(),
        },
      },
    });

    if (nameConflict) {
      return NextResponse.json(
        { error: "Já existe uma tag com este nome" },
        { status: 400 }
      );
    }
  }

  const tag = await db.tag.update({
    where: { id: params!.id },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(color ? { color } : {}),
    },
  });

  return NextResponse.json({ tag });
}, { requiredPermission: "lists:create" });

// DELETE - Delete a tag
export const DELETE = apiHandler(async (_req: NextRequest, { params, session }) => {
  // Check if tag exists and belongs to organization
  const tag = await db.tag.findFirst({
    where: {
      id: params?.id,
      organizationId: session!.user.organizationId!,
    },
  });

  if (!tag) {
    return NextResponse.json(
      { error: "Tag não encontrada" },
      { status: 404 }
    );
  }

  // Delete tag (ContactTag entries will be deleted by cascade)
  await db.tag.delete({
    where: { id: params!.id },
  });

  return NextResponse.json({ success: true });
}, { requiredPermission: "lists:delete" });
