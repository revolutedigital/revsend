import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - List all tags in the organization
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const tags = await db.tag.findMany({
    where: { organizationId: session!.user.organizationId! },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { contacts: true },
      },
    },
  });

  return NextResponse.json({ tags });
}, { requiredPermission: "lists:read" });

// POST - Create a new tag
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { name, color } = body;

  if (!name || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Nome da tag é obrigatório" },
      { status: 400 }
    );
  }

  // Check if tag already exists in this organization
  const existing = await db.tag.findUnique({
    where: {
      organizationId_name: {
        organizationId: session!.user.organizationId!,
        name: name.trim(),
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma tag com este nome" },
      { status: 400 }
    );
  }

  const tag = await db.tag.create({
    data: {
      organizationId: session!.user.organizationId!,
      name: name.trim(),
      color: color || "#6B7280",
    },
  });

  return NextResponse.json({ tag }, { status: 201 });
}, { requiredPermission: "lists:create" });
