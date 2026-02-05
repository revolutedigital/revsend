import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - Listar números da organização
export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  const numbers = await db.whatsappNumber.findMany({
    where: { organizationId: session!.user.organizationId! },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ numbers });
}, { requiredPermission: "whatsapp:read" });

// POST - Adicionar novo número
export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const { name } = await req.json();

  // Verificar limite de 4 números por organização
  const count = await db.whatsappNumber.count({
    where: { organizationId: session!.user.organizationId! },
  });

  if (count >= 4) {
    return NextResponse.json(
      { error: "Limite de 4 números atingido" },
      { status: 400 }
    );
  }

  const number = await db.whatsappNumber.create({
    data: {
      userId: session!.user.id,
      organizationId: session!.user.organizationId!,
      name: name || `WhatsApp ${count + 1}`,
      phoneNumber: "",
      status: "disconnected",
    },
  });

  return NextResponse.json({ number }, { status: 201 });
}, { requiredPermission: "whatsapp:connect" });

// DELETE - Remover número
export const DELETE = apiHandler(async (req: NextRequest, { session }) => {
  const { searchParams } = new URL(req.url);
  const numberId = searchParams.get("id");

  if (!numberId) {
    return NextResponse.json(
      { error: "ID do número não fornecido" },
      { status: 400 }
    );
  }

  // Verificar se pertence à organização
  const number = await db.whatsappNumber.findFirst({
    where: {
      id: numberId,
      organizationId: session!.user.organizationId!,
    },
  });

  if (!number) {
    return NextResponse.json(
      { error: "Número não encontrado" },
      { status: 404 }
    );
  }

  await db.whatsappNumber.delete({
    where: { id: numberId },
  });

  return NextResponse.json({ success: true });
}, { requiredPermission: "whatsapp:connect" });
