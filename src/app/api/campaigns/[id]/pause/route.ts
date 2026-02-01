import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { pauseCampaign } from "@/lib/queue/dispatcher";

export const POST = apiHandler(async (_req: NextRequest, { params, session }) => {
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

  if (campaign.status !== "running") {
    return NextResponse.json(
      { error: "Campanha não está em execução" },
      { status: 400 }
    );
  }

  await pauseCampaign(params!.id);

  return NextResponse.json({ success: true });
});
