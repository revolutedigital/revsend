import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// GET - Detalhes da campanha
export const GET = apiHandler(async (_req: NextRequest, { params, session }) => {
  const campaign = await db.campaign.findFirst({
    where: {
      id: params?.id,
      userId: session!.user.id,
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
    where: { campaignId: params?.id },
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
});

// DELETE - Excluir campanha
export const DELETE = apiHandler(async (_req: NextRequest, { params, session }) => {
  const campaign = await db.campaign.findFirst({
    where: {
      id: params?.id,
      userId: session!.user.id,
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
    where: { id: params?.id },
  });

  return NextResponse.json({ success: true });
});
