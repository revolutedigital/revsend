import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { disconnectWhatsApp } from "@/lib/whatsapp/client";

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

    await disconnectWhatsApp(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao desconectar:", error);
    return NextResponse.json(
      { error: "Erro ao desconectar" },
      { status: 500 }
    );
  }
}
