import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Contar respostas das ultimas 24 horas (consideradas como "nao lidas")
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const count = await db.reply.count({
      where: {
        campaign: {
          userId: session.user.id,
        },
        receivedAt: {
          gte: oneDayAgo,
        },
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Erro ao buscar contagem de respostas:", error);
    return NextResponse.json({ count: 0 });
  }
}
