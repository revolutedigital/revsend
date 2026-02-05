import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { getQRCode, getConnection } from "@/lib/whatsapp/store";

export const GET = apiHandler(async (_req: NextRequest, { params, session }) => {
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

  const qrCode = getQRCode(params!.id);
  const isConnected = !!getConnection(params!.id);

  return NextResponse.json({
    status: number.status,
    qrCode,
    isConnected,
    phoneNumber: number.phoneNumber,
  });
}, { requiredPermission: "whatsapp:read" });
