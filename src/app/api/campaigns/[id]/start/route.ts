import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { startCampaignDispatch } from "@/lib/queue/dispatcher";

export const POST = apiHandler(async (_req: NextRequest, { params, session }) => {
  // Verificar se a campanha pertence à organização
  const campaign = await db.campaign.findFirst({
    where: {
      id: params?.id,
      organizationId: session!.user.organizationId!,
    },
    include: {
      campaignNumbers: {
        include: {
          whatsappNumber: true,
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

  if (campaign.status !== "draft" && campaign.status !== "paused") {
    return NextResponse.json(
      { error: "Campanha não pode ser iniciada" },
      { status: 400 }
    );
  }

  // Verificar se há WhatsApps conectados
  const connectedNumbers = campaign.campaignNumbers.filter(
    (cn) => cn.whatsappNumber.status === "connected"
  );

  if (connectedNumbers.length === 0) {
    return NextResponse.json(
      { error: "Nenhum WhatsApp conectado. Conecte pelo menos um número." },
      { status: 400 }
    );
  }

  // Atomic status update to prevent double dispatch (race condition)
  const updated = await db.campaign.updateMany({
    where: {
      id: params!.id,
      status: { in: ["draft", "paused"] },
    },
    data: { status: "running" },
  });

  if (updated.count === 0) {
    return NextResponse.json(
      { error: "Campanha já está em execução" },
      { status: 409 }
    );
  }

  // Iniciar disparo
  await startCampaignDispatch(params!.id);

  return NextResponse.json({ success: true });
}, { requiredPermission: 'campaigns:start' });
