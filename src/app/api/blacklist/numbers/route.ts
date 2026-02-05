import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { addToBlacklist } from "@/lib/lgpd";

// GET - List blacklisted numbers for organization
export const GET = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const search = searchParams.get("search") || "";

  const where = {
    organizationId: session!.user.organizationId!,
    ...(search
      ? {
          OR: [
            { phoneNumber: { contains: search } },
            { reason: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [numbers, total] = await Promise.all([
    db.blacklist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.blacklist.count({ where }),
  ]);

  return NextResponse.json({
    numbers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}, { requiredPermission: "blacklist:read" });

// POST - Add a number to blacklist manually
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { phoneNumber, reason } = body;

  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return NextResponse.json(
      { error: "Número de telefone é obrigatório" },
      { status: 400 }
    );
  }

  // Normalize phone number (remove spaces, dashes)
  const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");

  // Validate phone number format (basic validation)
  if (!/^\+?\d{10,15}$/.test(normalizedPhone)) {
    return NextResponse.json(
      { error: "Formato de telefone inválido" },
      { status: 400 }
    );
  }

  const entry = await addToBlacklist(
    session!.user.organizationId!,
    normalizedPhone,
    reason || "manual",
    session!.user.id
  );

  return NextResponse.json({ entry }, { status: 201 });
}, { requiredPermission: "blacklist:manage" });

// DELETE - Remove a number from blacklist
export const DELETE = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json();
  const { id, phoneNumber } = body;

  if (!id && !phoneNumber) {
    return NextResponse.json(
      { error: "ID ou número de telefone é obrigatório" },
      { status: 400 }
    );
  }

  // If ID provided, delete by ID
  if (id) {
    const existing = await db.blacklist.findFirst({
      where: {
        id,
        organizationId: session!.user.organizationId!,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Número não encontrado na blacklist" },
        { status: 404 }
      );
    }

    await db.blacklist.delete({
      where: { id },
    });
  } else {
    // Delete by phone number
    const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    await db.blacklist.delete({
      where: {
        organizationId_phoneNumber: {
          organizationId: session!.user.organizationId!,
          phoneNumber: normalizedPhone,
        },
      },
    });
  }

  return NextResponse.json({ success: true });
}, { requiredPermission: "blacklist:manage" });
