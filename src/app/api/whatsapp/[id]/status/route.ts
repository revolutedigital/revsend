import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getQRCode, getConnection } from "@/lib/whatsapp/store";

export async function GET(
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

    const qrCode = getQRCode(params.id);
    const isConnected = !!getConnection(params.id);

    return NextResponse.json({
      status: number.status,
      qrCode,
      isConnected,
      phoneNumber: number.phoneNumber,
    });
  } catch (error) {
    console.error("Erro ao obter status:", error);
    return NextResponse.json(
      { error: "Erro ao obter status" },
      { status: 500 }
    );
  }
}
