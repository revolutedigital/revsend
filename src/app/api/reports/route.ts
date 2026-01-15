import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Estatísticas gerais
    const [
      totalCampaigns,
      completedCampaigns,
      totalContacts,
      totalSentMessages,
      totalReplies,
    ] = await Promise.all([
      db.campaign.count({
        where: { userId: session.user.id },
      }),
      db.campaign.count({
        where: { userId: session.user.id, status: "completed" },
      }),
      db.contact.count({
        where: {
          list: { userId: session.user.id },
        },
      }),
      db.sentMessage.count({
        where: {
          campaign: { userId: session.user.id },
          status: "sent",
        },
      }),
      db.reply.count({
        where: {
          campaign: { userId: session.user.id },
        },
      }),
    ]);

    // Estatísticas por campanha
    const campaignStats = await db.campaign.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["completed", "running"] },
      },
      select: {
        id: true,
        name: true,
        status: true,
        totalSent: true,
        totalFailed: true,
        totalReplies: true,
        createdAt: true,
        completedAt: true,
        list: {
          select: {
            totalContacts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Estatísticas por WhatsApp
    const whatsappStats = await db.campaignNumber.groupBy({
      by: ["whatsappNumberId"],
      where: {
        campaign: { userId: session.user.id },
      },
      _sum: {
        messagesSent: true,
        repliesReceived: true,
      },
    });

    // Buscar nomes dos WhatsApps
    const whatsappIds = whatsappStats.map((s) => s.whatsappNumberId);
    const whatsappNumbers = await db.whatsappNumber.findMany({
      where: { id: { in: whatsappIds } },
      select: { id: true, name: true, phoneNumber: true },
    });

    const whatsappStatsWithNames = whatsappStats.map((stat) => {
      const wa = whatsappNumbers.find((w) => w.id === stat.whatsappNumberId);
      return {
        id: stat.whatsappNumberId,
        name: wa?.name || "Desconhecido",
        phoneNumber: wa?.phoneNumber || "",
        messagesSent: stat._sum.messagesSent || 0,
        repliesReceived: stat._sum.repliesReceived || 0,
      };
    });

    // Taxa de resposta geral
    const responseRate =
      totalSentMessages > 0
        ? ((totalReplies / totalSentMessages) * 100).toFixed(1)
        : "0";

    return NextResponse.json({
      overview: {
        totalCampaigns,
        completedCampaigns,
        totalContacts,
        totalSentMessages,
        totalReplies,
        responseRate: `${responseRate}%`,
      },
      campaigns: campaignStats.map((c) => ({
        ...c,
        responseRate:
          c.totalSent > 0
            ? ((c.totalReplies / c.totalSent) * 100).toFixed(1) + "%"
            : "0%",
        deliveryRate:
          c.list?.totalContacts && c.list.totalContacts > 0
            ? (
                ((c.totalSent + c.totalFailed) / c.list.totalContacts) *
                100
              ).toFixed(1) + "%"
            : "0%",
      })),
      whatsappStats: whatsappStatsWithNames,
    });
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    return NextResponse.json(
      { error: "Erro ao buscar relatórios" },
      { status: 500 }
    );
  }
}
