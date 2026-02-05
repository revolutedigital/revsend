import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { disconnectWhatsApp } from "@/lib/whatsapp/client";

export const POST = apiHandler(async (_req: NextRequest, { params, session }) => {
  // Verificar se o número pertence à organização
  const number = await db.whatsappNumber.findFirst({
    where: {
      id: params?.id,
      organizationId: session!.user.organizationId!,
    },
  });

  if (!number) {
    return NextResponse.json(
      { error: "Número não encontrado" },
      { status: 404 }
    );
  }

  await disconnectWhatsApp(params!.id);

  return NextResponse.json({ success: true });
}, { requiredPermission: "whatsapp:connect" });
