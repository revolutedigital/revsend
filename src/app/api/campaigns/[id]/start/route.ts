import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startCampaignDispatch } from "@/lib/queue/dispatcher";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se a campanha pertence ao usuário
    const campaign = await db.campaign.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
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

    // Iniciar disparo
    await startCampaignDispatch(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao iniciar campanha:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar campanha" },
      { status: 500 }
    );
  }
}
