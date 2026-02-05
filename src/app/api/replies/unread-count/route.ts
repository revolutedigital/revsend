import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = apiHandler(async (_req: NextRequest, { session }) => {
  // Contar respostas das ultimas 24 horas (consideradas como "nao lidas")
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const count = await db.reply.count({
    where: {
      campaign: {
        organizationId: session!.user.organizationId!,
      },
      receivedAt: {
        gte: oneDayAgo,
      },
    },
  });

  return NextResponse.json({ count });
}, { requiredPermission: "campaigns:read" });
