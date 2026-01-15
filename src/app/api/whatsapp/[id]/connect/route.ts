import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { initializeWhatsApp } from "@/lib/whatsapp/client";
import { getQRCode } from "@/lib/whatsapp/store";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o número pertence ao usuário
    const number = await db.whatsappNumber.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!number) {
      return NextResponse.json(
        { error: "Número não encontrado" },
        { status: 404 }
      );
    }

    // Iniciar conexão
    await initializeWhatsApp(params.id, session.user.id);

    // Aguardar um pouco para o QR Code ser gerado
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const qrCode = getQRCode(params.id);

    return NextResponse.json({
      success: true,
      qrCode,
      status: qrCode ? "waiting_qr" : "connecting",
    });
  } catch (error) {
    console.error("Erro ao conectar:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar conexão" },
      { status: 500 }
    );
  }
}
