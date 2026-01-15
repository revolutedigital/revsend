import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pauseCampaign } from "@/lib/queue/dispatcher";

export async function POST(
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

    if (campaign.status !== "running") {
      return NextResponse.json(
        { error: "Campanha não está em execução" },
        { status: 400 }
      );
    }

    await pauseCampaign(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao pausar campanha:", error);
    return NextResponse.json(
      { error: "Erro ao pausar campanha" },
      { status: 500 }
    );
  }
}
