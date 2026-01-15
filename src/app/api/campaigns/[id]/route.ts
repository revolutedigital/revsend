import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Detalhes da campanha
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const campaign = await db.campaign.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        list: {
          select: {
            name: true,
            totalContacts: true,
          },
        },
        messages: {
          orderBy: { orderIndex: "asc" },
        },
        campaignNumbers: {
          include: {
            whatsappNumber: {
              select: {
                name: true,
                phoneNumber: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    // Buscar estatísticas
    const stats = await db.sentMessage.groupBy({
      by: ["status"],
      where: { campaignId: params.id },
      _count: true,
    });

    const statsMap = stats.reduce(
      (acc, s) => {
        acc[s.status] = s._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      campaign,
      stats: {
        pending: statsMap["pending"] || 0,
        sent: statsMap["sent"] || 0,
        delivered: statsMap["delivered"] || 0,
        failed: statsMap["failed"] || 0,
        replied: statsMap["replied"] || 0,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar campanha:", error);
    return NextResponse.json(
      { error: "Erro ao buscar campanha" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir campanha
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const campaign = await db.campaign.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    if (campaign.status === "running") {
      return NextResponse.json(
        { error: "Não é possível excluir campanha em execução" },
        { status: 400 }
      );
    }

    await db.campaign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir campanha:", error);
    return NextResponse.json(
      { error: "Erro ao excluir campanha" },
      { status: 500 }
    );
  }
}
