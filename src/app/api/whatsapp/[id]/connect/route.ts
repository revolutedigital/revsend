import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { initializeWhatsApp } from "@/lib/whatsapp/client";
import { getQRCode } from "@/lib/whatsapp/store";

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

  // Iniciar conexão
  await initializeWhatsApp(params!.id, session!.user.id);

  // Aguardar um pouco para o QR Code ser gerado
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const qrCode = getQRCode(params!.id);

  return NextResponse.json({
    success: true,
    qrCode,
    status: qrCode ? "waiting_qr" : "connecting",
  });
}, { requiredPermission: "whatsapp:connect" });
