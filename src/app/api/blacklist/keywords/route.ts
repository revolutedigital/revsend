import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - List blacklist keywords for organization
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const keywords = await db.blacklistKeyword.findMany({
    where: { organizationId: session!.user.organizationId! },
    orderBy: { keyword: "asc" },
  });

  return NextResponse.json({ keywords });
}, { requiredPermission: "blacklist:read" });

// POST - Add a new blacklist keyword
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { keyword } = body;

  if (!keyword || keyword.trim().length === 0) {
    return NextResponse.json(
      { error: "Palavra-chave é obrigatória" },
      { status: 400 }
    );
  }

  const normalizedKeyword = keyword.trim().toLowerCase();

  // Check if keyword already exists
  const existing = await db.blacklistKeyword.findUnique({
    where: {
      organizationId_keyword: {
        organizationId: session!.user.organizationId!,
        keyword: normalizedKeyword,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Esta palavra-chave já está na lista" },
      { status: 400 }
    );
  }

  const newKeyword = await db.blacklistKeyword.create({
    data: {
      organizationId: session!.user.organizationId!,
      keyword: normalizedKeyword,
    },
  });

  return NextResponse.json({ keyword: newKeyword }, { status: 201 });
}, { requiredPermission: "blacklist:manage" });

// DELETE - Remove a blacklist keyword (by ID in body)
export const DELETE = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { id, keyword } = body;

  if (!id && !keyword) {
    return NextResponse.json(
      { error: "ID ou palavra-chave é obrigatório" },
      { status: 400 }
    );
  }

  // If ID provided, delete by ID
  if (id) {
    const existing = await db.blacklistKeyword.findFirst({
      where: {
        id,
        organizationId: session!.user.organizationId!,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Palavra-chave não encontrada" },
        { status: 404 }
      );
    }

    await db.blacklistKeyword.delete({
      where: { id },
    });
  } else {
    // Delete by keyword
    const normalizedKeyword = keyword.trim().toLowerCase();
    await db.blacklistKeyword.delete({
      where: {
        organizationId_keyword: {
          organizationId: session!.user.organizationId!,
          keyword: normalizedKeyword,
        },
      },
    });
  }

  return NextResponse.json({ success: true });
}, { requiredPermission: "blacklist:manage" });
